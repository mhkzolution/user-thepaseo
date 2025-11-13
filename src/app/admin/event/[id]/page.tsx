"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Loading from '@/components/loading';

export default function EventSinglePage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEvent = async () => {
    const res = await fetch(`/api/event/${id}`);
    const data = await res.json();
    setEvent(data);
    setLoading(false);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      const res = await fetch(`/api/event/${id}`);
      const data = await res.json();
      setEvent(data);
      setLoading(false);
    };

    if (id) fetchEvent();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    setMessage("");
    const res = await fetch(`/api/event/${id}/join`, { method: "POST" });
    const data = await res.json();
    setJoining(false);
    if (res.ok) {
      setMessage("เข้าร่วมสำเร็จ!");
      fetchEvent(); // refresh count
    } else {
      setMessage(data.error || "เข้าร่วมไม่สำเร็จ");
    }
  };

  if (loading) return 
  <Loading />
  ;
  if (!event) return <p>ไม่พบ Event</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
      {event.imageUrl &&
        <Image
          width={600}
          height={600}
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-64 object-cover mb-4 rounded-lg"
        />
      }
      <p className="mb-4">{event.description}</p>
      <p className="mb-4">{event.terms}</p>

      <div className="mb-4">
        <p><strong>เข้าร่วมแล้ว:</strong> {event.registrationCount} คน</p>
        {event.maxRegistrations && <p><strong>จำนวนสูงสุด:</strong> {event.maxRegistrations}</p>}
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
