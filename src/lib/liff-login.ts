// lib/liff-login
"use client";

import liff from "@line/liff";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { signIn } from "next-auth/react";
import { initLiff } from "./liff-client";

export async function loginWithLineHybrid() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  // 1) ตรวจ User-Agent ก่อนเลย  
  const ua = navigator.userAgent.toLowerCase();
  const isLineUA = ua.includes("line");
  const isiOS = /iphone|ipad|ipod/.test(ua);

  console.log("UA:", ua);
  console.log("Is LINE UA:", isLineUA);
  console.log("Is iOS:", isiOS);

  // ------------------------------
  // กรณีไม่ได้เปิดผ่าน LINE → ใช้ OAuth ปกติ
  // ------------------------------
  if (!isLineUA) {
    console.log("🔥 Not LINE App → Using OAuth Login");
    return signIn("line", { callbackUrl: "/" });
  }

  // ------------------------------
  // 2) พยายาม init LIFF
  // ------------------------------
  try {
    await initLiff();
    await liff.ready;
  } catch (err) {
    console.log("❌ LIFF init error:", err);
  }

  let isInClient = false;

  try {
    isInClient = liff.isInClient();
  } catch (err) {
    console.log("❌ liff.isInClient() failed", err);
  }

  console.log("LIFF In Client:", isInClient);

  // ------------------------------
  // 3) ถ้าเปิดจาก LINE แต่ LIFF บอกว่าไม่ใช่ client → บังคับ login ผ่าน LIFF
  //    (แก้เคส iOS safari ที่ทำ LIFF พัง)
  // ------------------------------
  if (isLineUA && !isInClient) {
    console.log("⚠️ LINE UA แต่ LIFF ไม่ใช่ client → Force LIFF Login");
    try {
      liff.login();
      return;
    } catch {
      console.log("❌ Force LIFF Login Error → fallback OAuth");
      return signIn("line", { callbackUrl: "/" });
    }
  }

  // ------------------------------
  // 4) ถ้าเข้ามาใน LINE App ปกติ → ใช้ LIFF Login
  // ------------------------------
  if (!liff.isLoggedIn()) {
    console.log("🔑 Logging in via LIFF...");
    liff.login();
    return;
  }

  // ------------------------------
  // 5) ดึง ID Token
  // ------------------------------
const idToken = liff.getIDToken();

if (!idToken) {
  liff.login();
  return;
}

  const res = await fetchWithAuth(`${API_URL}/auth/line`, {
    method: "POST",
    body: JSON.stringify({ idToken }),
  })

  const data = await res.json()

  if (!res.ok) {
    alert("LINE login failed")
    return
  }

  localStorage.setItem("token", data.token)

  window.location.href = "/"
}
