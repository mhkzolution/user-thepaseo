"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type Props = {
  message?: string;
  redirectTo?: string;
  redirectDelaySeconds?: number;
};

export default function AuthRequiredScreen({
  message = "ไม่สามารถยืนยันผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่",
  redirectTo = "/auth/login",
  redirectDelaySeconds = 3,
}: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(redirectDelaySeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const timeout = setTimeout(() => {
      router.push(redirectTo);
    }, redirectDelaySeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router, redirectTo, redirectDelaySeconds]);

  const progress =
    ((redirectDelaySeconds - countdown) / redirectDelaySeconds) * 100;

  return (
    <div className="min-h-screen bg-paseo-g flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-paseo-hover">
            <Image
              src="/icon/icon-point.png"
              alt="The Paseo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain opacity-80"
              unoptimized
              priority
            />
          </div>

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <svg
              className="h-7 w-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <h1 className="text-lg font-bold text-gray-800 mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

          <div className="mb-2">
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-paseo transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            กำลังนำทางไปหน้าเข้าสู่ระบบใน{" "}
            <span className="font-semibold text-paseo-dark">{countdown}</span> วินาที
          </p>

          <Button
            onClick={() => router.push(redirectTo)}
            className="w-full rounded-full bg-paseo hover:bg-paseo-dark text-white font-semibold py-5"
          >
            เข้าสู่ระบบเลย
          </Button>
        </div>
      </div>
    </div>
  );
}
