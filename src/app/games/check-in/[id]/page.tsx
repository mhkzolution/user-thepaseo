"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Loading from "@/components/loading";
import SpinResultModal from "@/components/mini-game/SpinResultModal";
import CheckInGameUI, { type CheckInSlot } from "@/components/mini-game/CheckInGameUI";

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
      todayDailySpending: number;
      todayDailyThreshold: number;
      todayStampEarned: boolean;
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

function buildSlots(
  stamps: Stamp[],
  checkInTarget: number,
  checkInComplete: boolean,
  todayStampEarned: boolean
): { slots: CheckInSlot[]; checkedInToday: boolean } {
  const checkedInToday = todayStampEarned;

  const slots: CheckInSlot[] = Array.from({ length: checkInTarget }, (_, i) => {
    const stamp = stamps[i];
    if (stamp) {
      return {
        filled: true,
        date: formatStampDate(stamp.checkedInAt),
      };
    }
    return { filled: false, date: null };
  });

  if (!checkInComplete && !checkedInToday && stamps.length < checkInTarget) {
    slots[stamps.length] = { filled: false, date: null, isToday: true };
  }

  return { slots, checkedInToday };
}

export default function CheckInGamePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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

  const slotData = useMemo(() => {
    if (!game) return { slots: [], checkedInToday: false };
    const { progress } = game.status;
    return buildSlots(
      progress.stamps,
      progress.checkInTarget,
      progress.checkInComplete,
      progress.todayStampEarned
    );
  }, [game]);

  if (loading) return <Loading />;
  if (!game) {
    return (
      <div className="p-8 text-center">
        <p>{error || "ไม่พบกิจกรรม"}</p>
        <button
          type="button"
          className="mt-4 text-paseo underline"
          onClick={() => router.push("/games")}
        >
          กลับ
        </button>
      </div>
    );
  }

  const { progress } = game.status;
  const won = game.wonPrize;

  return (
    <>
      <CheckInGameUI
        name={game.name}
        imageUrl={game.imageUrl}
        checkInTarget={progress.checkInTarget}
        targetSpendingAmount={progress.spendingTarget}
        checkInCount={progress.checkInCount}
        spendingTotal={progress.spendingTotal}
        spendingComplete={progress.spendingComplete}
        checkInComplete={progress.checkInComplete}
        canClaim={game.status.canClaim}
        hasClaimed={game.status.hasClaimed}
        claiming={claiming}
        slots={slotData.slots}
        checkedInToday={slotData.checkedInToday}
        todayDailySpending={progress.todayDailySpending}
        todayDailyThreshold={progress.todayDailyThreshold}
        prizeLabel={game.completionPrize?.label}
        shopCategoryName={game.shopCategory?.name}
        onClaim={handleClaim}
        onViewBenefits={() => router.push("/privilege")}
        onShowTerms={game.terms ? () => setShowTerms(true) : undefined}
      />

      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-xl bg-red-50 p-3 text-center text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}

      {!game.status.hasClaimed &&
        !game.status.canClaim &&
        game.status.reasons.length > 0 && (
          <div className="mx-auto max-w-md px-4 pb-4">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <ul className="list-disc space-y-1 pl-5">
                {game.status.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
        open={showModal}
        label={won?.label ?? game.completionPrize?.label ?? ""}
        prizeType={won?.prizeType ?? game.completionPrize?.prizeType ?? ""}
        pointAmount={won?.pointAmount ?? game.completionPrize?.pointAmount}
        userCouponId={won?.userCouponId}
        rewardParticipationId={won?.rewardParticipationId}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
