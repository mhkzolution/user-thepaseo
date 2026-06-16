import { wheelSlotBisectorDeg } from "./wheelGeometry";

export type WheelSegmentLayout = {
  /** สัดส่วนรัศมีจากจุดกลาง (0–1) */
  radiusRatio: number;
  /** เลื่อนเพิ่มเข้าหาขอบวงล้อ (px) */
  offsetRadial: number;
  /** เลื่อนซ้าย/ขวาตามแนวขอบช่อง (px) */
  offsetTangent: number;
  /** ปรับมุมหยุดเพิ่ม (องศา) ให้ตรงกับช่องสีใต้ pointer */
  spinOffsetDeg: number;
  iconSize: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  contentWidth: number;
  gap: number;
  maxLabelChars: number;
};

/**
 * ตั้งค่าตำแหน่ง/ฟอนต์/ไอคอนรางวัลบนวงล้อ — ปรับทีละจำนวนช่องได้ที่นี่
 * offsetRadial: บวก = ใกล้ขอบมากขึ้น | offsetTangent: บวก = เลื่อนไปทางเข็มนาฬิกา
 */
const WHEEL_SEGMENT_LAYOUTS: Record<number, WheelSegmentLayout> = {
  4: {
    radiusRatio: 0.60,
    offsetRadial: 2,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 32,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.1,
    contentWidth: 58,
    gap: 4,
    maxLabelChars: 14,
  },
  5: {
    radiusRatio: 0.6,
    offsetRadial: 3,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 30,
    fontSize: 11.5,
    fontWeight: 700,
    lineHeight: 1.1,
    contentWidth: 54,
    gap: 3,
    maxLabelChars: 13,
  },
  6: {
    radiusRatio: 0.60,
    offsetRadial: 2,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 30,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.1,
    contentWidth: 52,
    gap: 3,
    maxLabelChars: 12,
  },
  7: {
    radiusRatio: 0.70,
    offsetRadial: 2,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 28,
    fontSize: 10.5,
    fontWeight: 700,
    lineHeight: 1.08,
    contentWidth: 50,
    gap: 2,
    maxLabelChars: 11,
  },
  8: {
    radiusRatio: 0.70,
    offsetRadial: 1,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 28,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.08,
    contentWidth: 48,
    gap: 2,
    maxLabelChars: 10,
  },
  9: {
    radiusRatio: 0.70,
    offsetRadial: 1,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 26,
    fontSize: 9.5,
    fontWeight: 700,
    lineHeight: 1.06,
    contentWidth: 44,
    gap: 2,
    maxLabelChars: 10,
  },
  10: {
    radiusRatio: 0.75,
    offsetRadial: 0,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 24,
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.05,
    contentWidth: 42,
    gap: 2,
    maxLabelChars: 9,
  },
  11: {
    radiusRatio: 0.74,
    offsetRadial: 0,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 22,
    fontSize: 8.5,
    fontWeight: 700,
    lineHeight: 1.05,
    contentWidth: 40,
    gap: 1,
    maxLabelChars: 9,
  },
  12: {
    radiusRatio: 0.73,
    offsetRadial: 0,
    offsetTangent: 0,
    spinOffsetDeg: 0,
    iconSize: 20,
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1.04,
    contentWidth: 38,
    gap: 1,
    maxLabelChars: 8,
  },
};

const FALLBACK_LAYOUT = WHEEL_SEGMENT_LAYOUTS[8];

export function getWheelSegmentLayout(slotCount: number): WheelSegmentLayout {
  return WHEEL_SEGMENT_LAYOUTS[slotCount] ?? FALLBACK_LAYOUT;
}

/** มุมหมุนสุดท้ายให้กึ่งกลางช่องสีอยู่ใต้ pointer */
export function computeSpinTargetAngle(
  targetIndex: number,
  slotCount: number,
  layout: WheelSegmentLayout
): number {
  const bisector = wheelSlotBisectorDeg(targetIndex, slotCount);
  return (360 - bisector + layout.spinOffsetDeg + 360) % 360;
}

export function segmentLabelTransform(
  bisector: number,
  baseRadius: number,
  layout: WheelSegmentLayout
): string {
  const radial = baseRadius + layout.offsetRadial;
  return `translate(-50%, -50%) rotate(${bisector}deg) translateY(-${radial}px) translateX(${layout.offsetTangent}px) rotate(${-bisector}deg)`;
}

export function truncateSegmentLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return `${label.slice(0, maxChars)}…`;
}

/** แปลง prize.id / arrayIndex / sortOrder → index บนวงล้อ */
export function resolveWheelSlotIndex<T extends { id: string; sortOrder: number }>(
  sortedSegments: T[],
  ref: { id?: string; arrayIndex?: number; sortOrder?: number }
): number {
  if (ref.id) {
    const byId = sortedSegments.findIndex((s) => s.id === ref.id);
    if (byId >= 0) return byId;
  }
  if (
    ref.arrayIndex != null &&
    Number.isInteger(ref.arrayIndex) &&
    ref.arrayIndex >= 0 &&
    ref.arrayIndex < sortedSegments.length
  ) {
    return ref.arrayIndex;
  }
  if (ref.sortOrder != null) {
    const bySort = sortedSegments.findIndex((s) => s.sortOrder === ref.sortOrder);
    if (bySort >= 0) return bySort;
  }
  return 0;
}
