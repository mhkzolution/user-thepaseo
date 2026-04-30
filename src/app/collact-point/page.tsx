'use client'

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import Link from 'next/link';
import BannerPoint from "@/components/BannerPoint/page"
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaQrcode } from "react-icons/fa";
import { MdCampaign } from "react-icons/md";
import Loading from '@/components/loading';

import HeaderMobile from '@/components/HeaderMobile/page';

export default function CollactPointPage() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loading />;
  if (!user) return <Loading />;


  return (
    <div className="max-w-lg mx-auto h-screen p-0 mb-0 md:mb-0 mb-0 rounded-t-xl relative overflow-hidden">
      <HeaderMobile showBack={true} />

      <div className="md:pt-14 pt-16 mb-0 py-4 px-4 md:px-4">
        <BannerPoint />
      </div>
        
      <div className="w-full h-full py-8 px-10 m-0 rounded-t-3xl bg-white shadow z-50 md:relative">
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