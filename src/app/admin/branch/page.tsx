"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { IoIosAddCircle } from "react-icons/io";

interface Branch {
  id: string;
  name: string;
  type: string;
  location?: string;
  imageUrl?: string;
  isActive: boolean;
}

export default function AdminBranchPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      const res = await fetch("/api/admin/branches");
      const data = await res.json();
      setBranches(data);
      setLoading(false);
    };
    fetchBranches();
  }, []);

  if (loading) return <p className="p-4">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="bg-white p-4 rounded-lg flex-1 mr-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold mb-4">จัดการสาขา</h1>
        <Link
            href="/admin/branch/new"
            className="flex flex-row items-center gap-2 px-4 py-2 bg-paseo text-white rounded-lg"
        >
            <IoIosAddCircle size={20} />
            เพิ่มสาขาใหม่
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 whitespace-nowrap">
              <th className="border px-3 py-2">ภาพ</th>
              <th className="border px-3 py-2">ชื่อสาขา</th>
              <th className="border px-3 py-2">ประเภท</th>
              <th className="border px-3 py-2">ที่ตั้ง</th>
              <th className="border px-3 py-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="border px-3 py-2 text-center">
                  {b.imageUrl ? (
                    <Image
                      width={600}
                      height={600}
                      src={b.imageUrl}
                      alt={b.name}
                      className="w-10 h-10 object-cover block mx-auto"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">ไม่มีรูป</div>
                  )}
                </td>
                <td className="border px-3 py-2">{b.name}</td>
                <td className="border px-3 py-2">{b.type}</td>
                <td className="border px-3 py-2">{b.location || "-"}</td>
                <td className="px-3 py-2 text-center flex justify-center gap-2">
                  <Link href={`/admin/branch/${b.id}/edit`}>
                    <Button variant="outline" size="sm" className="px-2 py-1 bg-paseo text-white rounded-lg">แก้ไข</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
