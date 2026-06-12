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
  if (!games.length) return null;

  return (
    <div className="p-0 max-w-5xl mx-auto mb-6">
      <div className="flex flex-row items-end justify-between mb-3">
        <span className="text-base font-bold">มินิเกม</span>
        <Link href="/games" className="bg-gray-100 px-2 py-1 rounded-full border border-gray-20 text-xs">
          ดูทั้งหมด
        </Link>
      </div>

      <section className="embla_post">
        <div className="embla__viewport_post rounded-lg" ref={emblaRef}>
          <div className="embla__container_post">
            {games.map((game) => (
              <div className="embla__slide_campaign relative w-full" key={game.id}>
                <Link href={game.type === "CHECK_IN" ? `/games/check-in/${game.id}` : `/games/lucky-spin/${game.id}`}>
                  <div className="embla__slide__number_campaign bg-gradient-to-r from-[#6B7B3C] to-[#8a9a52] border rounded-2xl transition text-white flex items-stretch min-h-[120px]">
                    <div className="w-40% flex items-center justify-center p-4">
                      {game.imageUrl ? (
                        <Image
                          src={game.imageUrl}
                          alt={game.name}
                          width={120}
                          height={120}
                          className="rounded-xl object-cover"
                          unoptimized
                        />
                      ) : game.type === "CHECK_IN" ? (
                        <FaListCheck size={40} className="text-yellow-300" />
                      ) : (
                        <GiPerspectiveDiceSixFacesRandom size={48} className="text-yellow-300" />
                      )}
                    </div>
                    <div className="flex flex-col flex-grow w-60% p-4 gap-2 justify-center">
                      <h3 className="text-sm md:text-lg font-bold line-clamp-1">{game.name}</h3>
                      <p className="text-xs opacity-90">
                        {game.type === "CHECK_IN"
                          ? game.canClaim
                            ? "พร้อมรับรางวัล"
                            : game.progress
                              ? `Check in ${game.progress.checkInCount}/${game.progress.checkInTarget}`
                              : "ดูความคืบหน้า"
                          : game.canSpin
                            ? `พร้อมหมุน · ใช้ ${game.spinPointCost} พอยท์`
                            : "ดูเงื่อนไขการเล่น"}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
