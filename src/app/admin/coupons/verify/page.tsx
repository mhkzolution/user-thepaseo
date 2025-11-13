"use client";

import { useEffect, useState } from "react";

interface CouponVerifyItem {
  id: string;
  redeemCode?: string;
  couponName: string;
  couponCode: string;
  userName: string;
  userPhone: string;
  usedAt?: string;
}

export default function CouponVerifyPage() {
  const [coupons, setCoupons] = useState<CouponVerifyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons/verify");
      const data = await res.json();
      setCoupons(data);
    } catch (err) {
      console.error("Error loading coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleVerify = async (couponId: string) => {
    if (!confirm("ยืนยันการใช้คูปองนี้?")) return;

    setVerifying(couponId);
    try {
      const res = await fetch("/api/admin/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถยืนยันได้");

      alert("✅ ยืนยันคูปองเรียบร้อยแล้ว");
      fetchCoupons(); // reload list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-row justify-between mb-4">
            <h1 className="text-2xl font-bold">ตรวจสอบการใช้คูปอง</h1>
        </div>

        {loading ? (
            <p>กำลังโหลด...</p>
        ) : coupons.length === 0 ? (
            <p className="text-gray-500">ไม่มีคูปองที่รอตรวจสอบ</p>
        ) : (
            <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 uppercase">
                <tr>
                    <th className="px-4 py-2">คูปอง</th>
                    <th className="px-4 py-2">ลูกค้า</th>
                    <th className="px-4 py-2">เบอร์โทร</th>
                    <th className="px-4 py-2">รหัสอ้างอิง</th>
                    <th className="px-4 py-2">วันที่ใช้</th>
                    <th className="px-4 py-2 text-center">ยืนยัน</th>
                </tr>
                </thead>
                <tbody>
                {coupons.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{c.couponName}</td>
                    <td className="px-4 py-2">{c.userName}</td>
                    <td className="px-4 py-2">{c.userPhone}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                        {c.redeemCode || "-"}
                    </td>
                    <td className="px-4 py-2">
                        {c.usedAt
                        ? new Date(c.usedAt).toLocaleString("th-TH")
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-center">
                        <button
                        onClick={() => handleVerify(c.id)}
                        disabled={verifying === c.id}
                        className={`px-3 py-1 rounded-lg text-white ${
                            verifying === c.id
                            ? "bg-gray-400"
                            : "bg-paseo hover:bg-paseo-hover"
                        }`}
                        >
                        {verifying === c.id ? "กำลังยืนยัน..." : "ยืนยัน"}
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
