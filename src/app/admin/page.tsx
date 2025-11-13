// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth.config";

export default async function AdminHomePage() {
  const session = await getServerSession(authConfig);

  const allowedRoles = ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"];

  if (!session || !allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="bg-white p-4 rounded-lg flex flex-col gap-4">
      <h1>Admin Dashboard</h1>
      <p>ยินดีต้อนรับ, {session.user.name}</p>
      <p>นี่คือหน้าแรกของแอดมิน</p>
    </div>
  );
}