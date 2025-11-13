// app/admin/campaign/[id]/participants/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CampaignParticipantsPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/campaign/${id}`)
      .then((res) => res.json())
      .then(setCampaign);
  }, [id]);

  if (!campaign) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">ผู้เข้าร่วม: {campaign.name}</h1>
      {campaign.participations.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีผู้เข้าร่วม</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ชื่อ</th>
              <th className="p-2 border">เบอร์</th>
              <th className="p-2 border">อีเมล</th>
              <th className="p-2 border">เข้าร่วมเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {campaign.participations.map((p: any) => (
              <tr key={p.id}>
                <td className="p-2 border">{p.user?.name}</td>
                <td className="p-2 border">{p.user?.phone}</td>
                <td className="p-2 border">{p.user?.email}</td>
                <td className="p-2 border">
                  {new Date(p.joinedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
