// app/shop/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Image from "next/image";
import HeaderMobile from '@/components/HeaderMobile/page';
import Loading from '@/components/loading';
import CouponList from '@/components/CouponList/page';
import EventList from '@/components/EventList/page';
import RewardList from '@/components/RewardList/page';
import { getShopStatus } from "@/lib/shopHours"

import { FaPhoneAlt } from "react-icons/fa";

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
  phone: string | null;
  hours: any[];
  logoUrl: string | null;
  imageUrl: string | null;
  zone: {
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null;
  location: string;
  category: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  rewards: Reward[];
  coupon: Coupon[];
  event: Event[];
}

export default function ShopPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShop() {
      try {
        const response = await fetchWithAuth(`${API_URL}/shop/${id}`);
        if (!response.ok) {
          throw new Error("โหลดข้อมูลร้านไม่สำเร็จ");
        }
        const data = await response.json();
        setShop(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, [id]);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-24 text-center text-gray-600">
        <p className="font-semibold text-gray-800">ไม่สามารถแสดงร้านค้าได้</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }
  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-24 text-center text-gray-600">
        <p className="font-semibold text-gray-800">ไม่พบร้านค้า</p>
        <p className="mt-2 text-sm">ร้านนี้อาจถูกลบหรือย้ายไปแล้ว</p>
      </div>
    );
  }

  const hasShopImage = Boolean(shop.imageUrl?.trim());
  const status = getShopStatus(shop.hours)
  const today = new Date().getDay()

  return (
    <div className="md:pt-4 pt-16">
      <HeaderMobile />

      <div className="max-w-2xl mx-auto p-0rounded-xl">

        <div className="relative">

          <div className="max-w-2xl mx-auto p-0 px-0 mb-0 md:mt-20 md:mb-0 rounded-xl">
            <div className="relative w-full aspect-[2/1] min-h-[180px] overflow-hidden rounded-t-3xl bg-gradient-to-br from-gray-50 via-paseo-hover/30 to-gray-100">
              {hasShopImage ? (
                <Image
                  src={shop.imageUrl!}
                  alt={`รูปร้าน ${shop.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                  unoptimized
                  priority
                  placeholder="blur"
                  blurDataURL="/blur-placeholder.jpg"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center px-6 text-center"
                  aria-label="ยังไม่มีรูปร้าน"
                >
                  <p className="text-sm font-semibold text-gray-700">
                    ยังไม่มีรูปร้าน
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    ดูรายละเอียดร้านได้ด้านล่าง
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-2xl mx-auto -mt-10 md:pt-6 md:px-6 pt-4 px-4 md:pb-20 pb-4 bg-white rounded-t-3xl rounded-b-xl shadow-xl relative z-48">
              <div className="flex flex-col justify-between align-start gap-2">
                <h1 className="md:text-2xl text-xl font-bold">{shop.name}</h1>

                <div className="flex md:flex-row flex-col md:items-center md:justify-between gap-4">
                {status && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        status.open
                          ? "bg-paseo text-white"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {status.open ? "เปิดอยู่" : "ปิดอยู่"}
                    </span>

                    <span className="text-sm text-gray-600">
                      {status.open
                        ? `ปิดเวลา ${status.closeTime} น.`
                        : `เปิดเวลา ${status.openTime} น.`}
                    </span>
                  </div>
                )}

                <div className="flex gap-4">

                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center justify-center gap-2
                      bg-paseo-hover text-paseo-dark font-medium  text-sm
                      py-1.5 px-2 rounded-full 
                      hover:opacity-90 transition"
                    >
                      <FaPhoneAlt size={24} className="text-white md:p-1.5 p-1 bg-paseo-dark rounded-full" />
                      {shop.phone}
                    </a>
                  )}

                </div>

                </div>

                

                <div className="flex flex-row w-full gap-4 mt-4">

                  {shop.branch && (
                    <div className="relative flex flex-row w-full bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg shadow-sm">
                      <p className="absolute -top-2 left-1 text-xs text-black font-semibold bg-paseo-hover border border-paseo-dark py-0 px-2 rounded-md">สาขา</p>
                      <p className="mt-4 text-xs text-gray-600">{shop.branch?.name || '-'}</p>
                    </div>
                  )}

                  {shop.category && (
                    <div className="relative flex flex-row w-full bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg shadow-sm">
                      <p className="absolute -top-2 left-1 text-xs text-black font-semibold bg-paseo-hover border border-paseo-dark py-0 px-2 rounded-md">ประเภท</p>
                      <p className="mt-4 text-xs text-gray-600">{shop.category?.name || '-'}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row w-full gap-4 mt-4">

                  {shop.zone && (
                    <div className="relative flex flex-row w-full bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg shadow-sm">
                      <p className="absolute -top-2 left-1 text-xs text-black font-semibold bg-paseo-hover border border-paseo-dark py-0 px-2 rounded-md">
                        โซน
                      </p>

                      <p className="mt-4 text-xs text-gray-600">
                        {shop.zone.name}
                      </p>
                    </div>
                  )}

                  {shop.location && (
                    <div className="relative flex flex-row w-full bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg shadow-sm">
                      <p className="absolute -top-2 left-1 text-xs text-black font-semibold bg-paseo-hover border border-paseo-dark py-0 px-2 rounded-md">ที่ตั้ง</p>
                      <p className="mt-4 text-xs text-gray-600">{shop.location || "-"}</p>
                    </div>
                  )}

                </div>

                <div className="flex flex-row w-full gap-4 mt-4">
                  {shop.hours && shop.hours.length > 0 && (
                    <div className="relative flex flex-col w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg shadow-sm">
                      
                      <p className="absolute -top-2 left-1 text-xs text-black font-semibold bg-paseo-hover border border-paseo-dark py-0 px-2 rounded-md">
                        เวลาเปิดทำการ
                      </p>

                      <div className="mt-4 text-xs text-gray-600 space-y-1">
                        {shop.hours.map((h:any) => {
                          const days = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"]

                          return (
                            <div
                              key={h.dayOfWeek}
                              className={`flex justify-between ${
                                today === h.dayOfWeek ? "font-bold text-paseo-dark" : ""
                              }`}
                            >
                              <span>{days[h.dayOfWeek]}</span>

                              {h.isClosed ? (
                                <span className="text-gray-400">ปิด</span>
                              ) : (
                                <span>
                                  {h.openTime} - {h.closeTime}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
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

                {shop.zone?.imageUrl && (
                  <div className="mt-4">
                    <p className="text-base text-gray-700 mb-2">แผนผังโซน</p>

                    <Image
                      src={shop.zone.imageUrl}
                      alt={shop.zone.name}
                      width={800}
                      height={400}
                      className="w-full rounded-lg object-cover border"
                      unoptimized
                      priority
                      placeholder="blur"
                      blurDataURL="/blur-placeholder.jpg"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      โซน: {shop.zone.name}
                    </p>
                  </div>
                )}

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
          
    </div>
  );
}