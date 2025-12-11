// app/auth/liff-entry/page.tsx
"use client";

import { useEffect } from "react";
import liff from "@line/liff";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LiffEntry() {
  const router = useRouter();

  useEffect(() => {
    const autoLogin = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID! });

        // ถ้ายังไม่ได้ล็อกอินใน LINE → บังคับ login
        if (!liff.isLoggedIn()) {
          liff.login(); // ไม่ต้องใส่ redirectUri เพราะเราอยู่ใน LIFF อยู่แล้ว
          return;
        }

        // ถ้าล็อกอินแล้ว → ดึง ID Token แล้ว signIn ทันที
        const idToken = liff.getIDToken();

        if (!idToken) {
          router.push("/auth/login");
          return;
        }

        const result = await signIn("line-liff", {
          idToken,
          redirect: false,
        });

        if (result?.ok) {
          router.replace("/"); // หรือ /home, /point อะไรก็ได้ที่ต้องการ
        } else {
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("LIFF Auto Login Failed", err);
        router.push("/auth/login");
      }
    };

    autoLogin();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-paseo-dark border-t-transparent"></div>
      <p className="text-lg">กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}