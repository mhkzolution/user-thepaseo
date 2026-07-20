"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Loading from "@/components/loading";
import { RiMegaphoneLine } from "react-icons/ri";

type Reward = {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  pointCost: string;
  participantCount: number;
  joined?: boolean;
};

export default function RewardList({
  shopId,
  hideWhenEmpty = false,
}: {
  shopId?: string;
  hideWhenEmpty?: boolean;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel();

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const url = shopId
          ? `${API_URL}/reward?shopId=${shopId}`
          : `${API_URL}/reward`;
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error("Failed to fetch rewards");
        const data = await res.json();
        setRewards(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [shopId]); // ✅ refetch เมื่อ shopId เปลี่ยน

  if (loading) return <Loading />;

  if (!rewards.length && hideWhenEmpty) return null;

  if (!rewards.length) {
    return (
      <div className="p-0 max-w-5xl mx-auto mb-6">
        <div className="flex flex-row items-end justify-between mb-3">
          <span className="text-base font-bold">ของรางวัล</span>
        </div>

        <div
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paseo-hover">
            <RiMegaphoneLine className="text-paseo-dark" size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-gray-800">ยังไม่มีของรางวัล</p>
        </div>
      </div>
    );
  }

  const monthNames = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  return (
    <div className="p-0 max-w-5xl mx-auto mb-6">
      <div className="flex flex-row items-end justify-between mb-3">
        <span className="text-base font-bold">รางวัล</span>
        {!shopId && ( // ✅ ซ่อนปุ่ม “ดูทั้งหมด” ถ้าอยู่ในร้าน
          <Link href="/reward" className="bg-gray-100 px-2 py-1 rounded-full border border-gray-20 text-xs">
            ดูทั้งหมด
          </Link>
        )}
      </div>

      <section className="embla_post">
        <div className="embla__viewport_post rounded-lg" ref={emblaRef}>
          <div className="embla__container_post">
            {rewards.map((r) => {
              const startDate = new Date(r.startDate);
              const endDate = new Date(r.endDate);
              const now = new Date();

              let status = "";
              if (now < startDate) status = "กำลังจะจัด";
              else if (now >= startDate && now <= endDate) status = "กำลังจัด";
              else status = "สิ้นสุดแล้ว";

              return (
                <div
                  className="embla__slide_coupon relative w-full"
                  key={r.id}
                >

                  <Link
                    key={r.id}
                    href={`/reward/${r.id}`}
                    className="w-full h-full flex flex-row p-0 rounded-xl overflow-hidden transition"
                  >
                    <div className="relative w-full h-full flex flex-col shadow-lg">
                      <div className="relative w-full h-full flex flex-col">
                        <div className="w-full aspect-square rounded-xl overflow-hidden p-3 bg-gray-100">
                          <Image
                            src={r.imageUrl || "/main/no-image.png"}
                            alt={r.name}
                            width={300}
                            height={300}
                            className="w-full h-full rounded-xl"
                            unoptimized
                            priority
                            placeholder="blur"
                            blurDataURL="/blur-placeholder.jpg"
                          />
                        </div>

                        <div className="w-full rounded-xl flex flex-col gap-2 p-2 bg-gray-100">

                          <div className="w-full px-1" style={{ minHeight: "3rem" }}>
                            <h3 className="text-xs font-semibold line-clamp-2 leading-4 text-center">
                              {r.name}
                            </h3>
                          </div>

                          <button
                            className={`py-1 w-full rounded-full text-xs md:text-sm font-bold flex flex-row items-center justify-center gap-2 hover:text-black ${
                              status === "สิ้นสุดแล้ว"
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-paseo text-white"
                            }`}
                            disabled={status === "สิ้นสุดแล้ว"}
                          >
                            {status === "สิ้นสุดแล้ว"
                              ? "สิ้นสุดแล้ว"
                              : Number(r.pointCost) === 0
                              ? "รับสิทธิ์"
                              : `${r.pointCost} พอยท์`}
                          </button>
                        </div>
                      </div>

                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}