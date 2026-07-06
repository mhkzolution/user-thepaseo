"use client";

import { useContext, useEffect, useState } from 'react';
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { AuthContext } from "@/contexts/AuthContext";

import { IoTicketOutline } from "react-icons/io5";
import { IoHeartSharp } from "react-icons/io5";

interface CouponData {
  id: string;
  used: boolean;
  assignedAt: string;
  coupon: {
    id: string;
    code: string;
    name: string;
    expiresAt: string;
    imageUrl: string;
  };
}

interface UserProfileData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  branch?: { name: string };
  residenceType?: string;
  address: string;
  subDistrict?: string;
  district?: string;
  postalCode?: string;
  avatar?: string;
  point: number;
  activeCouponCount: number;
  coupons: CouponData[];
  totalSpending: number;
  referralCode: string;
  referredBy?: string;
}

const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return null;

  // ถ้าเป็น URL เต็ม (http หรือ https) → ใช้ได้เลย
  if (avatar.startsWith("http")) {
    return avatar;
  }

  // ถ้าเป็นแค่ชื่อไฟล์ → ชี้ไปที่ public/user/profile
  return `/user/profile/${avatar}`;
};

const Navbar = () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [user, setUser] = useState<UserProfileData | null>(null);
  const pathname = usePathname();
  const { user: authUser, loading: authLoading } = useContext(AuthContext);

  const menuItems = [
    {
      label: "หน้าแรก",
      path: "/",
      icon: "/uploads/admin/navbar/icon_home.svg",
      iconActive: "/uploads/admin/navbar/icon_home_white.svg",
    },
    {
      label: "สะสมพอยท์",
      path: "/upload",
      icon: "/uploads/admin/navbar/icon_receipt.svg",
      iconActive: "/uploads/admin/navbar/icon_receipt_white.svg",
    },
    {
      label: "สิทธิ์",
      path: "/privilege",
      icon: "/uploads/admin/navbar/icon_gift.svg",
      iconActive: "/uploads/admin/navbar/icon_gift_white.svg",
    },
    {
      label: "ร้านค้า",
      path: "/directory",
      icon: "/uploads/admin/navbar/icon_shop.svg",
      iconActive: "/uploads/admin/navbar/icon_shop_white.svg",
    },
    {
      label: "ช่วยเหลือ",
      path: "/help",
      icon: "/uploads/admin/navbar/icon_help.svg",
      iconActive: "/uploads/admin/navbar/icon_help_white.svg",
    },
  ];

  const menuItemsMobile = [
    {
      label: "หน้าแรก",
      path: "/",
      icon: "/uploads/admin/navbar/icon_home.svg",
      iconActive: "/uploads/admin/navbar/icon_home_white.svg",
    },
    {
      label: "สะสมพอยท์",
      //path: "/collact-point",
      path: "/upload",
      icon: "/uploads/admin/navbar/icon_receipt.svg",
      iconActive: "/uploads/admin/navbar/icon_receipt_white.svg",
    },
    {
      label: "สิทธิ์",
      path: "/privilege",
      icon: "/uploads/admin/navbar/icon_gift.svg",
      iconActive: "/uploads/admin/navbar/icon_gift_white.svg",
    },
    {
      label: "ร้านค้า",
      path: "/directory",
      icon: "/uploads/admin/navbar/icon_shop.svg",
      iconActive: "/uploads/admin/navbar/icon_shop_white.svg",
    },
    {
      label: "โปรไฟล์",
      path: "/profile",
      icon: "/uploads/admin/navbar/icon_profile.svg",
      iconActive: "/uploads/admin/navbar/icon_profile_white.svg",
    },
    {
      label: "ช่วยเหลือ",
      path: "/help",
      icon: "/uploads/admin/navbar/icon_help.svg",
      iconActive: "/uploads/admin/navbar/icon_help_white.svg",
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const getButtonClass = (path: string) => {
    const isActive = pathname === path;
    const baseClasses =
      "flex items-center space-x-0.5 lg:space-x-1 transition-all duration-300 transform hover:scale-105";
    const activeClasses =
      "active-btn text-white bg-paseo scale-105 py-1 px-2 lg:px-4 rounded-full";
    const inactiveClasses =
      "text-black rounded-full py-1 px-2 lg:px-4 hover:text-white hover:bg-paseo-dark";

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

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      setUser(null);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/profile`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch user profile:", err);
          setUser(null);
        }
      }
    };

    void fetchUser();

    return () => {
      cancelled = true;
    };
  }, [API_URL, authLoading, authUser]);

  if (
    pathname.startsWith("/auth") ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/delete-account"
  ) {
    return null;
  }

  if (authLoading) {
    return null;
  }

  if (!authUser) {
    return null;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className="w-full hidden md:flex overflow-hidden md:m-0 mt-0 mb-5 p-0 text-black z-50 rounded-xl top-5 mx-auto shadow-sm"
      >
        <div className="fixed top-0 left-0 w-full flex flex-row flex-1 z-50 justify-between items-center bg-white/40 backdrop-blur-md py-1.5 px-2 md:px-3 lg:py-2 lg:px-4 border-b border-white/20">
            <div className="flex flex-row justify-center gap-2 h-min shrink-0 md:w-auto lg:w-25%">
              <img
                src={`${BASE_URL}/logo.png`}
                alt="Thepaseo"
                width={50}
                height={50}
                className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain"
              />
            </div>

            <div className="h-min flex flex-row flex-nowrap gap-1 md:gap-2 lg:gap-4 rounded-full p-1 lg:p-2 pt-1 pb-1 min-w-0">
              {menuItems.map((item) => {
                const isActive = isActivePath(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={false}
                    className={getButtonClass(item.path)}
                  >
                    <img
                      src={isActive ? item.iconActive : item.icon}
                      alt={item.label}
                      width={32}
                      height={32}
                      className="w-6 h-6 lg:w-8 lg:h-8 shrink-0"
                    />
                    <p className="font-medium text-[10px] md:text-xs lg:text-sm whitespace-nowrap">
                      {item.label}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-row justify-center items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0 md:w-auto lg:w-25%">

              <div className="flex flex-row justify-between gap-1 lg:gap-2">
                <div className="z-10 flex flex-row text-center items-center gap-1 lg:gap-2 bg-white p-0.5 lg:p-1 border border-gray-100 rounded-lg shadow-lg">
                  <Link className="w-full flex flex-row items-center gap-1 lg:gap-2 font-semibold" href="/profile/point">
                      <Image
                        src="/icon/icon-point.png"
                        alt="Thepaseo"
                        width={24}
                        height={24}
                        className="w-4 h-4 lg:w-6 lg:h-6 object-contain shrink-0"
                        unoptimized
                        priority
                      />

                      <div className="flex flex-col justify-center items-start w-full gap-0.5 lg:gap-1">
                        <span className="text-[10px] lg:text-xs leading-none font-medium text-black hidden lg:inline">พอยท์</span>
                        <span className="text-[10px] lg:text-xs leading-none font-semibold text-black whitespace-nowrap">
                          {user.point.toLocaleString()}<span className="hidden lg:inline"> พอยท์</span>
                        </span>
                      </div>
                    </Link>
                </div>

                <div className="z-10 flex flex-row text-center items-center gap-1 lg:gap-2 bg-white p-0.5 lg:p-1 border border-gray-100 rounded-lg shadow-lg">
                  <Link className="w-full flex flex-row items-center gap-1 lg:gap-2 font-semibold" href="/profile/coupon">
                    <IoTicketOutline className="text-black w-4 h-4 lg:w-6 lg:h-6 shrink-0" />

                    <div className="flex flex-col justify-center items-start w-full gap-0.5 lg:gap-1">
                      <span className="text-[10px] lg:text-xs leading-none font-medium text-black hidden lg:inline">คูปอง</span>
                      <span className="text-[10px] lg:text-xs leading-none font-semibold text-black whitespace-nowrap">
                        {user.activeCouponCount}<span className="hidden lg:inline"> ใบ</span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="">
                <Link 
                  key="/profile"
                  href="/profile"
                  className="w-full"
                >
                  <div className="w-9 h-9 lg:w-12 lg:h-12 picture-section flex flex-row justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${user.firstName} ${user.lastName}'s avatar`}
                        width={36}
                        height={36}
                        className="rounded-full object-cover shadow-sm w-9 h-9 lg:w-12 lg:h-12"
                        unoptimized
                        priority
                      />
                      ) : (
                        <img className="text-white w-9 h-9 lg:w-12 lg:h-12" src="/uploads/admin/navbar/icon_profile.svg" alt="Thepaseo" width={36} height={36} />
                      )}
                    </div>
                </Link>
              </div>
              <div className="relative">
                <Link
                  href="/favorite"
                  className="flex flex-row items-center p-0.5 lg:p-1 bg-paseo text-white rounded-full"
                >
                  <IoHeartSharp className="w-5 h-5 lg:w-6 lg:h-6" />
                </Link>
              </div>
            </div>
        </div>

      </nav>
      
      {/* Mobile Bottom Menu */}
      <nav className="md:hidden bg-white overflow-hidden fixed bottom-0 left-0 right-0 text-black rounded-t-xl shadow-sm border border-gray-200 pb-safe-bottom" style={{ zIndex:'49'}}>
        <div className="flex justify-around p-1">
          {menuItemsMobile.map((item) => {
            const isActive = isActivePath(item.path);

            return (
              <Link key={item.path} href={item.path} prefetch={false} className={getMobileButtonClass(item.path)}>
                <img
                  src={isActive ? item.iconActive : item.icon}
                  alt={item.label}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className="text-10px mt-0.5 leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;