"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CouponVerifyPage() {
  const { code } = useParams();
  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!code) return;
    const fetchData = async () => {
      const res = await fetch(`/api/coupon/verify/${code}`);
      const data = await res.json();
      setCoupon(data);
      setLoading(false);
    };
    fetchData();
  }, [code]);

  if (loading) return <p>กำลังโหลด...</p>;
  if (!coupon) return <p>ไม่พบคูปอง</p>;

  const handleUse = async (userId: string) => {
    if (!confirm("ยืนยันการใช้คูปองนี้?")) return;
    const res = await fetch(`/api/coupon/verify/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    alert(data.message || data.error);
    location.reload();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-xl font-bold mb-2">ตรวจสอบคูปอง</h1>
      <p className="text-gray-600">Code: {coupon.code}</p>
      <h2 className="text-lg mt-2">{coupon.name}</h2>
      <p className="text-sm text-gray-500">หมดอายุ: {new Date(coupon.expiresAt).toLocaleDateString("th-TH")}</p>
      <p className={`font-semibold mt-2 ${coupon.status === "USED" ? "text-red-500" : "text-green-600"}`}>
        สถานะ: {coupon.status}
      </p>

      {coupon.userCoupons.map((uc: any) => (
        <div key={uc.id} className="mt-4 border-t pt-2">
          <p>👤 {uc.userName || "ไม่ระบุ"}</p>
          <p>📞 {uc.phone}</p>
          {uc.used ? (
            <p className="text-red-500 text-sm mt-1">ใช้แล้วเมื่อ {new Date(uc.usedAt).toLocaleString("th-TH")}</p>
          ) : (
            <button
              onClick={() => handleUse(uc.userId)}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
            >
              ✅ ยืนยันการใช้คูปอง
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
