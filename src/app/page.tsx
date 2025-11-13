// app/page.tsx
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import NewHomePage from "@/components/NewHomePage/page";
import { getProfile } from "@/lib/getProfile";


export default async function HomePage() {
  const user = await getProfile();

  // ❌ ยังไม่ได้ล็อกอิน → ส่งไปหน้า login
  if (!user) {
    redirect("/auth/login");
  }

  // ✅ ตรวจ incomplete profile เฉพาะ USER เท่านั้น
  const isAdmin = ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"].includes(user.role);

  if (!isAdmin) {
    const incompleteProfile =
      !user.dateOfBirth ||
      !user.gender ||
      !user.phone ||
      !user.branchId ||
      !user.occupation;

    if (incompleteProfile) {
      redirect("/complete-profile");
    }
  }

  // ✅ USER → หน้าโฮม
  // ✅ ADMIN → ก็อนุญาตให้ดูหน้านี้ได้เหมือนกัน
  return <NewHomePage user={user} />;
}
