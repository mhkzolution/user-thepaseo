import { NextResponse } from "next/server";
import { PrismaClient, OtpPurpose } from "@prisma/client";
import twilio from "twilio";

const prisma = new PrismaClient();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

function generateOtp(length: number = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const thaiPhoneRegex = /^0[689]\d{8}$/;

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์" }, { status: 400 });
    }
    if (!thaiPhoneRegex.test(phone)) {
      return NextResponse.json({ error: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" }, { status: 400 });
    }

    const purpose = OtpPurpose.REGISTER;

    // ลบ OTP ที่หมดอายุแล้ว
    await prisma.otpVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // ตรวจสอบการขอ OTP ล่าสุดใน 2 นาที
    const recent = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });
    if (recent) {
      return NextResponse.json(
        { error: "กรุณารออย่างน้อย 2 นาทีก่อนขอ OTP ใหม่" },
        { status: 429 }
      );
    }

    // นับจำนวนการขอ OTP ภายใน 1 ชั่วโมง
    const requestCount = await prisma.otpVerification.count({
      where: {
        phone,
        purpose,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (requestCount >= 3) {
      return NextResponse.json(
        { error: "ขอ OTP เกินจำนวนครั้งที่กำหนด กรุณาลองใหม่ภายหลัง" },
        { status: 429 }
      );
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ลบ OTP เก่าก่อน
    await prisma.otpVerification.deleteMany({
      where: { phone, purpose },
    });

    await prisma.otpVerification.create({
      data: {
        phone,
        otpCode,
        purpose,
        expiresAt,
        requestCount: requestCount + 1,
      },
    });

    const formattedPhone = phone.startsWith("+") ? phone : `+66${phone.substring(1)}`;

    await client.messages.create({
      body: `รหัส OTP ของคุณคือ ${otpCode} (หมดอายุใน 5 นาที)`,
      from: twilioPhone,
      to: formattedPhone,
    });

    console.log(`✅ OTP ถูกส่งไปยัง ${formattedPhone}: ${otpCode}`);

    return NextResponse.json({ success: true, message: "ส่ง OTP สำเร็จ" });
  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    return NextResponse.json({ error: "ไม่สามารถส่งรหัส OTP ได้" }, { status: 500 });
  }
}
