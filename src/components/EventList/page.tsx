"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BsClipboardCheck } from "react-icons/bs";
import Loading from "@/components/loading";
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";

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


export default function EventList({ shopId }: { shopId?: string }) { // ✅ เพิ่ม prop
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const url = shopId
          ? `${API_URL}/event?shopId=${shopId}`
          : `${API_URL}/event`;

        const res = await fetch(url, {
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
  }, [shopId]); // ✅ refetch เมื่อ shopId เปลี่ยน

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!events.length) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p>ยังไม่มีกิจกรรมหรือของรางวัล</p>
      </div>
    );
  }

  return (
    <div className="w-full p-0 max-w-5xl mx-auto mb-0">
      <div className="flex flex-row items-end justify-between mb-3">
        <span className="text-base font-bold">กิจกรรม</span>
        {!shopId && ( // ✅ ซ่อนปุ่ม “ดูทั้งหมด” เมื่ออยู่ในร้าน
          <Link href="/event" className="bg-gray-100 px-2 py-1 rounded-full border border-gray-20 text-xs">
            ดูทั้งหมด
          </Link>
        )}
      </div>

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
  );
}
