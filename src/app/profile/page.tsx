//app/profile
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import ProfileClient from "./profile-client";

export default function ProfilePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetchWithAuth(`${API_URL}/me`);

        if (!res.ok) {
          router.push("/auth/login")
          return
        }

        const data = await res.json()
        setUser(data.user)
      } catch {
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  if (loading) return <div>Loading...</div>;

  if (!user) return null;

  return <ProfileClient user={user} />;
}