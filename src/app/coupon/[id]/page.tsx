"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Image from "next/image";
import { CiCalendar } from "react-icons/ci";
import { CiBitcoin } from "react-icons/ci";
import { IoMdMore } from "react-icons/io";
import Loading from "@/components/loading";
import UserProfile from "@/components/UserProfile/page";
import ShareButton from "@/components/ShareButton/page";
import FavoriteButton from "@/components/FavoriteButton/page";
import html2canvas from "html2canvas";
import HeaderMobile from '@/components/HeaderMobile/page';
import UseCouponModal from "@/components/coupon/UseCouponModal";
import { dateFromBangkokWallClock } from "@/lib/bangkokDate";

type Coupon = {
  id: string;
  name: string;
  description?: string;
  terms?: string;
  imageUrl?: string;
  linkShare?: string;
  pointCost: number;
  pointEarn: number;
  quantity: number | null;
  maxPerUser: number | null;
  receivedCount: number;
  totalReceived: number;
  pointBalance: number;
  isFull: boolean;
  isExpired: boolean;
  isReceived: boolean;
  canReceive: boolean;
  startDate: string;
  endDate: string;
  locationLabel: string;
};

export default function CouponSinglePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, loading: authLoading } = useContext(AuthContext);
  const { id } = useParams();

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showUseModal, setShowUseModal] = useState(false);
  const [userCouponId, setUserCouponId] = useState<string | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);

  const sanitizePublicUrl = (value?: string | null) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.includes("null")) return null;
    try {
      const parsed = new URL(trimmed);
      if (!parsed.protocol.startsWith("http")) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  };

  // ✅ ดึงพอยท์ของผู้ใช้
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/points/balance`);
      if (!res.ok) return;
      const data = await res.json();
      setPointBalance(data.balance || 0);
    } catch {
      setPointBalance(0);
    }
  }, []);

  // ✅ ดึงข้อมูลคูปอง
  const fetchCoupon = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/coupon/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("ไม่พบคูปองนี้");
      const data = await res.json();
      setCoupon(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ✅ โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    const reloadKey = `auth-retry:${window.location.pathname}`;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      if (sessionStorage.getItem(reloadKey) !== "1") {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
        return;
      }
      setError("ไม่สามารถยืนยันผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem(reloadKey);
    fetchBalance();
    fetchCoupon();
  }, [user?.id, authLoading, fetchBalance, fetchCoupon]);

  // ✅ ฟังก์ชันรับคูปอง
const handleClaim = async () => {
  if (!coupon) return;
  setJoining(true);
  setError(null);

  try {
    const res = await fetchWithAuth(`${API_URL}/coupon/${coupon.id}/join`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "ไม่สามารถรับคูปองได้");

    // ✅ เปิด modal แบบเต็มพร้อมข้อมูลคูปอง
    setUserCouponId(data.userCoupon?.id);
    setShowUseModal(true);

    await Promise.all([fetchCoupon(), fetchBalance()]);
  } catch (err: any) {
    setError(err.message || "เกิดข้อผิดพลาด");
  } finally {
    setJoining(false);
  }
};

  if (loading) return <Loading />;
  if (!coupon)
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p>{error || "ไม่พบข้อมูลคูปองนี้"}</p>
      </div>
    );

  const now = new Date();
  const startDate = dateFromBangkokWallClock(coupon.startDate);
  const endDate = dateFromBangkokWallClock(coupon.endDate);
  const canJoin = !coupon.isReceived && now >= startDate && now <= endDate;
  const hasValidSchedule =
    !!coupon.startDate &&
    !!coupon.endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime());
  const isNotStartedYet = hasValidSchedule && now < startDate;
  const isEnded = hasValidSchedule && now > endDate;
  const displayImageUrl = sanitizePublicUrl(coupon.imageUrl);
  const displayShareUrl = sanitizePublicUrl(coupon.linkShare);

  const monthNames = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  };

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

  const monthOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    timeZone: "Asia/Bangkok",
  };
  const start_month_long = startDate.toLocaleDateString("th-TH", monthOptions);
  const end_month_long = endDate.toLocaleDateString("th-TH", monthOptions);

  const startDate_time = startDate.toLocaleTimeString("th-TH", timeOptions);
  const endDate_time = endDate.toLocaleTimeString("th-TH", timeOptions);

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Bangkok",
        })
      : "-";

  const formatThai = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const handleCapture = async () => {
    if (!captureRef.current) return;

    // ซ่อน element ที่ไม่ต้อง capture
    const hiddenEls = captureRef.current.querySelectorAll(".hidden-capture");
    hiddenEls.forEach((el) => (el as HTMLElement).style.display = "none");

    // แคปหน้าจอ
    const canvas = await html2canvas(captureRef.current, { scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");

    // โหลดเป็นไฟล์ PNG
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${coupon.name}-capture.png`;
    link.click();

    // คืนค่า element ให้กลับมาแสดง
    hiddenEls.forEach((el) => (el as HTMLElement).style.display = "");
  };

  // ✅ แสดงปุ่มตามสถานะ
  const renderButton = () => {
    let disabled = false;
    let message = "";
    let showAction = true;

    if (!hasValidSchedule) {
      disabled = true;
      message = "คูปองยังไม่ได้กำหนดช่วงเวลาแจก";
      showAction = false;
    } else if (isNotStartedYet) {
      disabled = true;
      message = "คูปองนี้ยังไม่เริ่มแจก";
    } else if (isEnded) {
      disabled = true;
      message = "คูปองหมดอายุแล้ว";
      showAction = false;
    } else if (coupon.isFull) {
      disabled = true;
      message = "คูปองหมดแล้ว";
      showAction = false;
    } else if (coupon.pointCost > pointBalance) {
      disabled = true;
      message = `พอยท์ไม่เพียงพอ`;
    } else if (coupon.maxPerUser && coupon.receivedCount >= coupon.maxPerUser) {
      disabled = true;
      message = `คุณรับครบแล้ว (${coupon.receivedCount}/${coupon.maxPerUser})`;
    }

    return (
      <div className="flex flex-row justify-between items-center gap-4">
        
        {/* INFO */}
        <div className="flex flex-col gap-1">
          {coupon.maxPerUser && (
            <span className="text-sm text-gray-600 leading-none">
              รับได้ {coupon.maxPerUser} ครั้ง / รับไปแล้ว {coupon.receivedCount} ครั้ง
            </span>
          )}

          <p className="text-sm text-black">
            พอยท์ของคุณ : <b>{pointBalance}</b> พอยท์
          </p>

          {message && (
            <span className="text-xs text-red-500">{message}</span>
          )}
        </div>

        {/* BUTTON */}
        {showAction && (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={disabled || joining}
            className={`py-2 px-8 rounded-full ${
              disabled ? "bg-gray-300" : "bg-paseo"
            }`}
          >
            <span className="text-sm font-bold text-white">
              {joining ? "กำลังรับคูปอง..." : "รับคูปองนี้"}
            </span>
          </button>
        )}
      </div>
    );
  };

  return (
      <div className="md:pt-10 pt-16">
        <HeaderMobile />

        <div
          ref={captureRef}
          className="capture relative max-w-2xl mx-auto md:pt-10 md:pb-0 pb-40 md:mb-10 pt-8 md:mt-6 mt-0 bg-white rounded-3xl flex flex-col md:gap-6 gap-4"
        >
  
          <div className="px-8 md:px-10">
            {displayImageUrl && (
              <Image
                width={600}
                height={600}
                src={displayImageUrl}
                alt={coupon.name}
                className="w-full h-full object-cover rounded-xl"
                unoptimized
              />
            )}

            <div className="w-full flex flex-row justify-end px-4 py-2 items-center gap-4">
              {user?.id && (
                <FavoriteButton
                  targetId={coupon.id}
                  targetType="COUPON"
                />
              )}
              
              <ShareButton
                title={coupon?.name || "Event"}
                linkShare={displayShareUrl ?? undefined}
              />

              <button
                onClick={handleCapture}
              >
                <IoMdMore size={24} />
              </button>
            </div>
          </div>

          <div className="px-8 md:px-10">
            <div className="flex flex-row justify-between align-start px-6">
              <h1 className="text-sm font-bold text-center">{coupon.name}</h1>
            </div>
          </div>

          <div className="px-8 md:px-10">
            <div className="flex flex-row justify-between align-start gap-4 bg-paseo-hover md:p-6 p-4 px-6 rounded-xl">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row item-center align-center gap-4">
                  <CiCalendar size={24} />
                  <p className="text-sm text-black">
                    วันที่ {formatThai(startDate)} - {formatThai(endDate)} นี้
                  </p>
                </div>
  
                {coupon.pointCost > 0 && 
                <div className="flex flex-row item-center align-center gap-4">
                  <Image
                    src="/icon/icon-point.png"
                    alt="Thepaseo"
                    width={100}
                    height={100}
                    className="w-6 h-6 object-contain"
                    unoptimized
                  />
                  <p className="text-sm text-black">จำนวนพอยท์ : {coupon.pointCost} พอยท์</p>
                </div>
                }
  
                {coupon.pointEarn > 0 && 
                <div className="flex flex-row item-center align-center gap-4">
                  <Image
                    src="/icon/icon-point.png"
                    alt="Thepaseo"
                    width={100}
                    height={100}
                    className="w-6 h-6 object-contain"
                    unoptimized
                  />
                  <p className="text-sm text-black">ผู้เข้าร่วมจะได้รับ: {coupon.pointEarn} พอยท์</p>
                </div>
                }
  
                <div className="flex flex-row item-center align-center gap-4">
                  <Image
                    src="/icon/icon-point.png"
                    alt="Thepaseo"
                    width={100}
                    height={100}
                    className="w-6 h-6 object-contain"
                    unoptimized
                  />
                  <p className="text-sm text-black">
                    พอยท์ของคุณ : {pointBalance} พอยท์
                  </p>
                </div>
                
              </div>
  
            </div>
            
          </div>

          <div className="px-8 md:px-10">
            <div className="flex flex-col justify-between align-start gap-4">
              {coupon.description && (
                <div className="mb-4">
                  <span className="text-base font-bold">รายละเอียด</span>
                  <div
                    className="text-sm prose text-gray-700"
                    dangerouslySetInnerHTML={{ __html: coupon.description }}
                  />
                </div>
              )}

              {coupon.terms && (
                <div className="mb-4">
                  <span className="text-base font-bold">เงื่อนไข</span>
                  <div
                    className="text-sm prose text-gray-700"
                    dangerouslySetInnerHTML={{ __html: coupon.terms }}
                  />
                </div>
              )}

              {coupon.locationLabel && 
                <div className="mb-4">
                  <span className="text-base font-bold">จุดแลกรับของราลวัล</span>
                  <p className="text-sm text-gray-700">{coupon.locationLabel}</p>
                </div>
              }
            </div>

          </div>

        {/* ✅ ปุ่มรับคูปอง */}
        <div className="md:relative md:bottom-0 md:border-0 md:rounded-xl fixed bottom-12 max-w-2xl mx-auto bg-white w-full p-4 pb-6 md:p-8 border">
          {renderButton()}
        </div>

        {/* ✅ Modal ยืนยันการรับ */}
        {showConfirmModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full text-center">
              <h2 className="text-lg font-semibold mb-2">ยืนยันการรับคูปอง</h2>
              <p className="text-gray-700 mb-4">
                ต้องการใช้ {coupon.pointCost} พอยท์เพื่อรับคูปองนี้หรือไม่?
              </p>

              <div className="flex justify-center gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                  ยกเลิก
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmModal(false);
                    await handleClaim();
                  }}
                  className="px-4 py-2 rounded-lg bg-paseo text-white font-semibold"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ✅ Modal หลังแลกสำเร็จ */}
        <UseCouponModal
          show={showUseModal}
          onClose={() => setShowUseModal(false)}
          userCouponId={userCouponId}
        />


      </div>
    </div>
  );
}
