// app/shop/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from "next/image";
import HeaderMobile from '@/components/HeaderMobile/page';
import Loading from '@/components/loading';
import CouponList from '@/components/CouponList/page';
import EventList from '@/components/EventList/page';
import RewardList from '@/components/RewardList/page';


interface Reward {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  pointCost: number | null;
  pointEarn: number | null;
  quantity: number | null;
  maxPerUser: number | null;
  startDate: string;
  endDate: string;
  participantCount: number;
}

interface Coupon {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  expiresAt?: string;
  startDate: string;
  endDate: string;
  pointCost?: number;
  pointEarn?: number;
};

interface Event {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  startDate: string;
  endDate: string;
  registrations: number;
}

interface Shop {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  imageUrl: string | null;
  zone: string;
  location: string;
  category: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  rewards: Reward[];
  coupon: Coupon[];
  event: Event[];
}

export default function ShopPage() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetch(`/api/shop/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch shop');
        }
        const data = await response.json();
        setShop(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, [id]);

  if (loading) return 
    <Loading />
  ;
  if (error) return <div>Error: {error}</div>;
  if (!shop) return <div>Shop not found</div>;

  return (
    <div className="">
      <HeaderMobile />

      <div className="max-w-2xl mx-auto p-0 -mb-14 md:mt-20 md:-mb-16 rounded-xl">
        <div className="w-full pt-4 px-10 md:pt-0 md:px-20 md:pb-0 flex justify-center">
          {shop.logoUrl && (
              <Image
                src={shop.logoUrl}
                alt={shop.name}
                width={200}
                height={200}
                className="object-cover rounded-lg shadow-lg"
              />
            )}
        </div>
      </div>
          

          
    <div className="max-w-2xl mx-auto p-0 pt-20 pb-20 bg-gray-100 rounded-t-5xl rounded-b-xl">
         <div className="p-4 px-4 pt-0 md:p-10 md:pt-0">
          <div className="flex flex-col justify-between align-start gap-4 bg-white p-4 rounded-2xl shadow-md">
            <h1 className="text-2xl font-bold">{shop.name}</h1>
              <div className="flex flex-row justify-between">
                {shop.category && (
                  <p className="text-sm text-gray-500">หมวดหมู่: {shop.category.name}</p>
                )}

                {shop.branch && (
                  <p className="text-sm text-gray-500">สาขา: {shop.branch.name}</p>
                )}
              </div>

              <div className="flex flex-row justify-between gap-2">
                <div className="w-50" style={{width:'50%'}}>
                  <h2 className="font-semibold">โซน</h2>
                  <p>{shop.zone || "-"}</p>
                </div>
        
                <div className="w-50" style={{width:'50%'}}>
                  <h2 className="font-semibold">ที่ตั้ง</h2>
                  <p>{shop.location || "-"}</p>
                </div>
              </div>
            

            {shop.description && 
              <div className="mb-2">
                <p className="text-base text-gray-700 mt-2">รายละเอียด</p>
                <div
                  className="prose text-base mb-2 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                  dangerouslySetInnerHTML={{ __html: shop.description }}
                />
              </div>
            }

          </div>
        </div>

        <div className="p-4 px-4 pt-0 md:p-10 md:pt-0 flex flex-col gap-4">

          
          
          {shop.rewards && shop.rewards.length > 0 && (
            <section className="flex flex-col justify-between align-start gap-4 bg-white p-4 rounded-2xl shadow-md">
              
              <RewardList shopId={id as string} />
                
            </section>
          )}

          {shop.coupon && shop.coupon.length > 0 && (
            <section className="flex flex-col justify-between align-start gap-4 bg-white p-4 rounded-2xl shadow-md">
              
              <CouponList shopId={id as string} />
                
            </section>
          )}

          {shop.event && shop.event.length > 0 && (
            <section className="flex flex-col justify-between align-start gap-4 bg-white p-4 rounded-2xl shadow-md">
              
              <EventList shopId={id as string} />
                
            </section>
          )}
        </div>

        </div>
    </div>
  );
}