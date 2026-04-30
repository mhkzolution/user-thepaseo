"use client";

import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useFavorite } from "@/contexts/FavoriteContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserProfile from "@/components/UserProfile/page";
import Loading from '@/components/loading';
import HeaderMobile from '@/components/HeaderMobile/page';

import { IoHeartSharp } from "react-icons/io5";

type Favorite = {
  id: string;
  targetId: string;
  targetType: "CAMPAIGN" | "COUPON" | "REWARD" | "EVENT" | "SHOP";
  createdAt: string;
  isExpired?: boolean; // ⭐ เพิ่ม
  target: {
    id: string;
    name: string;
    imageUrl: string;
    endDate?: string;
  } | null;
};

const TAB_LABELS: Record<string, string> = {
  CAMPAIGN: "แคมเปญ",
  COUPON: "คูปอง",
  REWARD: "รางวัล",
  EVENT: "กิจกรรม",
  SHOP: "ร้านค้า",
};

function favoritesFromResponse(raw: unknown): Favorite[] {
  if (Array.isArray(raw)) return raw as Favorite[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.favorites)) return o.favorites as Favorite[];
    if (Array.isArray(o.data)) return o.data as Favorite[];
  }
  return [];
}

function favoriteUrl(apiUrl: string) {
  return `${apiUrl}/favorite?_t=${Date.now()}`;
}

export default function FavoritePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, loading: authLoading } = useContext(AuthContext);
  const { favorites: favoriteKeys, toggleFavorite } = useFavorite();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "CAMPAIGN" | "COUPON" | "REWARD" | "EVENT"| "SHOP"
  >("CAMPAIGN");
  const lastFetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    const reloadGuardKey = `auth-retry:${window.location.pathname}`;
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      if (sessionStorage.getItem(reloadGuardKey) !== "1") {
        sessionStorage.setItem(reloadGuardKey, "1");
        window.location.reload();
        return;
      }
      setAuthError("ไม่สามารถยืนยันผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่");
      lastFetchedUserId.current = null;
      setFavorites([]);
      setLoading(false);
      return;
    }

    sessionStorage.removeItem(reloadGuardKey);
    setAuthError(null);

    let cancelled = false;
    const showFullPageLoader = lastFetchedUserId.current !== user.id;
    if (showFullPageLoader) setLoading(true);

    const fetchFavorites = async () => {
      try {
        const res = await fetchWithAuth(favoriteUrl(API_URL), {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setFavorites([]);
          return;
        }
        const data = await res.json();
        const list = favoritesFromResponse(data);

        const sorted = [...list].sort((a: Favorite, b: Favorite) => {
          if (a.isExpired === b.isExpired) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isExpired ? 1 : -1;
        });

        if (!cancelled) {
          setFavorites(sorted);
          lastFetchedUserId.current = user.id;
        }
      } catch {
        if (!cancelled) setFavorites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, favoriteKeys, API_URL, reloadKey]);

  useEffect(() => {
    const onFocus = () => setReloadKey((v) => v + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleUnfavorite = async (targetId: string, targetType: string) => {
    toggleFavorite(targetId, targetType);
  };

  if (loading) return <Loading />;
  if (authError) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-red-500">
        {authError}
      </div>
    );
  }

  // group by type
  const grouped = favorites.reduce((acc: Record<string, Favorite[]>, fav) => {
    if (!acc[fav.targetType]) acc[fav.targetType] = [];
    acc[fav.targetType].push(fav);
    return acc;
  }, {});



  return (
      <div className="max-w-2xl mx-auto p-0 mb-20 md:mt-10 md:mb-20 mb-4 rounded-xl">
      
            <HeaderMobile />
      
            <div className="p-0 md:mt-16 mt-9 rounded-xl">
              <div className="w-full py-4 px-4 md:py-10 md:px-20">
                <UserProfile showOn="both" />
              </div>
            </div>
      
            <div className="w-full bg-white p-4 py-6 md:p-10 md:pt-10 rounded-3xl">
  
              <div className="flex flex-col gap-4">
                <h1 className="text-xl font-semibold flex-1 text-center">รายการโปรดของฉัน</h1>

                <div className="flex flex-row gap-2 mb-2">
                  <div className="w-full overflow-x-auto mb-0 scrollbar-hidden">
                    <div className="flex gap-1 whitespace-nowrap">
                      {["CAMPAIGN", "COUPON", "REWARD", "EVENT", "SHOP"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`py-2 px-4 text-xs font-semibold flex-shrink-0 flex-1 border rounded-lg ${
                            activeTab === tab
                              ? "bg-paseo text-white border-paseo-dark"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {TAB_LABELS[tab]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 w-full">
                  {/* Content */}
                  {!grouped[activeTab]?.length ? (
                      <div className="text-center text-gray-500">
                      ยังไม่มี {TAB_LABELS[activeTab]} ที่บันทึกไว้
                      </div>
                  ) : (
                      <div className="space-y-4">
                      {grouped[activeTab]?.map((fav) => (
                          <div
                          key={fav.id}
                          onClick={() =>
                              fav.target &&
                              router.push(`/${fav.targetType.toLowerCase()}/${fav.target.id}`)
                          }
                          className="p-2 border rounded-xl flex hover:bg-gray-50 cursor-pointer"
                          >
                          <div className="w-full flex gap-4 relative">
                              <div className="w-40% flex flex-col justify-between rounded-xl overflow-hidden shadow border border-gray-100">
                                <Image
                                  src={fav.target?.imageUrl?.trim()
                                    ? fav.target.imageUrl
                                    : "/main/no-image.png"}
                                  alt={fav.target?.name || "no image"}
                                  width={ 600 }
                                  height={ 600 }
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="w-60% flex flex-col justify-between">
                                  <div className="flex flex-col gap-2">
                                      <p className="text-sm font-semibold">
                                        {fav.target?.name}
                                      </p>

                                      {fav.isExpired && (
                                        <span className={`p-2 border rounded-xl flex bg-gray-100 hover:bg-gray-50 cursor-pointer ${
                                          fav.isExpired ? "opacity-50" : ""
                                        }`}>
                                          หมดเขตแล้ว
                                        </span>
                                      )}
                                      <p className="text-xs text-gray-400">
                                          เพิ่มเมื่อ: {new Date(fav.createdAt).toLocaleString()}
                                      </p>
                                  </div>

                                  <button
                                      onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnfavorite(fav.targetId, fav.targetType);
                                      }}
                                      className="blur2 p-2 shadow border border-gray-200 text-red-500 rounded-full absolute bottom-0 right-1"
                                  >
                                      <IoHeartSharp size={24} />
                                  </button>
                                  
                              </div>
                          </div>
                        
                        </div>
                    ))}
                    </div>
                )}
              </div>

            </div>
                  
          </div>
  
      </div>
    );
  }

