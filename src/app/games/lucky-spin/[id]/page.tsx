"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import HeaderMobile from "@/components/HeaderMobile/page";
import Loading from "@/components/loading";
import LuckySpinWheel, { type WheelSegment } from "@/components/mini-game/LuckySpinWheel";
import SpinResultModal from "@/components/mini-game/SpinResultModal";

type GameDetail = {
  id: string;
  name: string;
  description?: string;
  terms?: string;
  spinPointCost: number;
  minReceiptAmount: number;
  prizes: WheelSegment[];
  status: {
    canSpin: boolean;
    hasSpun: boolean;
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

export default function LuckySpinPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
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

      setTargetIndex(data.prizeIndex);
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

  return (
    <div className="min-h-screen bg-[#5a6832] pb-24">
      <HeaderMobile />

      <div className="mx-auto max-w-md px-4 pt-14">
        <div className="mb-6 flex flex-col items-center text-center">
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
          <h1 className="mt-1 text-xl font-bold text-white">Lucky Spin</h1>
          <p className="mt-2 text-sm text-white/80">
            พอยท์ {game.status.pointBalance} · ใช้ {game.spinPointCost} พอยท์/ครั้ง
          </p>
        </div>

        <div className="rounded-3xl bg-white px-4 py-8 shadow-lg">
          <LuckySpinWheel
            segments={game.prizes}
            spinning={spinning}
            targetIndex={targetIndex}
            spinTrigger={spinTrigger}
            onSpinEnd={handleSpinEnd}
          />

          <div className="mt-6 space-y-3">
            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3 text-center">{error}</div>
            )}

            {!game.status.hasSpun && (
              <>
                {!game.status.canSpin && game.status.reasons.length > 0 && (
                  <div className="rounded-xl bg-amber-50 text-amber-900 text-sm p-3">
                    <p className="font-medium mb-1">เงื่อนไขที่ยังไม่ครบ:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {game.status.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!game.status.canSpin || spinning}
                  className="w-full py-3.5 rounded-full bg-[#6B7B3C] text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {spinning ? "กำลังหมุน..." : "หมุนเลย"}
                </button>
              </>
            )}

            {game.status.hasSpun && (
              <p className="text-center text-gray-500 text-sm">คุณเล่นเกมนี้แล้ว</p>
            )}
          </div>
        </div>

        {game.terms && (
          <div
            className="prose prose-sm prose-invert max-w-none text-white/90 mt-6 px-2"
            dangerouslySetInnerHTML={{ __html: game.terms }}
          />
        )}
      </div>

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
