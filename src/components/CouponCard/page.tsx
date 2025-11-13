//components/CouponCard
'use client';

import { useEffect, useState } from 'react';
import GreenCard from '@/components/GreenCard/page';
import { RiCoupon2Fill } from "react-icons/ri";
import Link from 'next/link';

import { MdVerified } from "react-icons/md";

// Define the structure for a single coupon
interface CouponData {
  id: string;
  used: boolean;
  assignedAt: string;
  coupon: {
    id: string;
    code: string;
    name: string;
    expiresAt: string;
    imageUrl: string;
  };
}

// Update the UserProfileData interface to include the full coupons array
interface UserProfileData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  branch?: { name: string };
  residenceType?: string;
  houseNumber?: string;
  alley?: string;
  subDistrict?: string;
  district?: string;
  postalCode?: string;
  avatar?: string;
  point: number;
  coupons: CouponData[]; // Changed from 'coupon: number' to 'coupons: CouponData[]'
  totalSpending: number;
  referralCode: string;
  referredBy?: string;
}

const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return null;

  // ถ้าเป็น URL เต็ม (http หรือ https) → ใช้ได้เลย
  if (avatar.startsWith("http")) {
    return avatar;
  }

  // ถ้าเป็นแค่ชื่อไฟล์ → ชี้ไปที่ public/user/profile
  return `/user/profile/${avatar}`;
};

export default function CouponCard() {
  const [user, setUser] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUser();
  }, []);

  if (!user) return <div className="text-center p-6">Loading...</div>;

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <GreenCard title="โปรไฟล์ของคุณ">
      <div className="mt-4">
        {user.coupons.length > 0 ? (
          <div className="list-disc list-inside text-gray-700">
            {user.coupons.map((userCoupon) => {
              const expired =
                new Date(userCoupon.coupon.expiresAt) < new Date();
              return (
              <div key={userCoupon.id} className="mb-2 border p-4 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                  <div className="w-70%">
                    <p className="font-semibold">{userCoupon.coupon.name}</p>
                  </div>

                  <div className="w-32 text-right">
                      {userCoupon.used ? (
                        <span className="inline-flex items-center justify-center w-full px-3 py-1 bg-gray-300 text-gray-500 rounded-lg text-sm gap-1">
                          <MdVerified size={16} /> ใช้แล้ว
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center justify-center w-full px-3 py-1 bg-red-300 text-gray-700 rounded-lg text-sm">
                          หมดอายุ
                        </span>
                      ) : (
                        <Link
                          href={`/profile/coupon/${userCoupon.id}`}
                          className="inline-flex items-center justify-center w-full px-3 py-2 bg-paseo hover:bg-paseo-hover text-white rounded-lg text-sm gap-1"
                        >
                          <RiCoupon2Fill size={16} />
                          <span className="text-white text-xs whitespace-nowrap">ใช้คูปอง</span>
                          
                        </Link>
                      )}
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  <div className="w-70%">
                    <p className="text-sm">Code: {userCoupon.coupon.code}</p>
                  </div>

                  <div className="w-30%">
                    {!userCoupon.used && (
                    <p className="text-xs text-gray-500 text-right whitespace-nowrap">
                      หมดอายุ: {new Date(userCoupon.coupon.expiresAt).toLocaleDateString("th-TH")}
                    </p>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No coupons available.</p>
        )}
        </div>
           
    </GreenCard>
  );
}