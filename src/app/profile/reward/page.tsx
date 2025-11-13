// app/profile/coupon/page.tsx
"use client";

import { useEffect, useState } from "react";
import RewardCard from "@/components/RewardCard/page";
import UserProfile from '@/components/UserProfile/page';
import Loading from '@/components/loading';
import HeaderMobile from '@/components/HeaderMobile/page';
import MenuProfile from '@/components/MenuProfile/page';


export default function CouponPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };
    fetchProfile();
  }, []);

  if (!user) {
    return (
        <Loading />
      );
  }

return (
      <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-20 md:mb-20 mb-4 rounded-xl">
          <HeaderMobile />
          
          <div className="max-w-2xl mx-auto p-0 -mb-14 md:mt-20 md:-mb-16 rounded-xl rounded-t-5xl">
            <div className="w-full pt-4 px-4 md:pt-0 md:px-20 md:pb-0">
              <UserProfile />
            </div>
          </div>
  
          <div className="w-full bg-white p-4 pt-16 md:p-10 md:pt-20 rounded-t-5xl rounded-xl">
  
            <MenuProfile />
  
            <div className="flex flex-col gap-4 pt-4">
              <h1 className="text-xl font-semibold flex-1 text-center">ของราลวัล</h1>

              <div className="space-y-4 w-full">
                <RewardCard />
              </div>

            </div>
                  
          </div>
  
      </div>
    );
  }


