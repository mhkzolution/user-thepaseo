"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { AuthContext } from "./AuthContext";

type FavoriteContextType = {
  favorites: Set<string>;
  toggleFavorite: (targetId: string, targetType: string) => Promise<void>;
  isFavorite: (targetId: string, targetType: string) => boolean;
};

const FavoriteContext = createContext<FavoriteContextType | null>(null);

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [favorites, setFavorites] = useState<Set<string>>(new Set<string>());
  const { user } = useContext(AuthContext);

  function favoriteUrl() {
    return `${API_URL}/favorite?_t=${Date.now()}`;
  }

  function toFavoriteSet(payload: any): Set<string> {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.favorites)
      ? payload.favorites
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    return new Set<string>(
      list
        .filter((f: any) => f?.targetType && f?.targetId)
        .map((f: any) => `${String(f.targetType).toUpperCase()}-${f.targetId}`)
    );
  }

  useEffect(() => {
  async function loadFavorites() {

    const token = localStorage.getItem("token")

    // ❗ ยังไม่ได้ login → ไม่ต้องโหลด favorite
    if (!token) {
      setFavorites(new Set());
      return;
    }

    try {
      const res = await fetchWithAuth(favoriteUrl(), {
        cache: "no-store",
      })

      if (!res.ok) {
        // ล้างเฉพาะเมื่อไม่มีสิทธิ์ — อย่าล้างเมื่อ 5xx/ชั่วคราว เพราะจะทำให้หัวใจหายทั้งแอป
        if (res.status === 401 || res.status === 403) {
          setFavorites(new Set());
        }
        return;
      }

      const data = await res.json()
      setFavorites(toFavoriteSet(data))

    } catch (err) {
      console.error("load favorite error", err)
    }
  }

  loadFavorites()
}, [API_URL, user?.id])

  const isFavorite = (targetId: string, targetType: string) => {
    return favorites.has(`${targetType}-${targetId}`);
  };

  const toggleFavorite = async (targetId: string, targetType: string) => {
    const key = `${targetType}-${targetId}`;

    // optimistic update
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });

    try {
      const res = await fetchWithAuth(`${API_URL}/favorite`, {
        method: "POST",
        body: JSON.stringify({ targetId, targetType }),
      });
      if (!res.ok) {
        const sync = await fetchWithAuth(favoriteUrl(), {
          cache: "no-store",
        });
        if (sync.ok) {
          const data = await sync.json();
          setFavorites(toFavoriteSet(data));
        }
      }
    } catch (err) {
      console.error("toggle favorite error", err);
      try {
        const sync = await fetchWithAuth(favoriteUrl(), {
          cache: "no-store",
        });
        if (sync.ok) {
          const data = await sync.json();
          setFavorites(toFavoriteSet(data));
        }
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  const ctx = useContext(FavoriteContext);
  if (!ctx) throw new Error("useFavorite must be used inside FavoriteProvider");
  return ctx;
}