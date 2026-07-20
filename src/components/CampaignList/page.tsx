"use client";

import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Loading from '@/components/loading';
import { RiMegaphoneLine } from "react-icons/ri";

type Campaign = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  participantCount: number;
  joined?: boolean;
};

export default function CampaignList({
  hideWhenEmpty = false,
}: {
  hideWhenEmpty?: boolean;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/campaign`);
        if (!res.ok) throw new Error("Failed to fetch campaign");
        const data = await res.json();
        setCampaigns(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel();

  useEffect(() => {
        }, [emblaApi])

  if (loading) {
    return (
    <Loading />
    );
  }

  if (!campaigns.length && hideWhenEmpty) return null;

  if (!campaigns.length) {
    return (
      <div className="p-0 max-w-5xl mx-auto mb-6">
        <div className="flex flex-row items-end justify-between mb-3">
          <span className="text-base font-bold">แคมเปญ</span>
        </div>

        <div
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-paseo-hover">
            <RiMegaphoneLine className="text-paseo-dark" size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-gray-800">ยังไม่มีแคมเปญ</p>
        </div>
      </div>
      
    );
  }

  return (
    <div className="p-0 max-w-5xl mx-auto mb-6">
      <div className="flex flex-row items-end justify-between mb-3">
        <span className="text-base font-bold">แคมเปญ</span>
        <Link href="/campaign" className="bg-gray-100 px-2 py-1 rounded-full border border-gray-20 text-xs">
          ดูทั้งหมด
        </Link>
      </div>

      <section className="embla_post">
        <div className="embla__viewport_post rounded-lg" ref={emblaRef}>
          <div className="embla__container_post">
            {campaigns.map((r) => (
              <div className="embla__slide_campaign relative w-full" key={r.id}>

                {/* ส่วน card */}
                <Link href={`/campaign/${r.id}`}>
                  <div className="embla__slide__number_campaign bg-gray-100 border rounded-2xl transition">
                      <div className="w-40%">
                        <Image
                          width={600}
                          height={600}
                          src={r.imageUrl || "/main/no-image.png"}
                          alt={r.name}
                          className="w-full object-cover rounded-l-2xl"
                          unoptimized
                          priority
                          placeholder="blur"
                          blurDataURL="/blur-placeholder.jpg"
                        />
                      </div>
                      <div className="flex flex-col flex-grow w-60% md:p-4 p-2 gap-2">
                        <h3 className="text-black text-sm md:text-xl font-bold line-clamp-1">
                          {r.name}
                        </h3>
                        <div className="flex-grow">
                        <div
                            className="prose prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6 text-xs md:text-sm text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{
                            __html: r.description
                                ? r.description.length > 100
                                ? `${r.description.substring(0, 100)}...`
                                : r.description
                                : "<p>ยังไม่มีเงื่อนไข...</p>",
                            }}
                        />
                        </div>
                      </div>
                    </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
