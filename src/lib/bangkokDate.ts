/**
 * แปลง datetime จาก API/DB (มักเป็นเวลาท้องถิ่นไทย แต่ serialize เป็น ISO + Z)
 * ให้ได้ instant ที่ format ด้วย timeZone Asia/Bangkok แล้วตรงกับตัวเลขในสตริง
 */
export function dateFromBangkokWallClock(input: string): Date {
  const s = String(input).trim();
  const hasExplicitOffset = /[+-]\d{2}:?\d{2}$/.test(s);
  if (hasExplicitOffset) return new Date(s);

  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?$/i
  );
  if (!m) return new Date(s);

  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const h = +m[4];
  const min = +m[5];
  const sec = m[6] ? +m[6] : 0;
  return new Date(Date.UTC(y, mo - 1, d, h - 7, min, sec));
}
