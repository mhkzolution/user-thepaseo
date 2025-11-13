'use client'

import { useEffect, useState } from "react";
import Link from 'next/link';
import BannerPoint from "@/components/BannerPoint/page"
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaQrcode } from "react-icons/fa";
import { MdCampaign } from "react-icons/md";
import Loading from '@/components/loading';

import HeaderMobile from '@/components/HeaderMobile/page';

export default function CollactPointPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
      const fetchProfile = async () => {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      };
      fetchProfile();
    }, []);
  
    if (!user) {
      return (
          <Loading />
        );
    }


  return (
    <div className="h-screen max-w-2xl mx-auto p-0 md:mt-20 rounded-2xl overflow-hidden">

      <HeaderMobile />

      <div className="md:h-30% h-25% max-w-2xl mx-auto p-0 ">

        <div className="rounded-xl w-full pt-4 px-4 md:pt-0 md:px-10 md:pb-0">

        <BannerPoint />

        </div>
      </div>
        

      <div className="md:h-70% h-75% p-6 pt-16 mt-4 rounded-t-3xl bg-white shadow relative">
        <div className="flex flex-col justify-center items-center space-y-6">

          

          <h2 className="text-xl font-semi mb-5 text-center text-black">กรุณาเลือกสะสมพอยท์</h2>
            <div className="flex flex-col w-full gap-4">
              <div>
                <Link href="/upload" passHref className="w-full text-white p-3 pl-1 pr-1 md:p-2 rounded-full flex justify-center items-center"
                    style={{ backgroundColor: '#9DC93C' }}
                  >
                    <FaCloudUploadAlt />
                    <span className="flex-shrink mx-4 text-white">อัพโหลดใบเสร็จ</span>
                </Link>
              </div>

              <div className="hidden w-full flex flex-row gap-4">
                <Link href="/upload" passHref className="w-full text-white p-3 pl-1 pr-1 md:p-2 rounded-full flex justify-center items-center"
                    style={{ backgroundColor: '#9DC93C' }}
                  >
                    <FaQrcode />
                    <span className="flex-shrink mx-4 text-white">QR CODE</span>
                </Link>

                <Link href="/upload" passHref className="w-full text-white p-3 pl-1 pr-1 md:p-2 rounded-full flex justify-center items-center"
                    style={{ backgroundColor: '#9DC93C' }}
                  >
                    <MdCampaign />
                    <span className="flex-shrink mx-4 text-white">Campaign</span>
                </Link>
              </div>
              
            </div>
            

        </div>

      </div>

    </div>
  )
}