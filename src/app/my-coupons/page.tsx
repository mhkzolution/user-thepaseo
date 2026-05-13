"use client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import Loading from "@/components/loading";

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

          {!uc.used && (
            <div className="text-center mt-4">
              <h3 className="font-semibold mb-2">สแกน QR Code เพื่อใช้คูปอง</h3>
              <div className="flex flex-col items-center">
                <QRCode
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/admin/coupons/verify/${uc.coupon.code}`}
                  size={140}
                />
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${process.env.NEXT_PUBLIC_APP_URL}/admin/coupons/verify/${uc.coupon.code}`
                    )
                  }
                  className="mt-3 px-3 py-1 bg-gray-100 border rounded text-sm text-gray-700 hover:bg-gray-200"
                >
                  📋 คัดลอกลิงก์ยืนยัน
                </button>
              </div>
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
