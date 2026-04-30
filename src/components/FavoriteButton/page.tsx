"use client";

import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { useFavorite } from "@/contexts/FavoriteContext";

type Props = {
  targetId: string;
  targetType: string;
};

export default function FavoriteButton({ targetId, targetType }: Props) {
  const { isFavorite, toggleFavorite } = useFavorite();

  const fav = isFavorite(targetId, targetType);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(targetId, targetType);
  };

  return (
    <button
      onClick={handleClick}
      className="text-2xl"
      aria-label={fav ? "Unfavorite" : "Favorite"}
    >
      {fav ? (
        <IoHeartSharp className="text-paseo" />
      ) : (
        <IoHeartOutline />
      )}
    </button>
  );
}