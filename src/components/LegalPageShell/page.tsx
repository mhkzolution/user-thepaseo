"use client";

import HeaderMobile from "@/components/HeaderMobile/page";

interface LegalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-4 md:mb-4 mb-4 rounded-xl">
      <HeaderMobile showBack showFavorite={false} />

      <div className="min-h-dvh pt-14 md:pt-0 m-0 rounded-3xl bg-white shadow relative">
        <div className="space-y-4 md:p-10 py-8 px-4 overflow-hidden">
          <h1 className="text-black text-lg font-bold">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
