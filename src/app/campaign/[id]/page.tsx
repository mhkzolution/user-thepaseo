"use client";

import { useEffect, useState, useRef } from "react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useParams } from "next/navigation";
import html2canvas from "html2canvas";
import FavoriteButton from "@/components/FavoriteButton/page";
import { PiDotsThreeOutlineLight } from "react-icons/pi";
import { FaRegCalendarCheck } from "react-icons/fa";
import { CiBitcoin, CiCalendar } from "react-icons/ci";
import ShareButton from "@/components/ShareButton/page";
import Loading from "@/components/loading";
import Link from "next/link";
import Image from "next/image";
import { RiCoupon2Fill } from "react-icons/ri";
import UserProfile from '@/components/UserProfile/page';
import HeaderMobile from '@/components/HeaderMobile/page';
import { IoMdMore } from "react-icons/io";
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";

type Coupon = {
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

type Campaign = {
  id: string;
  name: string;
  description?: string;
  linkShare?: string;
  terms?: string;
  imageUrl?: string;
  pointCost: number;
  pointEarn: number;
  maxPerUser: number | null;
  quantity: number | null;
  joinedCount: number;
  startDate: string;
  endDate: string;
  isJoined: boolean;
  coupons: Coupon[];
};

type MiniGameItem = {
  id: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  canSpin?: boolean;
  canClaim?: boolean;
  hasSpun: boolean;
  spinPointCost?: number;
  progress?: { checkInCount: number; checkInTarget: number };
};

export default function CampaignSinglePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miniGames, setMiniGames] = useState<MiniGameItem[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);

  // ✅ ดึงข้อมูล campaign + coupon
  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API_URL}/campaign/${id}`);
        if (!res.ok) throw new Error("ไม่พบ Campaign");
        const data = await res.json();
        setCampaign(data);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
  }, [id]);

  useEffect(() => {
    const fetchMiniGames = async () => {
      if (!id) return;
      try {
        const res = await fetchWithAuth(
          `${API_URL}/mini-games?campaignId=${id}&excludePlayed=true`
        );
        if (!res.ok) return;
        setMiniGames(await res.json());
      } catch {
        setMiniGames([]);
      }
    };
    fetchMiniGames();
  }, [API_URL, id]);

  // ✅ ฟังก์ชันแคปภาพ
  const handleCapture = async () => {
    if (!captureRef.current) return;

    const hiddenEls = captureRef.current.querySelectorAll(".hidden-capture");
    hiddenEls.forEach((el) => ((el as HTMLElement).style.display = "none"));

    const canvas = await html2canvas(captureRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${campaign?.name || "campaign"}-capture.png`;
    link.click();

    hiddenEls.forEach((el) => ((el as HTMLElement).style.display = ""));
  };

  if (loading) return <Loading />;
  if (!campaign)
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p>{error || "ไม่พบข้อมูล Campaign นี้"}</p>
      </div>
    );

  const now = new Date();

  const startDate = dateFromBangkokWallClock(campaign.startDate);
  const endDate = dateFromBangkokWallClock(campaign.endDate);

  const canJoin =
    !campaign.isJoined && now >= startDate && now <= endDate;

  // status
  let status = "";
  if (now < startDate) {
    status = "กำลังจะจัด";
  } else if (now >= startDate && now <= endDate) {
    status = "กำลังจัด";
  } else {
    status = "สิ้นสุดแล้ว";
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
      <div className="md:pt-10 pt-16">
        <HeaderMobile />
      
        <div
          ref={captureRef}
          className="capture relative max-w-2xl mx-auto md:pt-10 md:pb-0 pb-40 md:mb-10 pt-8 md:mt-6 mt-0 bg-white rounded-3xl flex flex-col md:gap-6 gap-4"
        >
  
          <div className="px-6 md:px-10">
            {campaign.imageUrl &&
              <Image
                width={600}
                height={600}
                src={campaign.imageUrl} alt={campaign.name}
                className="w-full h-full object-cover rounded-xl"
                unoptimized
                priority
                placeholder="blur"
                blurDataURL="/blur-placeholder.jpg"
              />}

            <div className="w-full flex flex-row justify-end px-4 py-2 items-center gap-4">
              {user?.id && (
                <FavoriteButton
                  targetId={campaign.id}
                  targetType="CAMPAIGN"
                />
              )}
              
              <ShareButton
                title={campaign?.name || "Campaign"}
                linkShare={campaign?.linkShare}
              />

              <button
                onClick={handleCapture}
              >
                <IoMdMore size={24} />
              </button>
            </div>
  
          </div>

          <div className="px-6 md:px-10">
            <div className="flex flex-row justify-between align-start px-6">
              <h1 className="text-sm font-bold text-center">{campaign.name}</h1>
            </div>
          </div>

          <div className="px-4 md:px-10">
            <div className="flex flex-row justify-between align-start gap-4 bg-paseo-hover md:p-6 p-4 px-4 rounded-xl">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row item-center align-center gap-2">
                  <CiCalendar size={32} />
                  <p className="text-sm text-black">
                    วันที่ {formatThai(startDate)} - {formatThai(endDate)} นี้
                  </p>
                </div>

              </div>
  
            </div>
          </div>

          <div className="px-6 md:px-10">
            <div className="flex flex-col justify-between align-start gap-4">
              {campaign.description && (
                <div className="mb-4">
                  <span className="text-base font-bold">รายละเอียด</span>
                  <div
                    className="text-sm prose text-gray-700"
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                </div>
              )}

              {campaign.terms && (
                <div className="mb-4">
                  <span className="text-base font-bold">เงื่อนไข</span>
                  <div
                    className="text-sm prose text-gray-700"
                    dangerouslySetInnerHTML={{ __html: campaign.terms }}
                  />
                </div>
              )}

            </div>

          </div>

            {miniGames.length > 0 && (
              <div className="flex flex-col gap-4 bg-white md:p-6 p-4">
                <h3 className="text-sm font-semibold">มินิเกม</h3>
                <div className="grid grid-cols-1 gap-4">
                  {miniGames.map((game) => (
                    <Link
                      key={game.id}
                      href={game.type === "CHECK_IN" ? `/games/check-in/${game.id}` : `/games/lucky-spin/${game.id}`}
                      className="flex items-stretch rounded-2xl overflow-hidden bg-gradient-to-r from-[#6B7B3C] to-[#8a9a52] text-white min-h-[100px]"
                    >
                      <div className="w-1/3 flex items-center justify-center p-4">
                        {game.imageUrl ? (
                          <Image
                            src={game.imageUrl}
                            alt={game.name}
                            width={100}
                            height={100}
                            className="rounded-xl object-cover"
                            unoptimized
                          />
                        ) : (
                          <GiPerspectiveDiceSixFacesRandom size={40} className="text-yellow-300" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center p-4 gap-1 flex-1">
                        <h4 className="font-bold">{game.name}</h4>
                        <p className="text-sm opacity-90">
                          {game.type === "CHECK_IN" ? "Check-in" : "Lucky Spin"} ·{" "}
                          {game.type === "CHECK_IN"
                            ? game.canClaim
                              ? "พร้อมรับรางวัล"
                              : game.progress
                                ? `${game.progress.checkInCount}/${game.progress.checkInTarget} ครั้ง`
                                : "ดูความคืบหน้า"
                            : game.canSpin
                              ? `พร้อมหมุน (${game.spinPointCost} พอยท์)`
                              : "ดูเงื่อนไข"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ แสดงคูปองของแคมเปญ */}
            {campaign.coupons?.length > 0 && (
              <div className="flex flex-col justify-between align-start gap-4 bg-white md:p-6 p-4">
                <h3 className="text-sm font-semibold mb-2">คูปองในแคมเปญนี้</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {campaign.coupons.map((coupon) => {
                    const now = new Date();

                    // ✅ เช็กว่ามี start/end หรือไม่
                    const startDate = dateFromBangkokWallClock(coupon.startDate);
                    const endDate = dateFromBangkokWallClock(coupon.endDate);

                    let status = "";
                    if (startDate && endDate) {
                      if (now < startDate) status = "กำลังจะจัด";
                      else if (now >= startDate && now <= endDate) status = "กำลังจัด";
                      else if (now > endDate) status = "สิ้นสุดแล้ว";
                    }

              return (
                <div className="embla__slide_campaign relative w-full" key={coupon.id}>

                  <Link
                    href={`/coupon/${coupon.id}`}
                    className="w-full h-full flex flex-row p-0 rounded-xl overflow-hidden transition"
                  >
                    <div className="relative w-full h-full flex flex-col">
                      <div className="relative w-full h-full flex flex-col">
                        <div className="w-full aspect-square rounded-xl overflow-hidden p-3 bg-gray-100">
                          <Image
                            src={coupon.imageUrl || "/main/no-image.png"}
                            alt={coupon.name}
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

                          <div className="w-full px-1" style={{ minHeight: "2rem" }}>
                            <h3 className="text-xs font-semibold line-clamp-3 leading-4 text-center">
                              {coupon.name.length > 40 ? coupon.name.substring(0, 40) + "..." : coupon.name}
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
                              : Number(coupon.pointCost) === 0
                              ? "รับสิทธิ์"
                              : `${coupon.pointCost} พอยท์`}
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
      )}

      </div>
    </div>
  );
}
