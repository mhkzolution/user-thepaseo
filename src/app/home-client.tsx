"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import NewHomePage from "@/components/NewHomePage/page";
import Loading from "@/components/loading";

export default function HomeClient() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    setChecked(true);

    if (!user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  if (!checked) return <Loading />;
  if (!user) return <Loading />;

  return <NewHomePage user={user} />;
}