"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AddUserModal from "../../../components/admin/AddUserModal/page";
import { Button } from "@/components/ui/button";

import { IoIosAddCircle } from "react-icons/io";
import { FaUser, FaSearch } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";


interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
}

// ✅ Modal ยืนยันการลบ (ใส่รหัสผ่านแบบปลอดภัย)
function DeleteConfirmModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password) return alert("กรุณากรอกรหัสผ่าน");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          adminPassword: password,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data.error || "รหัสผ่านไม่ถูกต้อง");
        return;
      }

      alert("✅ ลบผู้ใช้เรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบผู้ใช้ได้");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[380px] shadow-lg">
        <h2 className="text-lg font-bold mb-3 text-center text-red-600">
          ยืนยันการลบผู้ใช้
        </h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          กรุณากรอกรหัสผ่านของแอดมินเพื่อยืนยัน
        </p>
        <input
          type="password"
          placeholder="รหัสผ่านแอดมิน"
          className="border rounded-md p-2 w-full focus:outline-none focus:ring focus:ring-red-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
          >
            {loading ? "กำลังลบ..." : "ยืนยันลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"USER" | "ADMIN">("USER");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const roleFilter =
        activeTab === "USER"
          ? ["USER"]
          : ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"];

      const res = await fetch(`/api/admin/users?search=${search}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "โหลดข้อมูลผู้ใช้ล้มเหลว");

      const filtered = data.users.filter((u: User) => roleFilter.includes(u.role));
      setUsers(filtered);
    } catch (err) {
      console.error("Load users error:", err);
      alert("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const handleSearch = () => loadUsers();

  const handleAddSuccess = () => {
    setOpenAdd(false);
    loadUsers();
  };

  const handleEdit = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        return;
      }

      setEditUser(data);
    } catch (error) {
      console.error("โหลดข้อมูล user ล้มเหลว:", error);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  const handleEditSuccess = () => {
    setEditUser(null);
    loadUsers();
  };

  return (
    <div className="flex w-full min-h-screen">
      <div className="bg-white p-4 rounded-lg flex-1 mr-4">
        <div className="flex flex-row justify-between mb-4">
          <h1 className="text-2xl font-bold mb-4">จัดการผู้ใช้</h1>

          
        </div>

        {/* 🔹 Tabs */}
        <div className="flex flex-row justify-between">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("USER")}
              className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "USER" ? "bg-paseo text-white" : "bg-gray-200"
              }`}
            >
              <FaUser size={20} />
              สมาชิก (USER)
            </button>
            <button
              onClick={() => setActiveTab("ADMIN")}
              className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg ${
                activeTab === "ADMIN" ? "bg-paseo text-white" : "bg-gray-200"
              }`}
            >
              <RiAdminFill size={20} />
              ผู้ดูแลระบบ (ADMIN)
            </button>
          </div>

            {/* Search + Add */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative overflow-hidden flex-1 max-w-md">
              <input
                type="text"
                placeholder="ค้นหาชื่อ / เบอร์ / Email"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-paseo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <FaSearch className="absolute left-2 top-3 text-gray-400" size={18} />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-paseo text-white hover:bg-paseo-dark px-5 py-2.5 rounded-lg"
              >
                <FaSearch size={16} />
                ค้นหา
              </Button>

              <Button
                onClick={() => setOpenAdd(true)}
                className="flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-paseo text-white"
              >
                <IoIosAddCircle size={20} />
                เพิ่ม{activeTab === "USER" ? "สมาชิก" : "ผู้ดูแลระบบ"}
              </Button>
            </div>
            
          </div>

        </div>
        

        

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-500 py-6">กำลังโหลดข้อมูล...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-6">ไม่พบข้อมูลผู้ใช้</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 whitespace-nowrap">
                  <th className="border p-2">ชื่อ</th>
                  <th className="border p-2">เบอร์โทร</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="border p-2">{u.name}</td>
                    <td className="border p-2">{u.phone || "-"}</td>
                    <td className="border p-2">{u.email || "-"}</td>
                    <td className="border p-2 text-center">{u.role}</td>
                    <td className="border p-2 text-center space-x-2">
                      <Button
                        onClick={() => handleEdit(u.id)}
                        className="text-white px-3 py-1 rounded-lg bg-paseo"
                      >
                        แก้ไข
                      </Button>
                      {/* ✅ ซ่อนปุ่มถ้า role เป็น STAFF */}
                      {userRole !== "STAFF" && (
                        <>
                          
                          <Button
                            onClick={() => setDeleteUserId(u.id)}
                            className="text-white px-3 py-1 rounded-lg bg-red-500"
                          >
                            ลบ
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(openAdd || editUser) && (
          <AddUserModal
            open={openAdd || !!editUser}
            onClose={() => {
              setOpenAdd(false);
              setEditUser(null);
            }}
            onSuccess={editUser ? handleEditSuccess : handleAddSuccess}
            mode={editUser ? "edit" : "add"}
            initialData={editUser || undefined}
            userType={activeTab === "USER" ? "USER" : "ADMIN"}
          />
        )}

        {/* ✅ Modal ยืนยันลบ */}
        {deleteUserId && (
          <DeleteConfirmModal
            userId={deleteUserId}
            onClose={() => setDeleteUserId(null)}
            onSuccess={loadUsers}
          />
        )}


      </div>
    </div>
  );
}
