export async function getTransactionOverview() {
  const res = await fetch("/api/admin/dashboard/transaction", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch transaction data");
  return res.json();
}
