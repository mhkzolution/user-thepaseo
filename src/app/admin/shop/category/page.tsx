'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/loading';

import { IoIosAddCircle } from "react-icons/io";

export default function ShopCategoryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/shop/category');
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?')) return;
    await fetch(`/api/admin/shop/category/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  if (loading) return
  <Loading />
  ;

  return (
    <div className="bg-white p-4 rounded-lg flex-1 mr-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold mb-4">หมวดหมู่ร้านค้า</h1>
        <Link
          href="/admin/shop/category/new"
          className="flex flex-row items-center gap-2 px-4 py-2 bg-paseo text-white rounded-lg"
        >
          <IoIosAddCircle size={20} />
          เพิ่มหมวดหมู่
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 whitespace-nowrap">
              <th className="border px-3 py-2">รูปภาพ</th>
              <th className="border px-3 py-2">ชื่อ</th>
              <th className="border px-3 py-2">Slug</th>
              <th className="border px-3 py-2">จำนวนร้าน</th>
              <th className="border px-3 py-2 w-40">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="border px-3 py-2 text-center">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      width={60}
                      height={60}
                      className="w-10 h-10 object-cover block mx-auto"
                    />
                  ) : (
                    <span className="text-gray-400">ไม่มีรูป</span>
                  )}
                </td>
                <td className="border px-3 py-2">{cat.name}</td>
                <td className="border px-3 py-2">{cat.slug}</td>
                <td className="border px-3 py-2">{cat.shops.length}</td>
                <td className="px-3 py-2 text-center flex justify-center gap-2">
                  <Link
                    href={`/admin/shop/category/${cat.id}/edit`}
                    className="px-2 py-1 bg-paseo text-white rounded-lg"
                  >
                    แก้ไข
                  </Link>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded-lg"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
