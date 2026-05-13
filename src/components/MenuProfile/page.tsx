"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const MenuProfile = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "คูปอง",
      path: "/profile/coupon",
      
      icon: "/icon/icon-profile-coupon.png",
    },
    {
      label: "แลก",
      path: "/profile/reward",
      icon: "/icon/icon-profile-reward.png",
    },
    {
      label: "สะสมพอยท์",
      path: "/profile/upload",
      icon: "/icon/icon-profile-collect.png",
    },
    {
      label: "ประวัติพอยท์",
      path: "/profile/point",
      icon: "/icon/icon-profile-history.png",
    },
  ];

  const getButtonClass = (path: string) => {
    const normalizedPathname = pathname.replace(/\/$/, "");
    const normalizedPath = path.replace(/\/$/, "");
    const isActive = normalizedPathname === normalizedPath;

    const baseClasses =
      "profile-menu-item flex-1 flex flex-col items-center pt-4 pb-2 p-1 bg-white border border-gray-200 rounded-xl shadow-md transition-all";

    const activeClasses = "bg-paseo border-black text-white";
    const inactiveClasses = "text-black hover:text-black hover:bg-gray-100 hover:shadow-lg";

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getIconColor = (path: string) => {
    const normalizedPathname = pathname.replace(/\/$/, "");
    const normalizedPath = path.replace(/\/$/, "");
    const isActive = normalizedPathname === normalizedPath;

    return isActive ? "text-white" : "text-paseo"; // เปลี่ยนสี icon ตามสถานะ
  };

  return (
    <nav className="overflow-x-auto">
      <div className="w-full flex flex-row justify-center md:gap-4 gap-4 pb-2">

        {menuItems.map((item) => {
          const isActive =
            pathname.replace(/\/$/, "") === item.path.replace(/\/$/, "");

          return (
            <Link
              key={item.path}
              href={item.path}
              className="w-full flex flex-col items-center gap-2 transition"
            >
              <div
                className={`md:w-full md:h-16 w-full h-14 p-2 rounded-xl flex items-center justify-center border transition
                ${
                  isActive
                    ? "bg-gray-50 border-paseo-dark"
                    : "bg-white border-gray-200"
                }`}
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={60}
                  height={60}
                  className={`object-contain ${isActive ? "opacity-100" : "opacity-80"}`}
                  unoptimized
                  priority
                />
              </div>

              <span className="text-xs font-medium text-center leading-tight line-clamp-1">
                {item.label}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
};

export default MenuProfile;