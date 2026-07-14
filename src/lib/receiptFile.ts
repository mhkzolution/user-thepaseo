const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|hei[cf]|tif{1,2})$/i;

/** iPhone/LINE มักส่ง File.type ว่าง หรือ application/octet-stream */
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

/**
 * แก้ MIME ว่าง / HEIC → JPEG ก่อนอัปโหลด
 * (Safari/iOS มัก decode HEIC ได้; ถ้าไม่ได้คืนไฟล์เดิม)
 */
export async function normalizeReceiptImage(file: File): Promise<File> {
  if (!isImageFile(file)) return file;

  const mime = (file.type || "").toLowerCase();

  // HEIC → JPEG เพื่อให้ admin (Chrome) แสดงรูปได้
  if (isHeicLike(file)) {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) return file;

      const base = file.name.replace(/\.[^.]+$/, "") || "receipt";
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    } catch {
      return file;
    }
  }

  // MIME ว่าง / octet-stream แต่เป็นรูปปกติ — ใส่ type ให้ถูกโดยไม่ re-encode
  if (!mime || mime === "application/octet-stream") {
    const inferred = mimeFromExt(file.name) || "image/jpeg";
    if (inferred.startsWith("image/") && inferred !== "image/heic" && inferred !== "image/heif") {
      return new File([file], file.name, { type: inferred });
    }
  }

  return file;
}

export async function normalizeReceiptFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => normalizeReceiptImage(f)));
}
