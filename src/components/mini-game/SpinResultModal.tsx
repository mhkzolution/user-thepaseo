"use client";

import Image from "next/image";
import { getPrizeIconPath, getPrizeResultDisplay } from "./prizeIcons";

type Props = {
  open: boolean;
  label: string;
  prizeType: string;
  pointAmount?: number | null;
  userCouponId?: string | null;
  rewardParticipationId?: string | null;
  onClose: () => void;
  onClaim?: () => void;
};

export default function SpinResultModal({
  open,
  label,
  prizeType,
  pointAmount,
  onClose,
  onClaim,
}: Props) {
  if (!open) return null;

  const display = getPrizeResultDisplay(prizeType, label, pointAmount);
  const iconPath = getPrizeIconPath(prizeType);

  const handleClaim = () => {
    onClaim?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`absolute h-2 w-2 rounded-sm ${
              i % 3 === 0 ? "bg-paseo" : i % 3 === 1 ? "bg-[#E8C547]" : "bg-paseo-dark"
            }`}
            style={{
              left: `${8 + (i * 7) % 84}%`,
              top: `${10 + (i * 11) % 30}%`,
              transform: `rotate(${i * 30}deg)`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in duration-300">
        {/* Header banner */}
        <div className="relative z-10 mx-auto -mb-5 flex w-[85%] items-center justify-center">
          <div className="relative flex w-full items-center justify-center rounded-full bg-paseo-dark px-6 py-2.5 shadow-lg">
            <span className="absolute -left-2 text-paseo-hover text-lg">🍃</span>
            <h2 className="text-lg font-bold text-white">ยินดีด้วย!</h2>
            <span className="absolute -right-2 text-paseo-hover text-lg">🍃</span>
          </div>
        </div>

        <div className="relative rounded-3xl bg-white px-6 pb-6 pt-10 text-center shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-paseo-hover text-paseo-dark"
            aria-label="ปิด"
          >
            ✕
          </button>

          <p className="text-base font-semibold text-paseo-dark">{display.headline}</p>

          <div className="relative mx-auto my-5 flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-paseo-hover/60 blur-md" />
            <Image
              src={iconPath}
              alt={display.subtitle}
              width={96}
              height={96}
              className="relative z-10 h-24 w-24 object-contain drop-shadow-lg"
              unoptimized
            />
          </div>

          {prizeType === "POINTS" && pointAmount ? (
            <>
              <p className="text-4xl font-extrabold text-paseo-dark">{display.value}</p>
              <p className="mt-1 text-lg font-medium text-paseo-dark/80">{display.subtitle}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-extrabold leading-snug text-paseo-dark">{display.value}</p>
              <p className="mt-1 text-base font-medium text-paseo-dark/80">{display.subtitle}</p>
            </>
          )}

          <button
            type="button"
            onClick={handleClaim}
            className="mt-6 w-full rounded-full bg-gradient-to-b from-paseo to-paseo-dark py-3.5 text-base font-bold text-white shadow-lg transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-95"
          >
            รับรางวัล
          </button>
        </div>
      </div>
    </div>
  );
}
