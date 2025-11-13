import { NextResponse } from "next/server";
import { PrismaClient, OtpPurpose } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "กรุณากรอกเบอร์โทรศัพท์และรหัส OTP" },
        { status: 400 }
      );
    }

    // ลบ OTP ที่หมดอายุแล้ว
    await prisma.otpVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose: OtpPurpose.REGISTER,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "ไม่พบข้อมูล OTP สำหรับเบอร์นี้" }, { status: 404 });
    }

    if (otpRecord.verifiedAt) {
      return NextResponse.json({ error: "รหัส OTP นี้ถูกใช้ไปแล้ว" }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว" }, { status: 400 });
    }

    if (otpRecord.otpCode !== otp) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "ยืนยัน OTP สำเร็จ" });
  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP" },
      { status: 500 }
    );
  }
}
