// lib/lineMessage.ts
export async function sendLineMessage(userLineId: string, message: string) {
  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN) {
    console.error("❌ LINE Channel Access Token not set");
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userLineId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Error sending LINE message:", err);
  }
}
