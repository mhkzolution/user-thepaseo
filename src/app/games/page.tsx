"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import HeaderMobile from "@/components/HeaderMobile/page";
import UserProfile from "@/components/UserProfile/page";
import Loading from "@/components/loading";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { FaListCheck } from "react-icons/fa6";

type MiniGameItem = {
  id: string;
  type: string;
  name: string;
  description?: string;
  imageUrl?: string;
  canSpin?: boolean;
  canClaim?: boolean;
  hasSpun: boolean;
  unlimitedSpins?: boolean;
  spinPointCost?: number;
  requireReceipt?: boolean;
  minReceiptAmount?: number;
  progress?: {
    checkInCount: number;
    checkInTarget: number;
    spendingTotal: number;
    spendingTarget: number;
    isComplete: boolean;
  };
  reasons: string[];
  endDate: string;
};

function gameHref(game: MiniGameItem) {
  return game.type === "CHECK_IN"
    ? `/games/check-in/${game.id}`
    : `/games/lucky-spin/${game.id}`;
}

function gameSubtitle(game: MiniGameItem) {
  if (game.hasSpun && !game.unlimitedSpins) return "เสร็จสิ้นแล้ว";
  if (game.type === "CHECK_IN" && game.progress) {
    const p = game.progress;
    if (game.canClaim) return "พร้อมรับรางวัล!";
    return `Check in ${p.checkInCount}/${p.checkInTarget} · ยอด ${p.spendingTotal.toLocaleString("th-TH")}/${p.spendingTarget.toLocaleString("th-TH")} บาท`;
  }
  if (game.canSpin) {
    const receiptHint =
      game.requireReceipt === false
        ? ""
        : game.minReceiptAmount != null
          ? ` · ใบเสร็จ ≥ ${game.minReceiptAmount} บาท`
          : "";
    return `พร้อมหมุน · ใช้ ${game.spinPointCost} พอยท์${receiptHint}`;
  }
  if (game.reasons[0]) return game.reasons[0];
  if (game.requireReceipt === false) return "ยังหมุนไม่ได้";
  return `ใบเสร็จ ≥ ${game.minReceiptAmount} บาท`;
}

export default function GamesPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [games, setGames] = useState<MiniGameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/mini-games`);
        if (!res.ok) throw new Error("failed");
        setGames(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_URL]);

  return (
    <div className="max-w-2xl mx-auto p-0 mb-20 rounded-xl">
      <HeaderMobile />
      <div className="md:hidden p-0 pt-8 -mb-18 rounded-xl">
        <div className="w-full pt-4 pb-0 px-4">
          <UserProfile showOn="both" />
        </div>
      </div>

      <div className="w-full bg-white p-4 pt-20 md:p-10 md:mt-20 mt-6 rounded-t-3xl min-h-[60vh]">
        <h1 className="text-xl font-semibold mb-4">มินิเกม</h1>

        {loading ? (
          <Loading />
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-gray-600">
            ยังไม่มีกิจกรรมมินิเกมในขณะนี้
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={gameHref(game)}
                className="block rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="flex bg-gradient-to-r from-[#6B7B3C] to-[#8a9a52] text-white">
                  <div className="w-28 shrink-0 flex items-center justify-center p-3">
                    {game.imageUrl ? (
                      <Image src={game.imageUrl} alt={game.name} width={96} height={96} className="rounded-xl object-cover" unoptimized />
                    ) : game.type === "CHECK_IN" ? (
                      <FaListCheck size={36} className="text-yellow-300" />
                    ) : (
                      <GiPerspectiveDiceSixFacesRandom size={40} className="text-yellow-300" />
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-xs opacity-80">
                      {game.type === "CHECK_IN" ? "Check-in" : "Lucky Spin"}
                    </p>
                    <h2 className="font-bold text-lg">{game.name}</h2>
                    <p className="text-sm opacity-90 mt-1">{gameSubtitle(game)}</p>
                    <p className="text-xs opacity-75 mt-2">
                      ถึง {new Date(game.endDate).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
