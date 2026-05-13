"use client"

import React, { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image";
import Link from 'next/link';

type BannerTerms = {
  id: string
  title: string
  linkUrl: string
  imageUrl: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
  order: number
}

export default function BannerTermsPage() {
  const [banners, setBanners] = useState<BannerTerms[]>([])
  const [loading, setLoading] = useState(true)
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  )

  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  
  useEffect(() => {
    const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/banner/bannerterms`);
      
        if (!res.ok) throw new Error("Failed to fetch banners")
        const data = await res.json()
        const now = new Date()
        // กรองแบนเนอร์ที่ isActive และยังไม่ถึง endDate
        const activeBanners = data
          .filter((banner: BannerTerms) => {
            const endDate = banner.endDate ? new Date(banner.endDate) : null
            return banner.isActive && (!endDate || endDate >= now)
          })
          .sort((a: BannerTerms, b: BannerTerms) => a.order - b.order)
        setBanners(activeBanners)
      } catch (error) {
        console.error("Error fetching banners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
  }, [emblaApi])

  return (
    <div className="embla w-full" ref={emblaRef}>
      <div className="embla__container h-full flex">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="embla__slide flex items-center justify-center rounded-2xl"
            >
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
          ))
        ) : (
          banners.map((banner) => (
            <div
              className="embla__slide flex items-center justify-center rounded-2xl"
              key={banner.id}
            >
              <Link
                href={banner.linkUrl}
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  width={600}
                  height={600}
                  className="object-contain w-full h-full rounded-xl"
                  loading="lazy"
                  unoptimized
                  priority
                  placeholder="blur"
                  blurDataURL="/blur-placeholder.jpg"
                />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}