"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  getContrastTextColor,
  getPrizeIconPath,
  resolveSegmentColor,
} from "./prizeIcons";
import {
  computeSpinTargetAngle,
  getWheelSegmentLayout,
  segmentLabelTransform,
  truncateSegmentLabel,
} from "./wheelSegmentLayout";
import { wheelSlotBisectorDeg, wheelSlotEndDeg, wheelSlotStartDeg } from "./wheelGeometry";
import { describeWheelWedge } from "./wheelWedge";

export type WheelSegment = {
  id: string;
  label: string;
  color: string;
  sortOrder: number;
  prizeType: string;
  pointAmount?: number | null;
};

type Props = {
  segments: WheelSegment[];
  spinning: boolean;
  targetIndex: number | null;
  spinTrigger: number;
  onSpinEnd?: () => void;
  onSpin?: () => void;
  canSpin?: boolean;
  spinPointCost?: number;
  disabled?: boolean;
};

function segmentShortLabel(seg: WheelSegment, maxChars: number): string {
  if (seg.prizeType === "POINTS" && seg.pointAmount) {
    return `${seg.pointAmount}\nPaseopoint`;
  }
  return truncateSegmentLabel(seg.label, maxChars);
}

function rimPoint(angleFromTopDeg: number, radiusPercent: number) {
  const rad = (angleFromTopDeg * Math.PI) / 180;
  return {
    x: 50 + radiusPercent * Math.sin(rad),
    y: 50 - radiusPercent * Math.cos(rad),
  };
}

export default function LuckySpinWheel({
  segments,
  spinning,
  targetIndex,
  spinTrigger,
  onSpinEnd,
  onSpin,
  canSpin = false,
  spinPointCost = 0,
  disabled = false,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [baseRadius, setBaseRadius] = useState(90);

  const sorted = useMemo(
    () => [...segments].sort((a, b) => a.sortOrder - b.sortOrder),
    [segments]
  );
  const slotCount = sorted.length || 8;
  const layout = useMemo(() => getWheelSegmentLayout(slotCount), [slotCount]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    const updateRadius = () => {
      setBaseRadius((el.offsetWidth / 2) * layout.radiusRatio);
    };

    updateRadius();
    const observer = new ResizeObserver(updateRadius);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout.radiusRatio]);

  const handleTransitionEnd = () => {
    if (spinning && targetIndex != null) {
      onSpinEnd?.();
    }
  };

  useEffect(() => {
    if (!spinning || targetIndex == null || spinTrigger <= 0) return;
    const extraTurns = 5;
    const targetAngle = computeSpinTargetAngle(targetIndex, slotCount, layout);
    setRotation((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      return prev + extraTurns * 360 + targetAngle - normalized;
    });
  }, [spinning, targetIndex, spinTrigger, slotCount, layout]);

  const spinLabel =
    spinPointCost > 0 ? `ใช้ ${spinPointCost} พอยท์` : "ใช้ 1 สิทธิ์";

  return (
    <div className="relative mx-auto w-full max-w-[340px] pb-2">
      <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-2">
        <div className="relative flex flex-col items-center">
          <svg width="56" height="64" viewBox="0 0 56 64" fill="none" className="drop-shadow-md">
            <path
              d="M28 64C28 64 4 36 4 20C4 9.50659 12.5066 1 23 1H33C43.4934 1 52 9.50659 52 20C52 36 28 64 28 64Z"
              fill="#688e22"
            />
            <circle cx="28" cy="22" r="16" fill="white" />
          </svg>
          <Image
            src="/logo.png"
            alt="Paseo Life"
            width={24}
            height={24}
            className="absolute top-[10px] object-contain"
            unoptimized
          />
        </div>
      </div>

      <div className="relative rounded-full bg-paseo-dark p-3 shadow-[0_8px_32px_rgba(104,142,34,0.35)]">
        <div className="pointer-events-none absolute inset-3 rounded-full">
          {Array.from({ length: slotCount * 2 }).map((_, i) => {
            const bisector = (i * 360) / (slotCount * 2);
            const pos = rimPoint(bisector, 47);
            return (
              <span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}
        </div>

        <div
          ref={wheelRef}
          className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-paseo-hover bg-[#eef5dc] transition-transform duration-[4s] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {sorted.map((seg, i) => (
              <path
                key={`wedge-${seg.id}`}
                d={describeWheelWedge(
                  50,
                  50,
                  50,
                  wheelSlotStartDeg(i, slotCount),
                  wheelSlotEndDeg(i, slotCount)
                )}
                fill={resolveSegmentColor(seg.color, i)}
              />
            ))}
          </svg>

          {sorted.map((seg, i) => {
            const bisector = wheelSlotBisectorDeg(i, slotCount);
            const fill = resolveSegmentColor(seg.color, i);
            const textColor = getContrastTextColor(fill);

            return (
              <div
                key={seg.id}
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex flex-col items-center"
                style={{
                  width: layout.contentWidth,
                  gap: layout.gap,
                  transform: segmentLabelTransform(bisector, baseRadius, layout),
                }}
              >
                <Image
                  src={getPrizeIconPath(seg.prizeType)}
                  alt=""
                  width={layout.iconSize}
                  height={layout.iconSize}
                  className="shrink-0 object-contain"
                  style={{ width: layout.iconSize, height: layout.iconSize }}
                  unoptimized
                />
                <span
                  className="whitespace-pre-line text-center"
                  style={{
                    color: textColor,
                    fontSize: layout.fontSize,
                    fontWeight: layout.fontWeight,
                    lineHeight: layout.lineHeight,
                  }}
                >
                  {segmentShortLabel(seg, layout.maxLabelChars)}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onSpin}
          disabled={disabled || spinning || !canSpin}
          className={`absolute left-1/2 top-1/2 z-20 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-[#E8C547] bg-gradient-to-b from-paseo to-paseo-dark text-white shadow-lg transition-transform duration-150 ease-out hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${spinning ? "scale-95" : ""}`}
        >
          <span className="text-xl font-extrabold tracking-wide">
            {spinning ? "…" : "หมุน"}
          </span>
          <span className="text-[10px] font-medium opacity-90">{spinLabel}</span>
        </button>
      </div>
    </div>
  );
}
