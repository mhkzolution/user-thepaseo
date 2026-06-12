"use client";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import Loading from "@/components/loading";
import RedeemCodeTabs from "@/components/coupon/RedeemCodeTabs";

export default function MyCouponsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      const res = await fetch(`${API_URL}/user/coupon`, {
        credentials: "include",
      });
      const data = await res.json();
      setCoupons(data);
      setLoading(false);
    };
    fetchCoupons();
  }, []);

  if (loading) return <Loading />;
  if (!coupons.length) return <p className="text-center text-gray-500">คุณยังไม่มีคูปอง</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold mb-4">🎟️ คูปองของฉัน</h1>

      {coupons.map((uc) => (
        <div key={uc.id} className="border rounded-lg p-4 shadow-sm bg-white">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-semibold">{uc.coupon.name}</h2>
              <p className="text-sm text-gray-500">
                หมดอายุ: {new Date(uc.coupon.expiresAt).toLocaleDateString("th-TH")}
              </p>
            </div>
            <div>
              {uc.used ? (
                <span className="text-red-500 text-sm font-semibold">ใช้แล้ว</span>
              ) : (
                <span className="text-green-600 text-sm font-semibold">ยังไม่ใช้</span>
              )}
            </div>
          </div>

          {uc.coupon.imageUrl && (
            <Image
              width={600}
              height={600}
              src={uc.coupon.imageUrl}
              alt={uc.coupon.name}
              className="w-full rounded-lg mb-2 object-cover"
              unoptimized
              priority
              placeholder="blur"
              blurDataURL="/blur-placeholder.jpg"
            />
          )}

          {!uc.used && uc.redeemCode && (
            <div className="mt-4">
              <RedeemCodeTabs redeemCode={uc.redeemCode} />
            </div>
          )}

          {uc.used && (
            <p className="text-center text-gray-500 text-sm mt-3">
              ✅ ใช้เมื่อ {new Date(uc.usedAt).toLocaleString("th-TH")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
