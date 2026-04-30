// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import UserProfile from '@/components/UserProfile/page';
import Loading from '@/components/loading';
import PrivilegeList from '@/components/PrivilegeList/page';
import HeaderMobile from "@/components/HeaderMobile/page";


export default function ProfilePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetchWithAuth(`${API_URL}/profile`);
      if (res.ok) {
        const data = await res.json();
        if (data?.user && typeof data.user === "object") {
          setUser(data.user);
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
        }
      }
    };
    fetchProfile();
  }, []);

  if (!user) {
    return (<Loading />);
  }

  return (
    <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-0 mt-0 md:mb-0 mb-4 rounded-xl">
      <HeaderMobile />

      <div className="md:hidden p-0 pt-8 md:mt-20 -mb-18 rounded-xl">
        <div className="w-full pt-4 pb-0 px-4 md:pt-0 md:px-20 md:pb-0">
          <UserProfile showOn="both" />
        </div>
      </div>

      <div className="w-full bg-white  p-4 pt-20 md:p-10 md:mt-20 mt-6 md:pt-10 rounded-t-3xl">
        <h1 className="text-xl font-semibold mb-4">สิทธิพิเศษ</h1>
          <PrivilegeList />
      </div>
      
    </div>
  );
}
