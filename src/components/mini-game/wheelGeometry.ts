/** มุมช่องวงล้อ — นับตามเข็มจาก 12 นาฬิกา (องศา) ใช้ร่วมกันทั้งช่องสีและป้ายรางวัล */
export function wheelSliceDeg(slotCount: number): number {
  return 360 / slotCount;
}

export function wheelSlotStartDeg(index: number, slotCount: number): number {
  return index * wheelSliceDeg(slotCount);
}

export function wheelSlotEndDeg(index: number, slotCount: number): number {
  return (index + 1) * wheelSliceDeg(slotCount);
}

export function wheelSlotBisectorDeg(index: number, slotCount: number): number {
  return wheelSlotStartDeg(index, slotCount) + wheelSliceDeg(slotCount) / 2;
}
