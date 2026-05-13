"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Image from "next/image";
import Loading from "@/components/loading";
import { BsClipboardCheck } from "react-icons/bs";
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";

type PrivilegeItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  participantCount: number;
  type: "CAMPAIGN" | "EVENT" | "COUPON" | "REWARD";
  startDate: string;
  endDate: string;
  pointCost?: number;
  createdAt?: string;
  joined?: boolean;
};

type Branch = {
  id: string;
  name: string;
  imageUrl?: string;
};

export default function PrivilegeCampaignList() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [campaigns, setCampaigns] = useState<PrivilegeItem[]>([]);
  const [events, setEvents] = useState<PrivilegeItem[]>([]);
  const [coupons, setCoupons] = useState<PrivilegeItem[]>([]);
  const [rewards, setRewards] = useState<PrivilegeItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"ALL" | "COUPON" | "REWARD">("ALL");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privilegesError, setPrivilegesError] = useState<string | null>(null);
  const [privilegesRetryKey, setPrivilegesRetryKey] = useState(0);
  const firstPrivilegesDone = useRef(false);

  // ✅ Fetch Branches from API
  useEffect(() => {
    const ac = new AbortController();
    const fetchBranches = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/shop/branch`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch branches");
        const data = await res.json();

        const filteredBranches = data.filter(
          (branch: Branch) => branch.name !== "บางนา"
        );

        if (ac.signal.aborted) return;
        setBranches([
          ...filteredBranches,
          { id: "all", name: "ทั้งหมด" },
        ]);
        setError(null);
      } catch (err: unknown) {
        if (ac.signal.aborted || (err as Error)?.name === "AbortError") return;
        setBranches([{ id: "all", name: "ทั้งหมด" }]);
        setError("ไม่สามารถโหลดรายการสาขาได้ — แสดงโหมดทั้งหมด");
      }
    };
    fetchBranches();
    return () => ac.abort();
  }, []);

  // ✅ Fetch Privileges
  useEffect(() => {
    const ac = new AbortController();
    const fetchPrivileges = async () => {
      const isFirst = !firstPrivilegesDone.current;
      try {
        if (isFirst) setLoading(true);
        else setIsRefreshing(true);

        setPrivilegesError(null);

        const url =
          selectedBranch && selectedBranch !== "all"
            ? `${API_URL}/privileges?branchId=${selectedBranch}`
            : `${API_URL}/privileges`;
        const res = await fetchWithAuth(
          url,
          { signal: ac.signal },
          { maxRetries: 3, baseDelayMs: 500 }
        );
        if (!res.ok) throw new Error("Failed to fetch privileges");
        const data = await res.json();

        if (ac.signal.aborted) return;
        setCampaigns(data.campaigns ?? []);
        setEvents(data.events ?? []);
        setCoupons(data.coupons ?? []);
        setRewards(data.rewards ?? []);
      } catch (e: unknown) {
        if (ac.signal.aborted || (e as Error)?.name === "AbortError") return;
        console.error(e);
        setPrivilegesError(
          "โหลดสิทธิพิเศษไม่สำเร็จ กดลองใหม่หรือรอสักครู่แล้วลองอีกครั้ง"
        );
      } finally {
        if (ac.signal.aborted) return;
        setIsRefreshing(false);
        if (isFirst) {
          firstPrivilegesDone.current = true;
          setLoading(false);
        }
      }
    };

    fetchPrivileges();
    return () => ac.abort();
  }, [selectedBranch, privilegesRetryKey]);

  const [campaignEmblaRef] = useEmblaCarousel();

  if (loading) {
    return <Loading />;
  }

  if (error && branches.length === 0) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  // ✅ Branch Tabs (Dynamic from API)
  const renderBranchTabs = () => (
    <div className="flex justify-center gap-4 mb-4" role="tablist">
      {branches.map((branch) => (
        <button
          key={branch.id}
          onClick={() =>
            setSelectedBranch(branch.id === "all" ? null : branch.id)
          }
          className="flex flex-col items-center gap-3 transition h-full"
          aria-selected={selectedBranch === branch.id}
          role="tab"
        >
          {/* LOGO */}
          <div
            className={`w-20 h-20 p-2 aspect-square rounded-xl overflow-hidden flex items-center justify-center border transition
              ${
                selectedBranch === branch.id ||
                (!selectedBranch && branch.id === "all")
                  ? "bg-gray-50 border-paseo-dark"
                  : "bg-white border-gray-200"
              }`}
            >
            {branch.id === "all" ? (
              <Image
                src="/icon/icon-all.png"
                alt="all"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : branch.imageUrl ? (
              <Image
                src={
                  branch.imageUrl.startsWith("/")
                    ? branch.imageUrl
                    : branch.imageUrl.startsWith("http")
                    ? branch.imageUrl
                    : "/images/no-image.png"
                }
                alt={branch.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Image
                src="/images/no-image.png"
                alt={branch.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            )}
          </div>

          {/* NAME */}
          <span className="text-xs md:text-sm font-semibold text-center leading-tight">
            {branch.name}
          </span>
        </button>
      ))}
    </div>
  );

  // Render carousel for Campaign
  const renderCampaignCarousel = () => (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4">แคมเปญ</h2>
      {campaigns.length === 0 ? (
        <div className="p-6 text-center">
          <p>ยังไม่มีแคมเปญ</p>
        </div>
      ) : (
        <section className="embla_post">
          <div className="embla__viewport_post rounded-lg" ref={campaignEmblaRef}>
            <div className="embla__container_post">
              {campaigns.map((item) => (
                <div className="embla__slide_campaign relative w-full" key={item.id}>
                  <Link href={`/campaign/${item.id}`}>
                    <div className="embla__slide__number_campaign bg-gray-100 border rounded-2xl transition">
                      <div className="w-40%">
                        {item.imageUrl ? (
                          <Image
                            width={600}
                            height={600}
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full object-cover rounded-l-2xl"
                            unoptimized
                          />
                          ) : (
                            <Image
                              width={600}
                              height={600}
                              src='/main/no-image.png'
                              alt={item.name}
                              className="object-cover rounded-xl border bg-white p-6"
                              unoptimized
                            />
                          )}
                      </div>
                      <div className="flex flex-col flex-grow w-60% md:p-4 p-2 gap-2">
                        <h3 className="text-black text-sm md:text-xl font-bold line-clamp-1">
                          {item.name}
                        </h3>
                        <div className="flex-grow">
                        <div
                            className="prose prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6 text-xs md:text-sm text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{
                            __html: item.description
                                ? item.description.length > 100
                                ? `${item.description.substring(0, 100)}...`
                                : item.description
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
      )}
    </div>
  );

  // Render Event section (grid layout)
  const renderEventSection = () => {
    const monthNames = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    ];

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

    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">กิจกรรม</h2>
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <p>ยังไม่มีกิจกรรม</p>
          </div>
        ) : (
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
                          {r.name.length > 50 ? r.name.substring(0, 50) + "..." : r.name}
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
        )}
      </div>
    );
  };

  // Render Coupon/Reward section (grid layout)
  const renderCouponRewardSection = () => {
    const monthNames = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    ];

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

    const displayedItems =
      selectedType === "ALL"
        ? [...coupons, ...rewards].sort(
            (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
          )
        : selectedType === "COUPON"
        ? coupons
        : rewards;

    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">คูปองและรางวัล</h2>
        <div className="flex justify-start gap-4 mb-4" role="tablist">

        {/* COUPON */}
        <button
          onClick={() => setSelectedType("COUPON")}
          className="flex flex-col items-center gap-3 transition"
          role="tab"
        >
          <div
            className={`w-20 h-20 p-2 rounded-xl flex items-center justify-center border transition
            ${
              selectedType === "COUPON"
                ? "bg-gray-50 border-paseo-dark"
                : "bg-white border-gray-200"
            }`}
          >
            <Image
              src="/icon/icon-coupon.png"
              alt="PaseoLife"
              width={300}
              height={300}
              className="w-full h-full rounded-l-xl"
              unoptimized
            />
          </div>

          <span className="text-xs md:text-sm font-semibold">
            คูปอง
          </span>
        </button>


        {/* REWARD */}
        <button
          onClick={() => setSelectedType("REWARD")}
          className="flex flex-col items-center gap-3 transition"
          role="tab"
        >
          <div
            className={`w-20 h-20 p-2 rounded-xl flex items-center justify-center border transition
            ${
              selectedType === "REWARD"
                ? "bg-gray-50 border-paseo-dark"
                : "bg-white border-gray-200"
            }`}
          >
            <Image
              src="/icon/icon-reward.png"
              alt="PaseoLife"
              width={300}
              height={300}
              className="w-full h-full rounded-l-xl"
              unoptimized
            />
          </div>

          <span className="text-xs md:text-sm font-semibold">
            รางวัล
          </span>
        </button>

        {/* ALL */}
        <button
          onClick={() => setSelectedType("ALL")}
          className="flex flex-col items-center gap-3 transition"
          role="tab"
        >
          <div
            className={`w-20 h-20 p-2 rounded-xl flex items-center justify-center border transition
            ${
              selectedType === "ALL"
                ? "bg-gray-50 border-paseo-dark"
                : "bg-white border-gray-200"
            }`}
          >
            <Image
              src="/icon/icon-all.png"
              alt="all"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>

          <span className="text-xs md:text-sm font-semibold">
            ทั้งหมด
          </span>
        </button>

      </div>
        {displayedItems.length === 0 ? (
          <div className="p-6 text-center">
            <p>
              {selectedType === "ALL"
                ? "ยังไม่มีคูปองหรือรางวัล"
                : selectedType === "COUPON"
                ? "ยังไม่มีคูปอง"
                : "ยังไม่มีของรางวัล"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {displayedItems.map((r) => {
              const startDate = new Date(r.startDate!);
              const endDate = new Date(r.endDate!);
              const now = new Date();

              let status = "";
              if (now < startDate) {
                status = "กำลังจะจัด";
              } else if (now >= startDate && now <= endDate) {
                status = "กำลังจัด";
              } else if (now > endDate) {
                status = "สิ้นสุดแล้ว";
              }

              const start_day = startDate.getDate();
              const start_month_index = startDate.getMonth();
              const start_year = startDate.getFullYear() + 543;

              const end_day = endDate.getDate();
              const end_month_index = endDate.getMonth();
              const end_year = endDate.getFullYear() + 543;

              const start_month_text = monthNames[start_month_index];
              const end_month_text = monthNames[end_month_index];

              const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };
              const start_month_long = startDate.toLocaleDateString("th-TH", monthOptions);
              const end_month_long = endDate.toLocaleDateString("th-TH", monthOptions);

              return (
                <div className="embla__slide_campaign relative w-full" key={`${r.type}-${r.id}`}>
                  <Link
                    href={`/${r.type.toLowerCase()}/${r.id}`}
                    className="w-full h-full flex flex-row p-0 rounded-xl overflow-hidden transition"
                  >
                    <div className="relative w-full h-full flex flex-col shadow-lg">
                      <div className="relative w-full h-full flex flex-col">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-white p-3 bg-gray-100">
                          <Image
                            src={r.imageUrl || "/main/no-image.png"}
                            alt={r.name}
                            width={300}
                            height={300}
                            className="w-full h-full rounded-xl"
                            unoptimized
                          />
                        </div>

                        <div className="w-full rounded-xl flex flex-col gap-2 bg-white p-2 bg-gray-100">

                          <div className="w-full px-1" style={{ minHeight: "2rem" }}>
                            <h3 className="text-xs font-semibold line-clamp-3 leading-4 text-center">
                              {r.name.length > 40 ? r.name.substring(0, 40) + "..." : r.name}
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
        )}
      </div>
    );
  };

  return (
    <div className="p-0 max-w-5xl mx-auto mb-6">
      {privilegesError && (
        <div
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{privilegesError}</span>
          <button
            type="button"
            className="shrink-0 rounded-full bg-paseo px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            onClick={() => setPrivilegesRetryKey((k) => k + 1)}
          >
            ลองโหลดใหม่
          </button>
        </div>
      )}
      {isRefreshing && (
        <p className="mb-2 text-center text-xs text-gray-500">กำลังอัปเดต…</p>
      )}
      {error && branches.length > 0 && (
        <p className="mb-2 text-center text-xs text-amber-700">{error}</p>
      )}

      {renderBranchTabs()}

      {/* Campaign Section */}
      {renderCampaignCarousel()}

      {/* Coupon/Reward Section */}
      {renderCouponRewardSection()}

      {/* Event Section */}
      {renderEventSection()}
    </div>
  );
}