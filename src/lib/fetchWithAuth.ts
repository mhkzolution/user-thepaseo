/** สถานะที่มักเกิดชั่วคราวจากเซิร์ฟเวอร์/โหลด — รีทรายได้ช่วยลดอาการต้องรีเฟรชหน้าเอง */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export type FetchWithAuthRetry = {
  /** จำนวนครั้งที่ลองใหม่หลังความล้มเหลวครั้งแรก (ค่าเริ่มต้น 2 = รวมสูงสุด 3 ครั้ง) */
  maxRetries?: number
  baseDelayMs?: number
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retry?: FetchWithAuthRetry
) {
  if (!url || typeof url !== "string") {
    throw new Error("fetchWithAuth: invalid URL")
  }

  let token = localStorage.getItem("token")

  // ⭐ กัน Safari / timing bug
  if (!token && typeof window !== "undefined") {
    token = window.localStorage.getItem("token")
  }

  const headers = new Headers(options.headers || {})
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData

  // ใส่ Content-Type เฉพาะ body แบบ JSON เท่านั้น
  if (!headers.has("Content-Type") && !isFormDataBody) {
    headers.set("Content-Type", "application/json")
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const maxRetries = retry?.maxRetries ?? 2
  const baseDelayMs = retry?.baseDelayMs ?? 400

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
      })

      const retryable =
        !res.ok && RETRYABLE_STATUS.has(res.status) && attempt < maxRetries

      if (!retryable) {
        return res
      }

      await delay(baseDelayMs * 2 ** attempt)
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries) {
        throw new Error(
          `fetchWithAuth failed for ${url}: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        )
      }
      await delay(baseDelayMs * 2 ** attempt)
    }
  }

  throw new Error(
    `fetchWithAuth failed for ${url}: ${
      lastError instanceof Error ? lastError.message : "unknown error"
    }`
  )
}