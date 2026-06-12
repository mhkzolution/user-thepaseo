"use client";

import { useEffect, useMemo, useState } from "react";

export type WheelSegment = {
  id: string;
  label: string;
  color: string;
  sortOrder: number;
};

type Props = {
  segments: WheelSegment[];
  spinning: boolean;
  targetIndex: number | null;
  spinTrigger: number;
  onSpinEnd?: () => void;
};

export default function LuckySpinWheel({
  segments,
  spinning,
  targetIndex,
  spinTrigger,
  onSpinEnd,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const sorted = useMemo(
    () => [...segments].sort((a, b) => a.sortOrder - b.sortOrder),
    [segments]
  );
  const slotCount = sorted.length || 8;
  const slice = 360 / slotCount;

  const gradient = useMemo(() => {
    if (!sorted.length) return "#E8DCC8";
    const parts = sorted.map((seg, i) => {
      const start = i * slice;
      const end = (i + 1) * slice;
      return `${seg.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from -90deg, ${parts.join(", ")})`;
  }, [sorted, slice]);

  const handleTransitionEnd = () => {
    if (spinning && targetIndex != null) {
      onSpinEnd?.();
    }
  };

  useEffect(() => {
    if (!spinning || targetIndex == null || spinTrigger <= 0) return;
    const extraTurns = 5;
    const targetAngle = 360 - (targetIndex * slice + slice / 2);
    setRotation((prev) => {
      const normalized = ((prev % 360) + 360) % 360;
      return prev + extraTurns * 360 + targetAngle - normalized;
    });
  }, [spinning, targetIndex, slice, spinTrigger]);

  return (
    <div className="relative mx-auto w-[min(100%,320px)] aspect-square">
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
        <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-b-[22px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow" />
      </div>

      <div
        className="relative h-full w-full rounded-full border-4 border-yellow-400 shadow-lg transition-transform duration-[4s] ease-out"
        style={{
          background: gradient,
          transform: `rotate(${rotation}deg)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {sorted.map((seg, i) => {
          const angle = i * slice + slice / 2 - 90;
          const rad = (angle * Math.PI) / 180;
          const radius = 38;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);

          return (
            <span
              key={seg.id}
              className="absolute max-w-[70px] -translate-x-1/2 -translate-y-1/2 text-center text-[10px] font-semibold leading-tight text-gray-800"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
              }}
            >
              {seg.label}
            </span>
          );
        })}

        <div className="absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-300 bg-yellow-400 shadow-inner" />
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-full border-[10px] border-transparent">
        {Array.from({ length: slotCount }).map((_, i) => {
          const angle = (i * 360) / slotCount - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 48 * Math.cos(rad);
          const y = 50 + 48 * Math.sin(rad);
          return (
            <span
              key={i}
              className="absolute h-2 w-2 rounded-full bg-yellow-300"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            />
          );
        })}
      </div>
    </div>
  );
}
