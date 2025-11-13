// components/HeaderMobile.tsx
'use client';

import Image from 'next/image';
import BackButton from '../BackButton/page';

interface Props {
  showBack?: boolean;
}

export default function HeaderMobile({ showBack = true }: Props) {
  return (
    <div className="relative overflow-hidden py-2 md:hidden">
      {showBack && (
        <div className="absolute top-4 left-4">
          <BackButton className="mb-4" />
        </div>
      )}

      <div className="flex flex-row justify-center gap-2 h-min">
        <Image src="/logo.png" alt="Thepaseo" width={50} height={50} />
      </div>
    </div>
  );
}