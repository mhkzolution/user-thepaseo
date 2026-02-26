'use client'

import Link from 'next/link';
import BannerPoint from "@/components/BannerPoint/page"

export default function WelcomePage() {


  return (
    <div className="h-screen max-w-2xl mx-auto p-0 m-0 md:rounded-xl overflow-hidden">

        <div className="-mb-6" style={{ height:'40%' }}>

          <BannerPoint />
        </div>
        

        <div className="p-10 m-0 rounded-3xl bg-white shadow relative"style={{ height:'65%' }}>
          <div className="flex flex-col justify-between items-center">

            
            <div className="flex flex-col mb-4">
              <h2 className="text-3xl font-bold text-center text-black">Welcome to</h2>
              <h2 className="text-3xl font-bold text-center text-black">THE PASEO</h2>
              <h2 className="text-5xl font-bold text-center text-black">REWARD</h2>
            </div>
            
              <div className="absolute bottom-10 flex flex-col w-full gap-4 p-10">
                <div>
                  <Link href="/auth/login" passHref className="w-full text-white p-3 pl-1 pr-1 md:p-2 rounded-full flex justify-center items-center"
                      style={{ backgroundColor: '#9DC93C' }}
                    >
                      <span className="flex-shrink mx-4 text-white">Start Exploring</span>
                  </Link>
                </div>

                
                
              </div>
              

          </div>

        </div>

    </div>
  )
}