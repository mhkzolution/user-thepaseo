// lib/checkRole.ts
import { redirect } from "next/navigation";
import { Session } from "next-auth";

export function checkRole(session: Session | null, allowedRoles: string[]) {
  if (!session || !allowedRoles.includes(session.user.role)) {
    redirect("/admin");
  }
}
