"use client";

import { useState, useEffect } from "react";

export default function UserAdminPage() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", password: "" });

  // โหลดรายชื่อ AdminUser
  useEffect(() => {
    fetch("/api/admin/useradmin")
      .then(res => res.json())
      .then(data => setAdmins(data));
  }, []);

  // สร้าง AdminUser
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/useradmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("สร้าง AdminUser สำเร็จ");
      setForm({ email: "", name: "", password: "" });
      const updated = await fetch("/api/admin/useradmin").then(r => r.json());
      setAdmins(updated);
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">จัดการ Admin Users</h1>

      {/* ฟอร์มสร้าง AdminUser */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="ชื่อ"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="border px-3 py-2 w-full"
          required
        />
        <input
          type="email"
          placeholder="อีเมล"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="border px-3 py-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="border px-3 py-2 w-full"
          required
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          สร้าง AdminUser
        </button>
      </form>

      {/* รายการ AdminUser */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2">ชื่อ</th>
            <th className="border px-3 py-2">อีเมล</th>
            <th className="border px-3 py-2">วันที่สร้าง</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin: any) => (
            <tr key={admin.id}>
              <td className="border px-3 py-2">{admin.name}</td>
              <td className="border px-3 py-2">{admin.email}</td>
              <td className="border px-3 py-2">
                {new Date(admin.createdAt).toLocaleString("th-TH")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
