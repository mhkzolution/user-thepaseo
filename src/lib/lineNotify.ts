import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LINE_API = "https://api.line.me/v2/bot/message/push";
const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN!;

/**
 * ส่ง Flex Card แจ้งเตือนพอยท์
 * @param userId user ID
 * @param data ข้อมูลพอยท์ (type, amount, source, balance)
 */
export async function sendLinePointCard(
  userId: string,
  data: {
    type: "ADD" | "USE";
    amount: number;
    source: string;
    balance: number;
  }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineId: true, name: true },
    });

    if (!user?.lineId) {
      console.warn(`⚠️ User ${userId} ไม่มี lineId`);
      return;
    }

    const isAdd = data.type === "ADD";

    const heroImage = isAdd
      ? "https://thepaseo.co.th/wp-content/uploads/2023/02/logo-paseo-removebg-preview.png" // พอยท์เข้า
      : "https://thepaseo.co.th/wp-content/uploads/2023/02/logo-paseo-removebg-preview.png"; // พอยท์ออก

    const title = isAdd ? "🎉 คุณได้รับพอยท์!" : "🔥 ใช้พอยท์สำเร็จ";
    const amountText = `${isAdd ? "+" : "-"}${data.amount.toLocaleString()} พอยท์`;
    const detailText = isAdd
      ? `${amountText} จาก ${data.source}`
      : `ใช้ ${amountText} เพื่อ ${data.source}`;

    const flexMessage = {
      type: "flex",
      altText: "แจ้งเตือนพอยท์ของคุณ",
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: heroImage,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: title,
              weight: "bold",
              size: "lg",
              color: isAdd ? "#9DC93C" : "#cc0000",
            },
            {
              type: "text",
              text: detailText,
              wrap: true,
              margin: "md",
              color: "#333333",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "text",
              text: `พอยท์คงเหลือ: ${data.balance.toLocaleString()} พอยท์`,
              weight: "bold",
              margin: "md",
              color: "#9DC93C",
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
              color: "#9DC93C",
              action: {
                type: "uri",
                label: "ดูประวัติพอยท์",
                uri: "https://offline-supervisor-dive-poker.trycloudflare.com/point-history",
              },
            },
          ],
        },
      },
    };

    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: user.lineId,
        messages: [flexMessage],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ LINE send error:", errText);
    } else {
      console.log(`✅ ส่ง card แจ้งเตือนพอยท์ถึง ${user.name || userId} สำเร็จ`);
    }
  } catch (error) {
    console.error("❌ sendLinePointCard error:", error);
  }
}

export async function sendLineNotification(userId: string, message: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineId: true, name: true },
    });

    if (!user?.lineId) {
      console.warn(`⚠️ User ${userId} ไม่มี lineId`);
      return;
    }

    const LINE_API = "https://api.line.me/v2/bot/message/push";
    const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;

    if (!CHANNEL_ACCESS_TOKEN) {
      console.error("❌ LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is missing in .env");
      return;
    }

    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: user.lineId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ LINE send error:", errorText);
    } else {
      console.log(`✅ ส่งข้อความถึง ${user.name || userId} เรียบร้อย`);
    }
  } catch (error) {
    console.error("❌ sendLineNotification error:", error);
  }
}