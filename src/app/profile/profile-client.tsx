//app/profile/profile-client.tsx
"use client";

import ProfileSetting from "@/components/ProfileSetting/page";
import LogoutButton from "@/components/logoutbutton/page";
import Link from "next/link";
import { MdHelpCenter } from "react-icons/md";

export default function ProfileClient({ user }: { user: any }) {
  return (
    <>
      <ProfileSetting />

      <div className="w-full flex flex-col gap-4 bg-gray-50 mt-4 p-4 mb:p-2 rounded-xl border border-gray-200">
        <Link className="flex items-center gap-2" href="/help">
          <MdHelpCenter className="text-paseo" size={24} />
          <span className="text-xs">Help Center</span>
        </Link>
      </div>

      <div className="w-full bg-white my-4 p-4 md:p-10 rounded-xl">
        <LogoutButton />
      </div>
    </>
  );
}
