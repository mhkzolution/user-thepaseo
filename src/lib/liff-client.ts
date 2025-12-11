"use client";

import liff from "@line/liff";

let initialized = false;

export async function initLiff() {
  if (initialized) return;

  try {
    await liff.init({
      liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID!,
    });
    initialized = true;
    console.log("✔ LIFF Initialized");
  } catch (err) {
    console.log("❌ LIFF Init Failed:", err);
  }
}