export async function getPointOverview() {
  const res = await fetch("/api/admin/dashboard/points", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch point data")
  return res.json()
}
