"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Participant = { user: { name: string; phone?: string }; joinedAt: string; redeemed: boolean };

export default function RewardParticipants() {
  const params = useParams();
  const { id } = params;
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/reward/${id}`);
      const data = await res.json();
      setParticipants(data.participations || []);
    })();
  }, [id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ผู้เข้าร่วม Reward</h1>
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2">ชื่อ</th>
            <th className="p-2">เบอร์โทร</th>
            <th className="p-2">วันที่เข้าร่วม</th>
            <th className="p-2">Redeemed</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-2">{p.user.name}</td>
              <td className="p-2">{p.user.phone || "-"}</td>
              <td className="p-2">{new Date(p.joinedAt).toLocaleDateString()}</td>
              <td className="p-2">{p.redeemed ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
