export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token")

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // 🔥 ถ้า token หมดอายุ หรือไม่ถูกต้อง
  if (res.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/auth/login"
    return res
  }

  return res
}