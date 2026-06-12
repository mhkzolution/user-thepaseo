"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Loading from '@/components/loading';
import UserProfile from '@/components/UserProfile/page';
import HeaderMobile from '@/components/HeaderMobile/page';
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";

import { BsClipboardCheck } from "react-icons/bs";
import { RiMegaphoneLine } from "react-icons/ri";

type Event = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  registrations: number;
  joined?: boolean;
};

export default function EventList() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/event`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!events.length) {
    return (
      <div className="p-0 max-w-5xl mx-auto mb-6">
              <div className="flex flex-row items-end justify-between mb-3">
                <span className="text-base font-bold">กิจกรรม</span>
              </div>
      
              <div
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paseo-hover">
                  <RiMegaphoneLine className="text-paseo-dark" size={24} aria-hidden />
                </div>
                <p className="text-sm font-semibold text-gray-800">ยังไม่มีกิจกรรม</p>
              </div>
            </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-0 mt-0 md:mb-0 mb-4 rounded-xl">
      <HeaderMobile />

      <div className="md:hidden p-0 pt-8 md:mt-20 -mb-18 rounded-xl">
        <div className="w-full pt-4 pb-0 px-4 md:pt-0 md:px-20 md:pb-0">
          <UserProfile showOn="both" />
        </div>
      </div>

      <div className="w-full bg-white p-4 pt-16 md:p-10 pb-10 md:mt-20 mt-6 pb-10 md:pt-10 rounded-3xl">
        <h1 className="text-xl font-semibold mb-4">กิจกรรม</h1>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 auto-rows-fr">
            {events.map((r) => {
              const startDate = dateFromBangkokWallClock(r.startDate);
              const endDate = dateFromBangkokWallClock(r.endDate);
              const now = new Date();

              let status = "";
              if (now < startDate) {
                status = "เร็วๆนี้";
              } else if (now >= startDate && now <= endDate) {
                status = "กำลังจัด";
              } else if (now > endDate) {
                status = "สิ้นสุดแล้ว";
              }

              let buttonText = "";
              let buttonClass = "";
              let disabled = false;

              if (r.joined) {
                buttonText = "เข้าร่วมแล้ว";
                buttonClass = "bg-blue-500 text-white";
                disabled = true;
              } else if (now < startDate) {
                buttonText = "เร็วๆนี้";
                buttonClass = "bg-yellow-400 text-black";
                disabled = true;
              } else if (now >= startDate && now <= endDate) {
                buttonText = "เข้าร่วมกิจกรรม";
                buttonClass = "bg-paseo text-white";
              } else {
                buttonText = "สิ้นสุดแล้ว";
                buttonClass = "bg-gray-300 text-gray-600";
                disabled = true;
              }

              const formatThai = (date: Date) => {
                return new Intl.DateTimeFormat("th-TH", {
                  timeZone: "Asia/Bangkok",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(date);
              };

              return (
                <div className=" relative w-full flex flex-col" key={r.id}>

                  <Link
                    href={`/event/${r.id}`}
                    >
                    <div className="embla__slide__number_campaign bg-gray-100 border rounded-2xl transition flex items-stretch">
                      <div className="w-40%">
                        <Image
                          src={r.imageUrl || "/main/no-image.png"}
                          alt={r.name}
                          width={300}
                          height={300}
                          className="w-full h-full rounded-l-xl"
                          unoptimized
                          priority
                          placeholder="blur"
                          blurDataURL="/blur-placeholder.jpg"
                        />
                      </div>

                    <div className="flex flex-col w-60% md:p-4 p-2 gap-2 justify-between">

                      <div className="pt-0 flex flex-col flex-grow gap-2">
                        <h3 className="text-black text-sm md:text-xl font-bold line-clamp-1">
                          {r.name.length > 40 ? r.name.substring(0, 40) + "..." : r.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
                          {formatThai(startDate)} - {formatThai(endDate)}
                        </p>
                      </div>

                      <div className="px-4 md:px-8">

                      <button
                        className={`py-2 w-full rounded-full text-sm md:text-base font-bold flex items-center justify-center gap-2 transition ${buttonClass}`}
                        disabled={disabled}
                      >
                        <BsClipboardCheck size={18} />
                        <span className="text-xs md:text-sm">{buttonText}</span>
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
    </div>
  );
}