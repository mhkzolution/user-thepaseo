"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Loading from '@/components/loading';
import UserProfile from '@/components/UserProfile/page';
import HeaderMobile from '@/components/HeaderMobile/page';
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";

import { BsClipboardCheck } from "react-icons/bs";

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
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p>ยังไม่มีกิจกรรมหรือของรางวัล</p>
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

      <div className="w-full bg-white p-4 pt-16 md:p-10 pb-10 md:mt-20 mt-6 md:pt-10 rounded-3xl">
        <h1 className="text-xl font-semibold mb-4">กิจกรรม</h1>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 auto-rows-fr">
            {events.map((r, index) => {
              const startDate = dateFromBangkokWallClock(r.startDate);
              const endDate = dateFromBangkokWallClock(r.endDate);
              const now = new Date();

              // ตรวจสอบสถานะของกิจกรรม
              let status = "";
              if (now < startDate) {
                status = "กำลังจะจัด";
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

              const dateOptions: Intl.DateTimeFormatOptions = {
                year: "numeric",
                month: "long",
                day: "numeric",
              };
              const timeOptions: Intl.DateTimeFormatOptions = {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              };

              const start_day = startDate.getDate();
              const start_month_index = startDate.getMonth();
              const start_year = startDate.getFullYear() + 543;

              const end_day = endDate.getDate();
              const end_month_index = endDate.getMonth();
              const end_year = endDate.getFullYear() + 543;

              const monthNames = [
                "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
              ];

              const start_month_text = monthNames[start_month_index];
              const end_month_text = monthNames[end_month_index];

              const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };

              const start_month_long = startDate.toLocaleDateString("th-TH", monthOptions);
              const end_month_long = endDate.toLocaleDateString("th-TH", monthOptions);

              const startDate_time = startDate.toLocaleTimeString("th-TH", timeOptions);
              const endDate_time = endDate.toLocaleTimeString("th-TH", timeOptions);

              const formatThai = (date: Date) => {
                return new Intl.DateTimeFormat("th-TH", {
                  timeZone: "Asia/Bangkok",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(date);
              };

              return (
                <div className="embla__slide_campaign relative w-full flex flex-col" key={r.id}>

                  <Link
                    href={`/event/${r.id}`}
                    className={`w-full flex flex-col gap-4 p-4 border border-gray-200 rounded-xl shadow overflow-hidden transition bg-white h-full`}
                  >
                  <div className="relative w-full rounded-xl overflow-hidden bg-white">
                    <Image
                      src={r.imageUrl || "/main/no-image.png"}
                      alt={r.name}
                      width={300}
                      height={300}
                      className="object-cover w-full h-auto"
                      unoptimized
                    />
                  </div>

                    <div className="pt-1 flex flex-col flex-grow">
                      <h3 className="text-black text-base md:text-xl font-bold line-clamp-1">{r.name}</h3>
                      <div className="flex-grow">
                        <div
                          className="prose prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6 text-base text-gray-600 line-clamp-2 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: r.description
                              ? r.description.length > 120
                                ? `${r.description.substring(0, 120)}...`
                                : r.description
                              : "<p>ยังไม่มีเงื่อนไข...</p>",
                          }}
                        />
                      </div>

                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
                        {formatThai(startDate)} - {formatThai(endDate)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
                        เวลา {startDate_time} - {endDate_time} น.
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
                        ผู้เข้าร่วม: {r.registrations} คน
                      </p>
                    </div>

                    <button
                      className={`py-2 w-full rounded-full text-sm md:text-base font-bold flex items-center justify-center gap-2 transition ${buttonClass}`}
                      disabled={disabled}
                    >
                      <BsClipboardCheck size={18} />
                      <span className="text-xs md:text-sm">{buttonText}</span>
                     </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}