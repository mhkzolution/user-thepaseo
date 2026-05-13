"use client";

import HeaderMobile from '@/components/HeaderMobile/page';
import UserProfile from "@/components/UserProfile/page";
import MenuProfile from "@/components/MenuProfile/page";
import { usePathname } from "next/navigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEditPage = pathname === "/profile/edit";

  if (isEditPage) {
    return (
      <div className="max-w-2xl mx-auto p-0 mb-20 md:mt-10 md:mb-4 mb-4 rounded-xl">
        <HeaderMobile />
        <div className="w-full bg-white p-4 pt-4 md:p-6 rounded-t-2xl rounded-3xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-0 mb-20 md:mt-10 md:mb-4 mb-4 rounded-xl">

      <HeaderMobile />

      <div className="p-0 md:mt-16 mt-9 rounded-xl">
        <div className="w-full py-4 px-4 md:py-10 md:px-20">
          <UserProfile showOn="both" />
        </div>
      </div>

      <div className="w-full bg-white p-4 pt-6 md:p-10 md:pt-10 rounded-3xl">
        <MenuProfile />

        {/* 👇 ตรงนี้คือหน้าลูก */}
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
