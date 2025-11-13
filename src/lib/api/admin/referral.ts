export async function getReferralOverview() {
  const res = await fetch("/api/admin/dashboard/referral", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch referral dashboard data");
  return res.json();
}
