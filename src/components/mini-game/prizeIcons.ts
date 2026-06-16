export type PrizeType = "POINTS" | "COUPON" | "REWARD" | string;

export function getPrizeIconPath(prizeType: PrizeType): string {
  switch (prizeType) {
    case "POINTS":
      return "/icon/icon-point.png";
    case "COUPON":
      return "/icon/icon-profile-coupon.png";
    case "REWARD":
      return "/icon/icon-reward.png";
    default:
      return "/icon/icon-reward.png";
  }
}

export function getPrizeQuantityLabel(
  quantity?: number | null,
  remainingQty?: number | null
): string {
  const qty = remainingQty ?? quantity;
  if (qty == null) return "ไม่จำกัด";
  return `จำนวน ${qty.toLocaleString("th-TH")} สิทธิ์`;
}

export function getPrizeResultDisplay(
  prizeType: PrizeType,
  label: string,
  pointAmount?: number | null
): { headline: string; value: string; subtitle: string } {
  if (prizeType === "POINTS" && pointAmount) {
    return {
      headline: "คุณได้รับ",
      value: pointAmount.toLocaleString("th-TH"),
      subtitle: "Paseopoint",
    };
  }

  return {
    headline: "คุณได้รับ",
    value: label,
    subtitle: prizeType === "COUPON" ? "คูปอง" : "ของรางวัล",
  };
}

export function getWheelSegmentColors(index: number): string {
  return index % 2 === 0 ? "#ecf5d2" : "#9DC93C";
}

export function resolveSegmentColor(color: string | null | undefined, index: number): string {
  const trimmed = color?.trim();
  return trimmed || getWheelSegmentColors(index);
}

export function getContrastTextColor(background: string): string {
  const hex = background.replace("#", "");
  if (hex.length !== 6) return "#2d3a14";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#2d3a14" : "#ffffff";
}

/** มุมกลางช่อง นับตามเข็มจาก 12 นาฬิกา (องศา) */
export function segmentBisectorDeg(index: number, slice: number): number {
  return index * slice + slice / 2;
}
