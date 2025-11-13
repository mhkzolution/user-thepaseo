"use client";

import { useEffect, useState } from "react";

interface RewardVerifyItem {
  id: string;
  rewardName: string;
  userName: string;
  userPhone: string;
  redeemCode?: string;
  redeemedAt?: string;
}

export default function RewardVerifyPage() {
  const [rewards, setRewards] = useState<RewardVerifyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reward/verify");
      const data = await res.json();
      setRewards(data);
    } catch (err) {
      console.error("Error loading rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleVerify = async (id: string) => {
    if (!confirm("ยืนยันการใช้รางวัลนี้?")) return;

    setVerifying(id);
    try {
      const res = await fetch("/api/admin/reward/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถยืนยันได้");

      alert("✅ ยืนยันรางวัลเรียบร้อยแล้ว");
      fetchRewards(); // reload list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-row justify-between mb-4">
            <h1 className="text-2xl font-bold">ตรวจสอบการใช้รางวัล</h1>
        </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : rewards.length === 0 ? (
        <p className="text-gray-500">ไม่มีรางวัลที่รอตรวจสอบ</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-2">รางวัล</th>
                <th className="px-4 py-2">ลูกค้า</th>
                <th className="px-4 py-2">เบอร์โทร</th>
                <th className="px-4 py-2">รหัสอ้างอิง</th>
                <th className="px-4 py-2">วันที่แลก</th>
                <th className="px-4 py-2 text-center">ยืนยัน</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.rewardName}</td>
                  <td className="px-4 py-2">{r.userName}</td>
                  <td className="px-4 py-2">{r.userPhone}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {r.redeemCode || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {r.redeemedAt
                      ? new Date(r.redeemedAt).toLocaleString("th-TH")
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleVerify(r.id)}
                      disabled={verifying === r.id}
                      className={`px-3 py-1 rounded-lg text-white ${
                        verifying === r.id
                          ? "bg-gray-400"
                          : "bg-paseo hover:bg-paseo-hover"
                      }`}
                    >
                      {verifying === r.id ? "กำลังยืนยัน..." : "ยืนยัน"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            </div>
        )}
    </div>
  );
}
