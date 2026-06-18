import { PrismaClient, OtpPurpose } from "@prisma/client"
import { isReviewerBypass } from "@/lib/otp/reviewer-bypass"

const prisma = new PrismaClient()

export async function verifyOtp({
  phone,
  otp,
  purpose,
}: {
  phone: string
  otp: string
  purpose: OtpPurpose
}) {

  // Google Play reviewer bypass (fixed OTP, no SMS)
  if (isReviewerBypass(phone, otp)) {
    return { success: true }
  }

  // ⭐ TEST MODE (ไม่ต้องเช็ค DB)
  if (
    process.env.OTP_SMS_ENABLED === "false" &&
    otp === process.env.OTP_TEST_CODE
  ) {
    return { success: true }
  }

  // 🔥 production เท่านั้นที่ query DB
  const record = await prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!record) {
    throw new Error("ไม่พบ OTP หรือ OTP หมดอายุ")
  }

  const res = await fetch("https://apicall.deesmsx.com/v1/otp/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      apiKey: process.env.DEESMSX_API_KEY,
      secretKey: process.env.DEESMSX_SECRET_KEY,
      token: record.token,
      pin: otp,
    }),
  })

  const data = await res.json()

  if (!res.ok || data?.code !== "0") {
    throw new Error(data?.msg || "OTP ไม่ถูกต้อง")
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  })

  return { success: true }
}