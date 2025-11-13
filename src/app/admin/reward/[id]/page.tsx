"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Loading from '@/components/loading';

export default function RewardSinglePage() {
  const { id } = useParams();
  const [reward, setReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

  const fetchReward = async () => {
    const res = await fetch(`/api/reward/${id}`);
    const data = await res.json();
    setReward(data);
    setLoading(false);
  };

  useEffect(() => { fetchReward(); }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    setMessage("");
    const res = await fetch(`/api/reward/${id}/join`, { method: "POST" });
    const data = await res.json();
    setJoining(false);
    if (res.ok) {
      setMessage("เข้าร่วมสำเร็จ!");
      fetchReward(); // refresh count
    } else {
      setMessage(data.error || "เข้าร่วมไม่สำเร็จ");
    }
  };

  if (loading) return 
  <Loading />
  ;
  if (!reward) return <p>ไม่พบ Reward</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{reward.name}</h1>
      {reward.imageUrl &&
        <Image
          width={600}
          height={600}
          src={reward.imageUrl}
          alt={reward.name}
          className="w-full h-64 object-cover mb-4 rounded-lg"
        />
      }
      <p className="mb-4">{reward.description}</p>
      <p className="mb-4">{reward.terms}</p>

      <div className="mb-4">
        <p><strong>เข้าร่วมแล้ว:</strong> {reward.participantCount} คน</p>
        {reward.maxParticipants && <p><strong>จำนวนสูงสุด:</strong> {reward.maxParticipants}</p>}
      </div>

      <button
        onClick={handleJoin}
        disabled={joining}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {joining ? "กำลังเข้าร่วม..." : "เข้าร่วมกิจกรรม"}
      </button>

      {message && <p className="mt-3 text-paseo">{message}</p>}
    </div>
  );
}
