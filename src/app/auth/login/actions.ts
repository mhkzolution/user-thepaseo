// /app/auth/login/actions.ts
"use server";


import { redirect } from "next/navigation";

export async function loginWithLineOAuth() {
  const clientId = process.env.LINE_CLIENT_ID!;
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/callback/line`);

  const url =
    `https://access.line.me/oauth2/v2.1/authorize` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&state=login` +
    `&scope=openid%20profile%20email`;

  return redirect(url);
}