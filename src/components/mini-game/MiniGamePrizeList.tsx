"use client";

import Image from "next/image";
import { getPrizeIconPath, getPrizeQuantityLabel } from "./prizeIcons";

export type PrizeListItem = {
  id: string;
  label: string;
  prizeType: string;
  pointAmount?: number | null;
  quantity?: number | null;
  remainingQty?: number | null;
};

function prizeSubtitle(prize: PrizeListItem): string {
  if (prize.prizeType === "POINTS" && prize.pointAmount) {
    return `Paseopoint ${prize.pointAmount.toLocaleString("th-TH")} สิทธิ์`;
  }
  return prize.label;
}

export default function MiniGamePrizeList({ prizes }: { prizes: PrizeListItem[] }) {
  if (!prizes.length) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className="text-paseo-dark text-sm">🍃</span>
        <h2 className="text-base font-bold text-paseo-dark">รางวัลทั้งหมด</h2>
        <span className="text-paseo-dark text-sm">🍃</span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/90 shadow-md backdrop-blur-sm">
        {prizes.map((prize, index) => (
          <div
            key={prize.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              index < prizes.length - 1 ? "border-b border-paseo-hover" : ""
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paseo-hover">
              <Image
                src={getPrizeIconPath(prize.prizeType)}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-paseo-dark">{prize.label}</p>
              <p className="truncate text-xs text-paseo-dark/70">{prizeSubtitle(prize)}</p>
            </div>

            <span className="shrink-0 rounded-full bg-paseo-hover px-2.5 py-1 text-[10px] font-medium text-paseo-dark">
              {getPrizeQuantityLabel(prize.quantity, prize.remainingQty)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
