"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import BackButton from "@/components/BackButton/page";
import Loading from "@/components/loading";
import LuckySpinWheel, { type WheelSegment } from "@/components/mini-game/LuckySpinWheel";
import SpinResultModal from "@/components/mini-game/SpinResultModal";
import MiniGamePrizeList, { type PrizeListItem } from "@/components/mini-game/MiniGamePrizeList";
import { resolveWheelSlotIndex } from "@/components/mini-game/wheelSegmentLayout";
import Image from "next/image";

type GameDetail = {
  id: string;
  name: string;
  description?: string;
  terms?: string;
  spinPointCost: number;
  maxSpinsPerUser: number;
  minReceiptAmount: number;
  requireReceipt: boolean;
  prizes: (WheelSegment & PrizeListItem)[];
  status: {
    canSpin: boolean;
    hasSpun: boolean;
    spinCount: number;
    maxSpinsPerUser: number;
    remainingSpins: number | null;
    unlimitedSpins: boolean;
    requireReceipt: boolean;
    reasons: string[];
    pointBalance: number;
    prizesAvailable?: boolean;
  };
  wonPrize: {
    label: string;
    prizeType: string;
    pointAmount: number | null;
    userCouponId: string | null;
    rewardParticipationId?: string | null;
    sortOrder: number;
  } | null;
};

function remainingSpins(game: GameDetail): number | null {
  if (game.status.unlimitedSpins) {
    if (game.spinPointCost > 0) {
      return Math.floor(game.status.pointBalance / game.spinPointCost);
    }
    return null;
  }

  const limitLeft = game.status.remainingSpins ?? 0;
  if (limitLeft === 0) return 0;
  if (game.spinPointCost > 0) {
    const pointSpins = Math.floor(game.status.pointBalance / game.spinPointCost);
    return Math.min(limitLeft, pointSpins);
  }
  return limitLeft;
}

function formatSpinsLeftLabel(game: GameDetail): string {
  const left = remainingSpins(game);
  if (game.status.unlimitedSpins) {
    if (game.spinPointCost > 0 && left != null) {
      return `${left.toLocaleString("th-TH")} ครั้ง (ตามพอยท์)`;
    }
    return "ไม่จำกัด";
  }
  return `${(left ?? 0).toLocaleString("th-TH")} สิทธิ์`;
}

export default function LuckySpinPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    prizeType: string;
    pointAmount: number | null;
    userCouponId: string | null;
    rewardParticipationId?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/mini-games/${id}`);
      if (!res.ok) throw new Error("ไม่พบกิจกรรม");
      setGame(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [API_URL, id]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleSpin = async () => {
    if (!game || spinning || !game.status.canSpin) return;
    setError(null);
    setSpinning(true);
    setResult(null);
    setShowResultModal(false);

    try {
      const res = await fetchWithAuth(`${API_URL}/mini-games/${id}/spin`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "หมุนไม่สำเร็จ");

      const sortedPrizes = [...game.prizes].sort((a, b) => a.sortOrder - b.sortOrder);
      const slotIndex =
        typeof data.prizeIndex === "number" &&
        Number.isInteger(data.prizeIndex) &&
        data.prizeIndex >= 0 &&
        data.prizeIndex < sortedPrizes.length
          ? data.prizeIndex
          : resolveWheelSlotIndex(sortedPrizes, {
              id: data.prize?.id,
            });

      setTargetIndex(slotIndex);
      setSpinTrigger((n) => n + 1);
      setResult({
        label: data.prize.label,
        prizeType: data.prize.prizeType,
        pointAmount: data.prize.pointAmount,
        userCouponId: data.userCouponId,
        rewardParticipationId: data.rewardParticipationId,
      });
    } catch (e) {
      setSpinning(false);
      setTargetIndex(null);
      setError(e instanceof Error ? e.message : "หมุนไม่สำเร็จ");
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    if (result) {
      setShowResultModal(true);
    }
    loadGame();
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

  const spinsLeft = remainingSpins(game);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f7faf0] via-paseo-hover/40 to-[#eef5dc] pb-28">
      {/* Header */}
      <div className="relative z-10 px-4 pt-4">
        <div className="flex items-start justify-between">
          <BackButton className="!mb-0 rounded-full bg-white/80 shadow-sm" />
          {game.terms && (
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="flex flex-col items-center gap-0.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-paseo-dark shadow-sm">
                i
              </span>
              <span className="text-[10px] font-medium text-paseo-dark">กติกา</span>
            </button>
          )}
        </div>

        <div className="mt-2 text-center">
          <h1 className="text-3xl font-extrabold text-paseo-dark">Lucky Spin</h1>
          <p className="mt-1 text-sm text-paseo-dark/70">
            ลุ้นรับสิทธิพิเศษจาก Paseo Life
          </p>
        </div>

        {/* Remaining spins pill */}
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm">
          <Image
            src="/icon/icon-profile-coupon.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
            unoptimized
          />
          <span className="text-sm text-paseo-dark/80">สิทธิ์คงเหลือ</span>
          <span className="text-sm font-bold text-paseo-dark">
            {formatSpinsLeftLabel(game)}
          </span>
        </div>
      </div>

      {/* Wheel */}
      <div className="relative z-10 mx-auto max-w-md px-4 pt-6">
        <LuckySpinWheel
          segments={game.prizes}
          spinning={spinning}
          targetIndex={targetIndex}
          spinTrigger={spinTrigger}
          onSpinEnd={handleSpinEnd}
          onSpin={handleSpin}
          canSpin={game.status.canSpin}
          spinPointCost={game.spinPointCost}
          disabled={!game.status.canSpin}
        />

        <div className="mt-10 space-y-3">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>
          )}

          {!game.status.hasSpun && !game.status.canSpin && game.status.reasons.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p className="mb-1 font-medium">เงื่อนไขที่ยังไม่ครบ:</p>
              <ul className="list-disc space-y-1 pl-5">
                {game.status.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {game.status.hasSpun && !game.status.unlimitedSpins && (
            <p className="text-center text-sm text-paseo-dark/60">
              คุณใช้สิทธิ์หมุนครบ {game.status.maxSpinsPerUser} ครั้งแล้ว
            </p>
          )}

          {!game.status.hasSpun && game.status.spinCount > 0 && !game.status.unlimitedSpins && (
            <p className="text-center text-sm text-paseo-dark/60">
              หมุนแล้ว {game.status.spinCount}/{game.status.maxSpinsPerUser} ครั้ง
            </p>
          )}

          {game.status.unlimitedSpins && game.status.spinCount > 0 && (
            <p className="text-center text-sm text-paseo-dark/60">
              หมุนแล้ว {game.status.spinCount.toLocaleString("th-TH")} ครั้ง
            </p>
          )}
        </div>

        <MiniGamePrizeList prizes={game.prizes} />
      </div>

      {/* Terms modal */}
      {showTerms && game.terms && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-paseo-dark">กติกา</h3>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paseo-hover text-paseo-dark"
              >
                ✕
              </button>
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: game.terms }}
            />
          </div>
        </div>
      )}

      <SpinResultModal
        open={showResultModal}
        label={result?.label ?? game.wonPrize?.label ?? ""}
        prizeType={result?.prizeType ?? game.wonPrize?.prizeType ?? ""}
        pointAmount={result?.pointAmount ?? game.wonPrize?.pointAmount}
        userCouponId={result?.userCouponId ?? game.wonPrize?.userCouponId}
        rewardParticipationId={result?.rewardParticipationId ?? game.wonPrize?.rewardParticipationId}
        onClose={() => setShowResultModal(false)}
      />
    </div>
  );
}
