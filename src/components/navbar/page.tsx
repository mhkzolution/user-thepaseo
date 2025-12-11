"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "หน้าแรก",
      path: "/",
      icon: "/uploads/admin/navbar/icon_home.svg",
    },
    {
      label: "อัปโหลดใบเสร็จ",
      //path: "/collact-point",
      path: "/upload",
      icon: "/uploads/admin/navbar/icon_receipt.svg",
    },
    {
      label: "สิทธิพิเศษ",
      path: "/privilege",
      icon: "/uploads/admin/navbar/icon_gift.svg",
    },
    {
      label: "Directory",
      path: "/directory",
      icon: "/uploads/admin/navbar/icon_shop.svg",
    },
    {
      label: "Help",
      path: "/help",
      icon: "/uploads/admin/navbar/icon_help.svg",
    },
  ];

  const menuItemsMobile = [
    {
      label: "หน้าแรก",
      path: "/",
      icon: "/uploads/admin/navbar/icon_home.svg",
    },
    {
      label: "สะสมพอยท์",
      //path: "/collact-point",
      path: "/upload",
      icon: "/uploads/admin/navbar/icon_receipt.svg",
    },
    {
      label: "สิทธิพิเศษ",
      path: "/privilege",
      icon: "/uploads/admin/navbar/icon_gift.svg",
    },
    {
      label: "Directory",
      path: "/directory",
      icon: "/uploads/admin/navbar/icon_shop.svg",
    },
    {
      label: "โปรไฟล์",
      path: "/profile",
      icon: "/uploads/admin/navbar/icon_profile.svg",
    },
    {
      label: "ช่วยเหลือ",
      path: "/help",
      icon: "/uploads/admin/navbar/icon_help.svg",
    },
  ];

  const getButtonClass = (path: string) => {
    const isActive = pathname === path;
    const baseClasses =
      "flex items-center space-x-1 transition-all duration-300 transform hover:scale-105";
    const activeClasses = "active-btn text-white bg-paseo scale-105 py-1 px-4 rounded-full";
    const inactiveClasses = "text-black rounded-full py-1 px-4 hover:text-white hover:bg-paseo-dark";

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getMobileButtonClass = (path: string) => {
    const isActive = pathname === path;
    const baseClasses =
      "flex flex-col items-center flex-1 p-1 text-center transition-colors duration-200 rounded-lg hover:scale-105";
    // ใช้คลาสที่กำหนดไว้ใน config แทน
    const activeClasses = "text-white bg-paseo scale-105";
    const inactiveClasses = "text-black hover:text-black";

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className="w-full hidden md:flex overflow-hidden mt-0 mb-5 p-0 text-black z-50 rounded-xl top-5 mx-auto shadow-sm"
      >
        <div className="fixed relarive w-full overflow-hidden flex flex-row flex-1 z-50 justify-between items-center blur py-2 px-4">
            <div className="flex flex-row justify-center gap-2 h-min w-25%">
              <Image
                priority={true}
                src="/logo.png"
                alt="Thepaseo"
                width={50}
                height={50}
              />
            </div>

            <div className="h-min flex flex-row nowarp gap-4 rounded-full p-2 pt-1 pb-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path} prefetch={false} className={getButtonClass(item.path)}>
                <Image priority={true} src={item.icon} alt="Thepaseo" width={32} height={32} />
                <p className="font-medium text-base whitespace-nowrap">{item.label}</p>
              </Link>
            ))}
            </div>

            <div className="flex flex-row justify-center gap-2 h-min w-25%">
              <Link 
                key="/profile"
                href="/profile"
                className="text-white bg-white hover:scale-105 hover:bg-paseo-hover scale-105 py-2 px-8 rounded-full shadow-sm border border-gray-200"
              >
                
                <Image className="text-white" priority={true} src="/uploads/admin/navbar/icon_profile.svg" alt="Thepaseo" width={32} height={32} />
              </Link>
            </div>
        </div>

      </nav>
      
      {/* Mobile Bottom Menu */}
      <nav className="md:hidden bg-white overflow-hidden fixed bottom-0 left-0 right-0 text-black rounded-t-xl shadow-sm border border-gray-200" style={{ zIndex:'49'}}>
        <div className="flex justify-around p-1">
          {menuItemsMobile.map((item) => (
            <Link key={item.path} href={item.path} prefetch={false} className={getMobileButtonClass(item.path)}>
              <Image priority={true} src={item.icon} alt="Thepaseo" width={24} height={24} />
              <span className="text-10px mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;