// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";

import LogoutButton from '@/components/logoutbutton/page'
import UserProfile from '@/components/UserProfile/page';
import ProfileSetting from '@/components/ProfileSetting/page';
import MenuProfile from '@/components/MenuProfile/page';
import ConnectLineButton from "@/components/ConnectLineButton/page"

import Loading from '@/components/loading';
import Link from 'next/link';
import HeaderMobile from '@/components/HeaderMobile/page';

import { IoIosSettings } from "react-icons/io";
import { MdHelpCenter } from "react-icons/md";
import { SiPlatformdotsh } from "react-icons/si";

export default function ProfilePage() {
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
    <div className="max-w-2xl mx-auto p-0 px-4 mb-20 md:mt-20 md:mb-20 mb-4 rounded-2xl">
        <HeaderMobile />
        
        <div className="max-w-2xl mx-auto p-0 -mb-14 md:mt-20 md:-mb-16 rounded-xl">
          <div className="w-full pt-4 px-4 md:pt-0 md:px-20 md:pb-0">
            <UserProfile />
          </div>
        </div>

        <div className="w-full bg-white p-4 pt-16 md:p-10 md:pt-20 rounded-t-3xl rounded-xl">

          <MenuProfile />

          <ProfileSetting />

        </div>

        <div className="w-full flex flex-col gap-4 bg-white mt-4 p-4 md:p-10 rounded-xl">
          <div className="profile-setting-header-1 flex flex-row items-center gap-2">
            <SiPlatformdotsh className="text-paseo" size={24}/>
            <span className="text-base font-bold">ผูกบัญชีกับแพลตฟอร์ม</span>
          </div>

          <div className="w-full flex flex-row gap-4">
            <span className="text-sm whitespace-nowrap">ผูดมัดกับแพลตฟอร์ม</span>
            <ConnectLineButton />
          </div>
          
          
        </div>

        <div className="w-full flex flex-col gap-4 bg-white mt-4 p-4 md:p-10 rounded-xl">
          <Link className="flex flex-row jutify-start items-center gap-2" href="#">
              <IoIosSettings className="text-paseo" size={24} />
              <span className="text-sm whitespace-nowrap">ตั่งค่า</span>
          </Link>
          <Link className="flex flex-row jutify-start items-center gap-2" href="/help">
              <MdHelpCenter className="text-paseo" size={24}  />
              <span className="text-sm whitespace-nowrap">Help Center</span>
          </Link>
        </div>

        <div className="w-full bg-white mt-4 p-4 md:p-10 rounded-xl">
          <LogoutButton />
        </div>

      
    </div>
  );
}