"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
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
  spinPointCost?: number;
  progress?: {
    checkInCount: number;
    checkInTarget: number;
  };
};

function getGameStatus(game: MiniGameItem): { label: string; disabled: boolean } {
  if (game.type === "CHECK_IN") {
    if (game.canClaim) return { label: "รับรางวัล", disabled: false };
    if (game.progress) {
      return {
        label: `${game.progress.checkInCount}/${game.progress.checkInTarget} ครั้ง`,
        disabled: true,
      };
    }
    return { label: "ดูความคืบหน้า", disabled: false };
  }

  if (game.canSpin) {
    const cost = game.spinPointCost ?? 0;
    return {
      label: cost === 0 ? "หมุนเลย" : `${cost} พอยท์`,
      disabled: false,
    };
  }

  return { label: "ดูเงื่อนไข", disabled: true };
}

function getGameHref(game: MiniGameItem) {
  return game.type === "CHECK_IN"
    ? `/games/check-in/${game.id}`
    : `/games/lucky-spin/${game.id}`;
}

export default function MiniGameList() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [games, setGames] = useState<MiniGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef] = useEmblaCarousel();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_URL}/mini-games?excludePlayed=true`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setGames(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_URL]);

  if (loading) return <Loading />;

  if (!games.length) {
    return (
      <div className="p-0 max-w-5xl mx-auto mb-6">
        <div className="flex flex-row items-end justify-between mb-3">
          <span className="text-base font-bold">มินิเกม</span>
        </div>

        <div
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paseo-hover">
            <GiPerspectiveDiceSixFacesRandom className="text-paseo-dark" size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-gray-800">ยังไม่มีมินิเกม</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 max-w-5xl mx-auto mb-0">
      <div className="flex flex-row items-end justify-between mb-3">
        <span className="text-base font-bold">มินิเกม</span>
        <Link href="/games" className="bg-gray-100 px-2 py-1 rounded-full border border-gray-20 text-xs">
          ดูทั้งหมด
        </Link>
      </div>

      <section className="embla_post">
        <div className="embla__viewport_post rounded-lg" ref={emblaRef}>
          <div className="embla__container_post">
            {games.map((game) => {
              const { label, disabled } = getGameStatus(game);

              return (
                <div className="embla__slide_coupon relative w-full" key={game.id}>
                  <Link
                    href={getGameHref(game)}
                    className="w-full h-full flex flex-row p-0 rounded-xl overflow-hidden transition"
                  >
                    <div className="relative w-full h-full flex flex-col">
                      <div className="relative w-full h-full flex flex-col">
                        <div className="w-full aspect-square rounded-xl overflow-hidden p-3 bg-gray-100">
                          {game.imageUrl ? (
                            <Image
                              src={game.imageUrl}
                              alt={game.name}
                              width={300}
                              height={300}
                              className="w-full h-full rounded-xl object-cover"
                              unoptimized
                              priority
                              placeholder="blur"
                              blurDataURL="/blur-placeholder.jpg"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-[#6B7B3C] to-[#8a9a52]">
                              {game.type === "CHECK_IN" ? (
                                <FaListCheck size={48} className="text-yellow-300" />
                              ) : (
                                <GiPerspectiveDiceSixFacesRandom size={52} className="text-yellow-300" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-full rounded-xl flex flex-col gap-2 p-2 bg-gray-100">
                          <div className="w-full px-1" style={{ minHeight: "2rem" }}>
                            <h3 className="text-xs font-semibold line-clamp-2 leading-4 text-center">
                              {game.name.length > 40
                                ? game.name.substring(0, 40) + "..."
                                : game.name}
                            </h3>
                          </div>

                          <button
                            type="button"
                            className={`py-1 w-full rounded-full text-xs md:text-sm font-bold flex flex-row items-center justify-center gap-2 hover:text-black ${
                              disabled
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-paseo text-white"
                            }`}
                            disabled={disabled}
                          >
                            {label}
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
      </section>
    </div>
  );
}
