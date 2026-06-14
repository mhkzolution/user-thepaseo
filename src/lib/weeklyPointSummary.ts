// lib/weeklyPointSummary.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const LINE_API = "https://api.line.me/v2/bot/message/push";
const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;

if (!CHANNEL_ACCESS_TOKEN) {
  console.error("❌ Missing LINE_MESSAGING_CHANNEL_ACCESS_TOKEN");
}

/**
 * คำนวณช่วงเวลา "สัปดาห์ที่ผ่านมา" (previous Monday 00:00 BKK -> previous Sunday 23:59:59.999 BKK)
 * คืนค่า { startUtc, endUtc, label } โดย times เป็น Date objects ใน UTC พร้อมใช้ กับ DB ที่เก็บเวลาเป็น UTC
 */
export function getPreviousWeekRangeBKK(now = new Date()) {
  // เราจะคำนวณโดย shift เวลาเป็น timezone Asia/Bangkok (UTC+7) แล้วหาช่วง
  const SHIFT_MS = 7 * 60 * 60 * 1000;
  const nowUtc = new Date(now.getTime());
  const nowBkk = new Date(nowUtc.getTime() + SHIFT_MS);

  // getUTCDay ของ nowBkk (0=Sun ... 1=Mon)
  const day = nowBkk.getUTCDay(); // 0..6
  // days since Monday in BKK
  const daysSinceMonday = (day + 6) % 7; // Monday -> 0, Sunday -> 6

  // Previous week's Monday (BKK) at 00:00
  const prevMondayBkk = new Date(nowBkk.getTime());
  prevMondayBkk.setUTCDate(nowBkk.getUTCDate() - daysSinceMonday - 7);
  prevMondayBkk.setUTCHours(0, 0, 0, 0);

  // Previous week's Sunday (BKK) at 23:59:59.999
  const prevSundayBkk = new Date(prevMondayBkk.getTime());
  prevSundayBkk.setUTCDate(prevMondayBkk.getUTCDate() + 6);
  prevSundayBkk.setUTCHours(23, 59, 59, 999);

  // convert back to UTC for DB queries
  const startUtc = new Date(prevMondayBkk.getTime() - SHIFT_MS);
  const endUtc = new Date(prevSundayBkk.getTime() - SHIFT_MS);

  // friendly label (วันที่ในรูปแบบ yyyy-mm-dd - yyyy-mm-dd) ใน timezone BKK
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = `${prevMondayBkk.getUTCFullYear()}-${pad(prevMondayBkk.getUTCMonth() + 1)}-${pad(
    prevMondayBkk.getUTCDate()
  )} - ${prevSundayBkk.getUTCFullYear()}-${pad(prevSundayBkk.getUTCMonth() + 1)}-${pad(
    prevSundayBkk.getUTCDate()
  )}`;

  return { startUtc, endUtc, label, prevMondayBkk, prevSundayBkk };
}

/**
 * สร้าง Flex message summary สำหรับ user
 */
function buildWeeklyFlex({
  userName,
  received,
  used,
  balance,
  periodLabel,
  updatedAtBkkIso,
  heroImage,
  profileUri,
}: {
  userName: string;
  received: number;
  used: number;
  balance: number;
  periodLabel: string;
  updatedAtBkkIso: string;
  heroImage?: string;
  profileUri?: string;
}) {
  const hero = heroImage || "https://cdn-icons-png.flaticon.com/512/992/992700.png";

  return {
    type: "flex",
    altText: `สรุปพอยท์รายสัปดาห์ (${periodLabel})`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: hero,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `สรุปพอยท์รายสัปดาห์`, weight: "bold", size: "lg" },
          { type: "text", text: `สำหรับ: ${userName}`, margin: "sm" },
          { type: "text", text: `ช่วง: ${periodLabel}`, margin: "sm", size: "sm", color: "#666" },
          { type: "separator", margin: "md" },

          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "รับรวม:", flex: 2, size: "sm", color: "#333" },
                  {
                    type: "text",
                    text: `+${received.toLocaleString()} พอยท์`,
                    flex: 3,
                    align: "end",
                    weight: "bold",
                    size: "sm",
                    color: "#00b300",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "ใช้รวม:", flex: 2, size: "sm", color: "#333" },
                  {
                    type: "text",
                    text: `-${used.toLocaleString()} พอยท์`,
                    flex: 3,
                    align: "end",
                    weight: "bold",
                    size: "sm",
                    color: "#cc0000",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "คงเหลือ:", flex: 2, size: "sm", color: "#333" },
                  {
                    type: "text",
                    text: `${balance.toLocaleString()} พอยท์`,
                    flex: 3,
                    align: "end",
                    weight: "bold",
                    size: "sm",
                    color: "#0066CC",
                  },
                ],
              },
            ],
          },

          { type: "separator", margin: "md" },
          {
            type: "text",
            text: `อัปเดตเมื่อ: ${updatedAtBkkIso}`,
            size: "xs",
            color: "#888",
            margin: "md",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "ดูประวัติพอยท์",
              uri: profileUri || process.env.NEXT_PUBLIC_APP_URL || "https://your-app/profile/point",
            },
          },
        ],
      },
    },
  };
}

