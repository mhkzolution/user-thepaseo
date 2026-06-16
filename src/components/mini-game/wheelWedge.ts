/** สร้าง path ช่องสีบนวงล้อ — มุมนับจาก 12 นาฬิกาตามเข็ม (องศา) */
export function describeWheelWedge(
  cx: number,
  cy: number,
  radius: number,
  startDegFromTop: number,
  endDegFromTop: number
): string {
  const toRad = (degFromTop: number) => ((degFromTop - 90) * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(toRad(startDegFromTop));
  const y1 = cy + radius * Math.sin(toRad(startDegFromTop));
  const x2 = cx + radius * Math.cos(toRad(endDegFromTop));
  const y2 = cy + radius * Math.sin(toRad(endDegFromTop));
  const sweep = endDegFromTop - startDegFromTop;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
