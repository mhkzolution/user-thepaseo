export async function getRedemptionOverview() {
  const res = await fetch("/api/admin/dashboard/redemption", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch redemption data")
  return res.json()
}
