// /lib/api/admin/dashboard.ts
export async function getDashboardSummary() {
  const res = await fetch("/api/admin/dashboard", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch dashboard data")
  return res.json()
}
