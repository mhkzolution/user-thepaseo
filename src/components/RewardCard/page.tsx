'use client';

import { useEffect, useState } from 'react';
import GreenCard from '@/components/GreenCard/page';
import Link from 'next/link';
import { RiCoupon2Fill } from "react-icons/ri";
import { MdVerified } from "react-icons/md";

interface RewardData {
  id: string; // rewardParticipation.id
  redeemed: boolean;
  redeemedAt?: string;
  redeemCode?: string;
  joinedAt: string;
  reward: {
    id: string;
    name: string;
    imageUrl?: string;
    endDate?: string;
    pointCost?: number;
  };
}

export default function RewardCard() {
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch('/api/profile/reward');
        const data = await res.json();
        if (res.ok && data.rewards) {
          setRewards(data.rewards);
        }
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  if (loading) return <div className="text-center p-6">กำลังโหลด...</div>;

  return (
    <GreenCard title="รางวัลของฉัน">
      <div className="mt-4">
        {rewards.length > 0 ? (
          <div className="text-gray-700">
            {rewards.map((reward) => {
              const expired = reward.reward.endDate
                ? new Date(reward.reward.endDate) < new Date()
                : false;

              return (
                <div
                  key={reward.id}
                  className="mb-2 border p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="w-70%">
                      <p className="font-semibold">{reward.reward.name}</p>
                    </div>

                    

                    {/* สถานะ */}
                    <div className="w-32 text-right">
                      {reward.redeemed ? (
                        <span className="inline-flex items-center justify-center w-full px-3 py-1 text-gray-500 text-white rounded-lg text-sm gap-1">
                          <MdVerified size={16} /> ใช้แล้ว
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center justify-center w-full px-3 py-1 bg-red-300 text-gray-700 rounded-lg text-sm">
                          หมดอายุ
                        </span>
                      ) : (
                        <Link
                          href={`/profile/reward/${reward.id}`}
                          className="inline-flex items-center justify-center w-full px-3 py-2 bg-paseo hover:bg-paseo-hover text-white rounded-lg text-sm gap-1"
                        >
                          <RiCoupon2Fill size={16} />
                          <span className="text-white text-xs whitespace-nowrap">ใช้รางวัล</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4 mt-2">
                    <div className="w-70%">
                      <p className="text-sm">
                        วันที่แลก: {new Date(reward.joinedAt).toLocaleDateString("th-TH")}
                      </p>
                      {reward.reward.pointCost && (
                        <p className="text-sm text-gray-500">
                          ใช้แต้ม: {reward.reward.pointCost} พอยท์
                        </p>
                      )}
                    </div>

                    <div className="w-30%">
                      {reward.reward.endDate && (
                        <p className="text-xs text-gray-500 text-right whitespace-nowrap">
                          หมดอายุ:{" "}
                          {new Date(reward.reward.endDate).toLocaleDateString("th-TH")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            คุณยังไม่มีรางวัลที่แลกไว้
          </p>
        )}
      </div>
    </GreenCard>
  );
}
