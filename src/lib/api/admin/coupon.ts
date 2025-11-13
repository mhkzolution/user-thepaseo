export async function getCouponOverview() {
  const res = await fetch("/api/admin/dashboard/coupon", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch coupon dashboard data")
  return res.json()
}
