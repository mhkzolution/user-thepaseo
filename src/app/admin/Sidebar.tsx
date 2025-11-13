"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Session } from "next-auth"; // ✅ เพิ่ม type
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LogOut, Home, UserRound, ChevronDown } from "lucide-react";
import { menuItems } from "@/lib/auth/permissions";
import { signOut } from "next-auth/react";



type _MenuItem = {
  name: string;
  logo?: React.ComponentType<{ className?: string }>;
  href: string;
  subItems?: {
    name: string;
    href: string;
    roles?: string[];
    logo?: React.ComponentType<{ className?: string }>;
  }[];
  roles?: string[];
  permission?: string;
};

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const [openPopover, setOpenPopover] = React.useState<string | null>(null);

  // ✅ ดึง role & permission จาก session ที่ส่งมาจาก server
  const role = session?.user?.role ?? "USER";
  const permissions = session?.user?.permissions ?? [];

  // ✅ กรองเมนูตาม role + permission
  const filteredMenu = menuItems.filter(
    (item) =>
      (!item.roles || item.roles.includes(role)) &&
      (!item.permission || permissions.includes(item.permission))
  );

  return (
    <div className="w-64 h-screen bg-white border-r p-2 pr-0 flex flex-col shadow-md">
      {/* Logo + Title */}
      <div className="flex items-center gap-2 pb-3 pr-2 mb-2">
        <Image
          src="/Logo_mall.png"
          alt="ThePaseo"
          width={36}
          height={36}
          className="rounded-md"
        />
        <h2 className="font-bold text-lg text-gray-800">Admin Menu</h2>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 pr-2 pb-4">
        <div className="space-y-1">
          {filteredMenu.map((item) => {
            const Logo = item.logo;
            const hasSubItems = item.subItems?.some(
              (sub) => !sub.roles || sub.roles.includes(role)
            );

            // ✅ ถ้ามี subItems → Popover
            if (hasSubItems) {
              return (
                <Popover
                  key={item.name}
                  open={openPopover === item.name}
                  onOpenChange={(open) =>
                    setOpenPopover(open ? item.name : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between py-6 text-left font-medium transition-all",
                        pathname.startsWith(item.href)
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "text-gray-700 hover:bg-primary/5 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {Logo && <Logo className="w-5 h-5" />}
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          openPopover === item.name && "rotate-180"
                        )}
                      />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-56 p-0 ml-4 border shadow-lg"
                    align="start"
                    sideOffset={5}
                  >
                    <div className="flex flex-col bg-white">
                      {item.subItems!
                        .filter((sub) => !sub.roles || sub.roles.includes(role))
                        .map((sub) => {
                          const SubLogo = sub.logo;
                          return (
                            <Link key={sub.name} href={sub.href} className="block">
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start h-10 rounded-none text-sm font-normal",
                                  pathname === sub.href
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-gray-100"
                                )}
                                onClick={() => setOpenPopover(null)} // ปิด popover หลังคลิก
                              >
                                {SubLogo && <SubLogo className="w-4 h-4 mr-2" />}
                                {sub.name}
                              </Button>
                            </Link>
                          );
                        })}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            // ✅ ถ้าไม่มี subItems → ลิงก์ตรง
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start py-6 text-left font-medium transition-all",
                    pathname === item.href
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "text-gray-700 hover:bg-primary/5 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {Logo && <Logo className="w-5 h-5" />}
                    <span>{item.name}</span>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-gray-200 pr-2 space-y-2">
        <div className="flex items-center text-gray-800 px-3">
          <UserRound className="h-5 w-5 mr-2 text-gray-500" />
          <div>
            <p className="font-semibold text-sm">
              {session?.user?.name || "ผู้ดูแลระบบ"}
            </p>
            <p className="text-xs text-gray-500">{session?.user?.role}</p>
          </div>
        </div>

        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-primary-light hover:text-text-active transition-colors duration-200"
          >
            <Home className="h-4 w-4 mr-2" />
            ไปหน้าเว็ปไซต์
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
          onClick={() => signOut({ callbackUrl: "/admin-login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
}
