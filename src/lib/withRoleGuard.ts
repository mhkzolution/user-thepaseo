import React from "react";
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export function withRoleGuard<T extends object>(
  Page: (props: T & { session: any }) => React.ReactElement | Promise<React.ReactElement>,
  allowedRoles: string[]
) {
  const GuardedPage = async (props: T) => {
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.role || !allowedRoles.includes(session.user.role)) {
      redirect("/")
    }

    return Page({ ...props, session })
  }

  return GuardedPage
}
