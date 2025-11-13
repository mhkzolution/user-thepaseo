// app/admin/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth.config";
import {
  Button
} from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import Sidebar from "./Sidebar"; // นำเข้า Sidebar

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ดึง session ใน Server Component
  const session = await getServerSession(authConfig);
  const allowedRoles = ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"];

  // ตรวจสอบ session และ role
  if (!session || !allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar session={session} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden m-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0 w-64 sm:max-w-xs">
          <Sidebar session={session} />
        </SheetContent>
      </Sheet>

      {/* Content */}
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}