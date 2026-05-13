"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UseRewardModalProps {
  show: boolean;
  onClose: () => void;
  userRewardId: string | null;
}

export default function UseRewardModal({ show, onClose, userRewardId }: UseRewardModalProps) {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "https://admin.thepaseo.co.th/api";
  const router = useRouter();
  const [reward, setReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usingReward, setUsingReward] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
      if (show) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [show]);

    // ⭐ รีเซ็ตสถานะ modal ทุกครั้งที่เปิด
    useEffect(() => {
      if (show) {
        setLoading(true);
        setError(null);
        setReward(null);
      }
    }, [show]);

    // ⭐ โหลดข้อมูลใหม่ทุกครั้งที่ userRewardId เปลี่ยน
    useEffect(() => {
      if (!show || !userRewardId) return;

      async function fetchReward() {
        try {
          const res = await fetchWithAuth(`${API_URL}/profile/reward/${userRewardId}`);
          const text = await res.text();
          let data: { error?: string } | null = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            throw new Error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่");
          }
          if (!res.ok) {
            throw new Error(
              (data && typeof data === "object" && "error" in data && data.error) ||
                "ไม่สามารถโหลดข้อมูลรางวัลได้"
            );
          }
          setReward(data);
        } catch (err: any) {
          setError(err.message);
          setReward(null);
        } finally {
          setLoading(false);
        }
      }

      fetchReward();
    }, [show, userRewardId]);


  async function handleUseReward() {
    if (!reward || !userRewardId) return;
    setUsingReward(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/reward/${userRewardId}/use`, {
        method: "POST",
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่");
      }

      if (!res.ok) throw new Error(data.error || "ไม่สามารถใช้รางวัลได้");

      // ✅ ตั้งค่าหลังใช้สำเร็จ (สอดคล้องกับหน้า profile/reward/[id])
      setSuccessMessage("✅ ใช้รางวัลเรียบร้อยแล้ว");
      setReward({
        ...reward,
        used: true,
        usedAt: new Date().toISOString(),
        status: "REDEEMED",
      });
      setShowConfirm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUsingReward(false);
    }
  }

  function handleSuccessClose() {
    setSuccessMessage(null);
    onClose();
    router.push("/profile/reward");
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs overlay p-4"
    >
         <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto pt-0 md:pb-0 pb-0">
          <div className="bg-white max-w-2xl w-full shadow-lg animate-fade-in rounded-b-3xl">
          {error && <p className="text-center p-6 text-red-500">{error}</p>}

              {reward && (
                <div className="relative overflow-hidden">

                  <button
                      onClick={onClose}
                      className="absolute md:top-10 top-6 md:right-10 right-6 blur2 border border-gray-300 h-8 w-8 rounded-full text-xl font-bold"
            >
                      X
                  </button>
                    {/* ✅ รหัส Redeem */}
                  <div className="px-4 pt-4 md:pt-8 md:px-8">
                    <div className="bg-paseo-hover rounded-xl py-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">รหัสสำหรับใช้รางวัล</p>
                        <p className="text-2xl font-bold tracking-widest">
                        {reward.redeemCode || "ไม่มีรหัส"}
                        </p>
                    </div>

                  </div>

                  {/* ✅ รูป */}
                  <div className="p-4 md:p-8">
                  {reward.reward?.imageUrl && (
                      <Image
                        width={600}
                        height={600}
                        src={reward.reward.imageUrl}
                        alt={reward.reward.name}
                        className="w-full h-full object-cover rounded-xl"
                        unoptimized
                        priority
                        placeholder="blur"
                        blurDataURL="/blur-placeholder.jpg"
                      />
                  )}
                  </div>

                  {/* ✅ รายละเอียด */}
                  <div className="p-4 px-4 pt-0 md:px-8 md:pt-0">
                    <div className="flex flex-col justify-between align-start gap-4 bg-white p-4 rounded-lg pb-10 md:mb-0 mb-0">

                      <h1 className="text-sm font-bold">{reward.reward?.name}</h1>

                      {reward.reward?.description && (
                      <div className="mb-4">
                          <div
                          className="text-sm prose text-gray-700"
                          dangerouslySetInnerHTML={{ __html: reward.reward?.description }}
                          />
                      </div>
                      )}

                    </div>
                  </div>

                  {/* ✅ ปุ่มใช้งาน */}
                  <div className="md:relative md:bottom-0 md:border-0 md:rounded-xl fixed bottom-0 max-w-2xl mx-auto bg-white w-full p-4 md:p-6 border rounded-t-xl">
                  {!reward.used && (
                      <button
                      onClick={() => setShowConfirm(true)}
                      className="btn-main w-full"
                      >
                      กดใช้รางวัลนี้
                      </button>
                  )}
                  {reward.used && (
                      <p className="text-center text-green-600 font-medium">
                      ✅ ใช้แล้วเมื่อ{" "}
                      {reward.usedAt
                          ? new Date(reward.usedAt).toLocaleString("th-TH")
                          : "ไม่ทราบเวลา"}
                      </p>
                  )}
                    
                  </div>
                </div>
                )}
            </div>

            {/* ✅ Modal ยืนยันการใช้ */}
            {showConfirm && (
                <div
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[60]"
                style={{ backdropFilter: "blur(2px)" }}
                >
                <div className="bg-white rounded-xl shadow-lg p-6 w-80 space-y-4 text-center">
                    <h2 className="text-xl font-bold">ยืนยันการใช้รางวัล</h2>
                    <p className="text-sm text-gray-600">
                    เมื่อกดยืนยันแล้วจะไม่สามารถย้อนกลับได้
                    </p>

                    <div className="flex gap-2 justify-center mt-4">
                    <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleUseReward}
                        disabled={usingReward}
                        className="px-4 py-2 bg-paseo text-white rounded-lg hover:bg-paseo-dark"
                    >
                        {usingReward ? "กำลังใช้..." : "ยืนยันใช้รางวัล"}
                    </button>
                    </div>
                </div>
                </div>
            )}

            {/* ✅ Modal หลังใช้สำเร็จ */}
            {successMessage && (
                <div
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[70]"
                style={{ backdropFilter: "blur(2px)" }}
                >
                <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full text-center">
                    <h2 className="text-lg font-semibold mb-2">{successMessage}</h2>
                    <p className="text-gray-600 mb-4">คุณสามารถกลับไปยังหน้ารางวัลของคุณได้</p>

                    <button
                    onClick={handleSuccessClose}
                    className="px-4 py-2 rounded-lg bg-paseo text-white font-semibold hover:bg-paseo-dark transition"
                    >
                    ตกลง
                    </button>
                </div>
            </div>
        )}
        </div>
    </div>
  );
}