/**
 * ส่ง Flex summary ไปยัง user (โดยใช้ LINE Push)
 */
export async function sendLineWeeklySummaryToUser({
  user,
  received,
  used,
  balance,
  periodLabel,
}: {
  user: { id: string; name: string; lineId?: string | null };
  received: number;
  used: number;
  balance: number;
  periodLabel: string;
}) {
  if (!user.lineId) {
    console.warn(`User ${user.id} ไม่มี lineId - ข้ามการส่ง`);
    return { ok: false, reason: "no_lineId" };
  }

  const now = new Date();
  const updatedAtBkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const isoBkk = updatedAtBkk.toISOString().replace("T", " ").split(".")[0] + " (GMT+7)";

  const flex = buildWeeklyFlex({
    userName: user.name || "สมาชิก",
    received,
    used,
    balance,
    periodLabel,
    updatedAtBkkIso: isoBkk,
    heroImage: undefined,
    profileUri: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app"}/profile/point`,
  });

  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: user.lineId, messages: [flex] }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("LINE send error:", text);
    return { ok: false, reason: text };
  }

  return { ok: true };
}

/**
 * ฟังก์ชันหลัก: คำนวณสรุปของทุก user แล้วส่งให้ทีละคน
 * - limitPerBatch, delayMs: สำหรับ batching (to avoid rate limit)
 */
export async function sendWeeklySummaryToAllUsers({
  limitPerBatch = 50,
  delayMs = 1000,
} = {}) {
  const { startUtc, endUtc, label } = getPreviousWeekRangeBKK();
  console.log(`StartUTC: ${startUtc.toISOString()}, EndUTC: ${endUtc.toISOString()}, label: ${label}`);

  // ดึง user list ที่มี lineId (หรือจะส่งให้ทุก user ที่มี lineId)
  const users = await prisma.user.findMany({
    where: { lineId: { not: null } },
    select: { id: true, name: true, lineId: true, point: true }, // คุณใช้ field 'point' เป็นพอยท์คงเหลือ
  });

  // สำหรับประสิทธิภาพ ถ้ามี many users -> ทำแบบ batching
  for (let i = 0; i < users.length; i += limitPerBatch) {
    const batch = users.slice(i, i + limitPerBatch);

    // สำหรับแต่ละ user ใน batch: คำนวณ sum received และ sum used จาก pointTransaction
    const promises = batch.map(async (u) => {
      // sum of positive amounts (รับ)
      const sumReceived = await prisma.pointTransaction.aggregate({
        where: {
          userId: u.id,
          createdAt: { gte: startUtc, lte: endUtc },
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      });

      // sum of negative amounts (ใช้) -> stored as negative. เราเอา absolute
      const sumUsedAgg = await prisma.pointTransaction.aggregate({
        where: {
          userId: u.id,
          createdAt: { gte: startUtc, lte: endUtc },
          amount: { lt: 0 },
        },
        _sum: { amount: true },
      });

      const received = sumReceived._sum.amount ?? 0;
      const used = Math.abs(sumUsedAgg._sum.amount ?? 0);
      const balance = u.point ?? 0;

      const sendResult = await sendLineWeeklySummaryToUser({
        user: u,
        received,
        used,
        balance,
        periodLabel: label,
      });

      return { userId: u.id, sendResult };
    });

    // รอให้เสร็จ batch นึง แล้วหน่วงก่อน batch ถัดไป
    const results = await Promise.all(promises);
    console.log("Batch results:", results);

    if (i + limitPerBatch < users.length) {
      // delay
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return { success: true, message: `Sent weekly summary to ${users.length} users`, period: label };
}
