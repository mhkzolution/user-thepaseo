"use client";

import { useEffect } from "react";

export default function LineCallback() {
  useEffect(() => {
    const current = new URL(window.location.href);
    const token = current.searchParams.get("token");
    const code = current.searchParams.get("code");
    const state = current.searchParams.get("state");

    const deepLink = new URL("user.thepaseo://login");

    if (token) deepLink.searchParams.set("token", token);
    if (code) deepLink.searchParams.set("code", code);
    if (state) deepLink.searchParams.set("state", state);

    const deepLinkUrl = deepLink.toString();

    if (token) {
      localStorage.setItem("token", token);
    }

    // เปิดกลับเข้า App
    window.location.href = deepLinkUrl;

    // fallback ถ้าไม่มี app
    window.setTimeout(() => {
      window.location.replace("/");
    }, 1500);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      {/* โลโก้ / วงโหลด */}
      <div className="relative">
        <div className="w-20 h-20 border-[5px] border-gray-200 border-t-[#9DC93C] rounded-full animate-spin"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-[#9DC93C] animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
      </div>

      {/* ข้อความ */}
      <div className="mt-8 text-center">
        <h1 className="text-xl font-bold text-gray-800">
          กำลังเข้าสู่ระบบ
        </h1>

        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          กรุณารอสักครู่
          <br />
          ระบบกำลังพาคุณกลับเข้าแอป
        </p>
      </div>

      {/* จุด loading */}
      <div className="flex items-center gap-2 mt-6">
        <span className="w-2 h-2 rounded-full bg-[#9DC93C] animate-bounce"></span>
        <span
          className="w-2 h-2 rounded-full bg-[#9DC93C] animate-bounce"
          style={{ animationDelay: "0.15s" }}
        ></span>
        <span
          className="w-2 h-2 rounded-full bg-[#9DC93C] animate-bounce"
          style={{ animationDelay: "0.3s" }}
        ></span>
      </div>
    </div>
  );
}