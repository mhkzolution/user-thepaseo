'use client';

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { IoHeartOutline } from "react-icons/io5";
import { IoHeartSharp } from "react-icons/io5";

type Props = {
  targetId: string;
  targetType: string;
  userId: string;
};

export default function FavoriteButton({ targetId, targetType, userId }: Props) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
  if (!userId) return;
  async function fetchStatus() {
    const res = await fetchWithAuth(
      `${API_URL}/favorite?userId=${userId}&targetId=${targetId}&targetType=${targetType}`
    );

    const data = await res.json();
    setIsFavorite(data.isFavorite);
  }
  fetchStatus();
}, [userId, targetId, targetType]);

  const toggle = async () => {
    if (!userId) return;
    const res = await fetchWithAuth(`${API_URL}/favorite`, {
      method: "POST",
      body: JSON.stringify({ userId, targetId, targetType }),
    });
    const data = await res.json();
    setIsFavorite(data.isFavorite);
  };

  return (
    <button
      onClick={toggle}
      className="text-2xl"
      aria-label={isFavorite ? "Unfavorite" : "Favorite"}
    >
      {isFavorite ? <IoHeartSharp className="text-paseo" /> : <IoHeartOutline />}
    </button>
  );
}
