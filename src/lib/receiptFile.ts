const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|hei[cf]|tif{1,2})$/i;

/** Align with server normalizeReceiptUpload */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.78;

export class ReceiptFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceiptFileError";
  }
}

/** iPhone/LINE often send empty File.type or application/octet-stream */
export function isImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (mime === "application/pdf") return false;
  return IMAGE_EXT_RE.test(file.name);
}

function isHeicLike(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    /\.hei[cf]$/i.test(file.name)
  );
}

function mimeFromExt(name: string): string | null {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return null;
  switch (m[1]) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return null;
  }
}

async function canvasToJpegFile(
  source: CanvasImageSource,
  width: number,
  height: number,
  baseName: string
): Promise<File | null> {
  let w = width;
  let h = height;
  const maxSide = Math.max(w, h);
  if (maxSide > MAX_EDGE) {
    const scale = MAX_EDGE / maxSide;
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return null;

  const base = baseName.replace(/\.[^.]+$/, "") || "receipt";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

async function heicToJpegViaLib(file: File): Promise<File> {
  // heic2any touches `window` at load time — only import in the browser
  if (typeof window === "undefined") {
    throw new Error("HEIC conversion is client-only");
  }
  // Dynamic import: heic2any reads `window` at load time (SSR-unsafe)
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const base = file.name.replace(/\.[^.]+$/, "") || "receipt";
  const jpegFile = new File([blob], `${base}.jpg`, { type: "image/jpeg" });

  // Resize if still large
  try {
    const bitmap = await createImageBitmap(jpegFile);
    const out = await canvasToJpegFile(
      bitmap,
      bitmap.width,
      bitmap.height,
      jpegFile.name
    );
    bitmap.close();
    if (out) return out;
  } catch {
    /* keep converted jpeg as-is */
  }

  return jpegFile;
}

/**
 * Resize / convert HEIC→JPEG before upload.
 * Throws ReceiptFileError if HEIC cannot be converted (do not upload raw HEIC).
 */
export async function normalizeReceiptImage(file: File): Promise<File> {
  if (!isImageFile(file)) return file;

  const mime = (file.type || "").toLowerCase();

  if (isHeicLike(file)) {
    // Safari/iOS: createImageBitmap often works
    try {
      const bitmap = await createImageBitmap(file);
      const out = await canvasToJpegFile(
        bitmap,
        bitmap.width,
        bitmap.height,
        file.name
      );
      bitmap.close();
      if (out) return out;
    } catch {
      /* fall through to heic2any */
    }

    try {
      return await heicToJpegViaLib(file);
    } catch (err) {
      console.error("HEIC convert failed:", err);
      throw new ReceiptFileError(
        "ไม่สามารถแปลงไฟล์ HEIC ได้ กรุณาบันทึกรูปเป็น JPEG แล้วลองใหม่"
      );
    }
  }

  try {
    const bitmap = await createImageBitmap(file);
    const needsResize = Math.max(bitmap.width, bitmap.height) > MAX_EDGE;
    const isJpeg = mime === "image/jpeg";
    const needsReencode = needsResize || !isJpeg;

    if (!needsReencode) {
      bitmap.close();
      return file;
    }

    const out = await canvasToJpegFile(
      bitmap,
      bitmap.width,
      bitmap.height,
      file.name
    );
    bitmap.close();
    if (out) return out;
  } catch {
    if (!mime || mime === "application/octet-stream") {
      const inferred = mimeFromExt(file.name) || "image/jpeg";
      if (
        inferred.startsWith("image/") &&
        inferred !== "image/heic" &&
        inferred !== "image/heif"
      ) {
        return new File([file], file.name, { type: inferred });
      }
    }
  }

  return file;
}

export async function normalizeReceiptFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => normalizeReceiptImage(f)));
}
