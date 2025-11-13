"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Loading from '@/components/loading';

type Campaign = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  participantCount: number;
};

export default function CampaignPage() {
  const [campaign, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const res = await fetch("/api/campaign");
      const data = await res.json();
      setCampaigns(data);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  if (loading) return 
    <Loading />
  ;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Campaign</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.map(r => (
                <Link key={r.id} href={`/campaign/${r.id}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                  {r.imageUrl &&
                    <Image
                      width={600}
                      height={600}
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-full h-48 object-cover"
                    />
                  }
                  <div className="p-4">
                    <h3 className="text-lg font-bold">{r.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{r.description?.slice(0, 100)}...</p>
                    <p className="text-sm mt-2 text-gray-500">เข้าร่วมแล้ว: {r.participantCount} คน</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
}
