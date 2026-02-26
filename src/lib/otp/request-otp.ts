import { PrismaClient, OtpPurpose } from "@prisma/client"

const prisma = new PrismaClient()
const OTP_EXPIRE_MINUTES = 5

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.OTP_SMS_ENABLED === "false"

export async function requestOtp({
  phone,
  purpose,
}: {
  phone: string
  purpose: OtpPurpose
}) {
  // ✅ DEV MODE → ไม่ส่ง SMS จริง
  if (isDev) {
    const testCode = process.env.OTP_TEST_CODE || "123456"

    await prisma.otpVerification.create({
      data: {
        phone,
        purpose,
        provider: "DEV",
        token: testCode, // ใช้แทน token
        expiresAt: new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000),
      },
    })

    console.log("🧪 DEV OTP:", testCode)

    return {
      success: true,
      ref: "DEV",
    }
  }

  // ---------- PROD MODE ----------
  const res = await fetch("https://apicall.deesmsx.com/v1/otp/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.DEESMSX_API_KEY,
      secretKey: process.env.DEESMSX_SECRET_KEY,
      to: phone.startsWith("0") ? "66" + phone.slice(1) : phone,
      sender: process.env.DEESMSX_SENDER || "deeSMS.OTP",
      lang: "th",
      isShowRef: "1",
    }),
  })

  const data = await res.json()

  const token = data?.result?.token
  if (!res.ok || !token) {
    throw new Error(data?.msg || "deeSMSX ไม่ได้คืน token")
  }

  await prisma.otpVerification.create({
    data: {
      phone,
      purpose,
      provider: "DEESMSX",
      token,
      expiresAt: new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000),
    },
  })

  return { success: true, ref: data?.result?.ref }
}
