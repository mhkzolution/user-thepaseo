"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import HeaderMobile from "@/components/HeaderMobile/page";
import Loading from "@/components/loading";
import SpinResultModal from "@/components/mini-game/SpinResultModal";

type Stamp = { id: string; checkedInAt: string; receiptId: string | null };

type GameDetail = {
  id: string;
  name: string;
  description?: string;
  terms?: string;
  imageUrl?: string;
  checkInTarget: number;
  targetSpendingAmount: number | null;
  shopCategory: { id: string; name: string } | null;
  completionPrize: {
    label: string;
    prizeType: string;
    pointAmount: number | null;
  } | null;
  status: {
    canClaim: boolean;
    hasClaimed: boolean;
    reasons: string[];
    progress: {
      checkInCount: number;
      checkInTarget: number;
      spendingTotal: number;
      spendingTarget: number;
      spendingComplete: boolean;
      checkInComplete: boolean;
      isComplete: boolean;
      stamps: Stamp[];
    };
  };
  wonPrize: {
    label: string;
    prizeType: string;
    pointAmount: number | null;
    userCouponId: string | null;
    rewardParticipationId?: string | null;
  } | null;
};

function formatStampDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

export default function CheckInGamePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/mini-games/${id}`);
      if (!res.ok) throw new Error("ไม่พบกิจกรรม");
      const data = await res.json();
      if (data.type !== "CHECK_IN") throw new Error("ไม่ใช่กิจกรรม Check-in");
      setGame(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [API_URL, id]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleClaim = async () => {
    if (!game || claiming || !game.status.canClaim) return;
    setError(null);
    setClaiming(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/mini-games/${id}/claim`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "รับรางวัลไม่สำเร็จ");
      setShowModal(true);
      await loadGame();
    } catch (e) {
      setError(e instanceof Error ? e.message : "รับรางวัลไม่สำเร็จ");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <Loading />;
  if (!game) {
    return (
      <div className="p-8 text-center">
        <p>{error || "ไม่พบกิจกรรม"}</p>
        <button type="button" className="mt-4 text-paseo underline" onClick={() => router.push("/games")}>
          กลับ
        </button>
      </div>
    );
  }

  const { progress } = game.status;
  const spendingPct =
    progress.spendingTarget > 0
      ? Math.min(100, (progress.spendingTotal / progress.spendingTarget) * 100)
      : 100;
  const categoryHint = game.shopCategory?.name
    ? `เฉพาะหมวด ${game.shopCategory.name}`
    : "";

  const goalText = [
    progress.spendingTarget > 0
      ? `สะสมยอดครบ ${progress.spendingTarget.toLocaleString("th-TH")} บาท`
      : null,
    `Check in ครบ ${progress.checkInTarget} ครั้ง`,
  ]
    .filter(Boolean)
    .join(" และ ");

  const slots = Array.from({ length: progress.checkInTarget }, (_, i) => {
    const stamp = progress.stamps[i];
    return stamp
      ? { filled: true, date: formatStampDate(stamp.checkedInAt) }
      : { filled: false, date: null };
  });

  const won = game.wonPrize;

  return (
    <div className="min-h-screen bg-[#5a6832] pb-24">
      <HeaderMobile />

      <div className="mx-auto max-w-md px-4 pt-14">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#6B7B3C] shadow-md">
            <Image
              src={`${BASE_URL}/logo.png`}
              alt="Paseo Life"
              width={56}
              height={56}
              className="object-contain p-2"
              unoptimized
            />
          </div>
          <p className="text-sm font-medium text-white/90">Paseo Life</p>
          <h1 className="mt-1 text-xl font-bold text-white">Check in</h1>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-lg space-y-5">
          {game.imageUrl && (
            <div className="rounded-2xl overflow-hidden">
              <Image
                src={game.imageUrl}
                alt={game.name}
                width={400}
                height={200}
                className="w-full h-40 object-cover"
                unoptimized
              />
            </div>
          )}

          <div>
            <h2 className="font-bold text-lg text-gray-900">{game.name}</h2>
            <p className="text-sm text-gray-600 mt-2">{goalText}</p>
            {categoryHint && (
              <p className="text-xs text-[#6B7B3C] mt-1">{categoryHint}</p>
            )}
          </div>

          {progress.spendingTarget > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">ยอดใช้จ่ายสะสม</span>
                <span className="text-gray-600">
                  {progress.spendingTotal.toLocaleString("th-TH")} /{" "}
                  {progress.spendingTarget.toLocaleString("th-TH")} บาท
                </span>
              </div>
              <div className="h-8 rounded-full bg-gray-100 overflow-hidden relative">
                <div
                  className="h-full bg-[#6B7B3C] rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${Math.max(spendingPct, 8)}%` }}
                >
                  {spendingPct > 15 && (
                    <span className="text-xs font-semibold text-white">
                      {progress.spendingTotal.toLocaleString("th-TH")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="font-medium text-sm mb-3">Check in</p>
            <div className="grid grid-cols-5 gap-2">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center border-2 ${
                    slot.filled
                      ? "border-[#6B7B3C] bg-[#6B7B3C]/10"
                      : "border-gray-200 bg-[#e8f0d4]"
                  }`}
                >
                  {slot.filled ? (
                    <>
                      <span className="text-[10px] font-bold text-[#6B7B3C] uppercase">Date</span>
                      <span className="text-[9px] text-gray-700 leading-tight px-1">{slot.date}</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              สะสม stamp อัตโนมัติเมื่อส่งใบเสร็จและได้รับพอยท์สำเร็จ
            </p>
          </div>

          {game.completionPrize && !game.status.hasClaimed && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm">
              รางวัล: <strong>{game.completionPrize.label}</strong>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>
          )}

          {game.status.hasClaimed ? (
            <p className="text-center text-gray-500 text-sm">คุณรับรางวัลแล้ว</p>
          ) : (
            <>
              {game.status.reasons.length > 0 && !game.status.canClaim && (
                <div className="rounded-xl bg-amber-50 text-amber-900 text-sm p-3">
                  <ul className="list-disc pl-5 space-y-1">
                    {game.status.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={handleClaim}
                disabled={!game.status.canClaim || claiming}
                className="w-full py-3.5 rounded-full bg-[#6B7B3C] text-white font-semibold disabled:opacity-50"
              >
                {claiming
                  ? "กำลังรับรางวัล..."
                  : game.status.canClaim
                    ? "รับรางวัล"
                    : `Check in ${progress.checkInCount}/${progress.checkInTarget}`}
              </button>
            </>
          )}
        </div>

        {game.terms && (
          <div
            className="prose prose-sm prose-invert max-w-none text-white/90 mt-6 px-2"
            dangerouslySetInnerHTML={{ __html: game.terms }}
          />
        )}
      </div>

      <SpinResultModal
        open={showModal}
        label={won?.label ?? game.completionPrize?.label ?? ""}
        prizeType={won?.prizeType ?? game.completionPrize?.prizeType ?? ""}
        pointAmount={won?.pointAmount ?? game.completionPrize?.pointAmount}
        userCouponId={won?.userCouponId}
        rewardParticipationId={won?.rewardParticipationId}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
