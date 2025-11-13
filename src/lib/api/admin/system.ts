export async function getSystemDashboard() {
  const res = await fetch("/api/admin/dashboard/system", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch system dashboard data")
  return res.json()
}
