"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Registration = { user: { name: string; phone?: string }; joinedAt: string; redeemed: boolean };

export default function EventRegistrations() {
  const params = useParams();
  const { id } = params;
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/event/${id}`);
      const data = await res.json();
      setRegistrations(data.registrations || []);
    })();
  }, [id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ผู้เข้าร่วม Event</h1>
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2">ชื่อ</th>
            <th className="p-2">เบอร์โทร</th>
            <th className="p-2">วันที่เข้าร่วม</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((p, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-2">{p.user.name}</td>
              <td className="p-2">{p.user.phone || "-"}</td>
              <td className="p-2">{new Date(p.joinedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
