// app/admin/campaign/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Loading from '@/components/loading';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/admin/campaign/${id}`)
        .then((res) => res.json())
        .then(setCampaign);
    }
  }, [id]);

  if (!campaign) return 
    <Loading />
  ;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{campaign.name}</h1>
      <p className="text-gray-600">{campaign.description}</p>
      <p className="text-sm italic text-gray-500">{campaign.terms}</p>

      {campaign.imageUrl && (
        <Image
          width={600}
          height={600}
          src={campaign.imageUrl}
          alt={campaign.name}
          className="w-64 rounded"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>เริ่ม: {new Date(campaign.startDate).toLocaleString()}</div>
        <div>สิ้นสุด: {new Date(campaign.endDate).toLocaleString()}</div>
        <div>ใช้แต้ม: {campaign.pointCost}</div>
        <div>ได้แต้ม: {campaign.pointEarn}</div>
        <div>จำนวนสูงสุด: {campaign.quantity ?? "-"}</div>
        <div>จำกัดต่อ User: {campaign.maxPerUser ?? "-"}</div>
      </div>

      <h2 className="text-lg font-bold">คูปอง</h2>
      {campaign.coupons?.length > 0 ? (
        <ul className="list-disc pl-6">
          {campaign.coupons.map((c: any) => (
            <li key={c.id}>
              {c.name} (code: {c.code}) - {c.pointCost} แต้ม | หมดอายุ{" "}
              {new Date(c.expiresAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">ยังไม่มีคูปอง</p>
      )}

      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push(`/admin/campaign/${id}/edit`)}
        >
          แก้ไข
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded"
          onClick={() => router.push(`/admin/campaign/${id}/participants`)}
        >
          ผู้เข้าร่วม
        </button>
      </div>
    </div>
  );
}
