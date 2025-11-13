"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { IoIosAddCircle } from "react-icons/io";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  order: number;
}

export default function AdminBannerLoginPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ดึงข้อมูลทั้งหมด
  useEffect(() => {
    fetch("/api/admin/bannerlogin")
      .then((res) => res.json())
      .then((data) => {
        setBanners(data);
        setLoading(false);
      })
      .catch(() => {
        alert("โหลดข้อมูลล้มเหลว");
        setLoading(false);
      });
  }, []);

  // คำนวณสถานะ
  const getStatus = (banner: Banner): "active" | "upcoming" | "expired" | "inactive" => {
    if (!banner.isActive) return "inactive";

    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (start && start > now) return "upcoming";
    if (end && end < now) return "expired";
    return "active";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge แสดงสถานะ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">กำลังแสดง</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500 text-white">รอเริ่ม</Badge>;
      case "expired":
        return <Badge className="bg-gray-500 text-white">หมดอายุ</Badge>;
      case "inactive":
        return <Badge variant="secondary">ปิดใช้งาน</Badge>;
      default:
        return null;
    }
  };

  // แยกกลุ่ม
  const activeBanners = banners.filter((b) => getStatus(b) === "active");
  const upcomingBanners = banners.filter((b) => getStatus(b) === "upcoming");
  const expiredBanners = banners.filter((b) => getStatus(b) === "expired");
  const inactiveBanners = banners.filter((b) => getStatus(b) === "inactive");

  // ย้ายตำแหน่งใน array ทั้งหมด
  const moveBanner = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newBanners = [...banners];
    const [moved] = newBanners.splice(fromIndex, 1);
    newBanners.splice(toIndex, 0, moved);

    // อัปเดต order ตาม index ใหม่
    const bannerOrder = newBanners.map((b, i) => ({ id: b.id, order: i }));

    try {
      const res = await fetch("/api/admin/bannerlogin/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerOrder }),
      });

      if (res.ok) {
        setBanners(newBanners); // อัปเดต UI
      } else {
        alert("บันทึกลำดับไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // ลบ
  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบ banner นี้?")) return;

    try {
      await fetch(`/api/admin/bannerlogin/${id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      alert("ลบไม่สำเร็จ");
    }
  };

  // แก้ไข
  const handleEdit = (id: string) => {
    router.push(`/admin/bannerlogin/${id}/edit`);
  };

  // สร้าง UI ของแต่ละ section
  const renderSection = (
    title: string,
    list: Banner[],
    color: string
  ) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          {title} ({list.length})
        </h2>
        <div className="space-y-3">
          {list.map((banner, idx) => {
            const globalIndex = banners.indexOf(banner);
            const isFirst = globalIndex === 0;
            const isLast = globalIndex === banners.length - 1;

            return (
              <Card key={banner.id} className="p-2 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {/* ปุ่ม ↑↓ */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => moveBanner(globalIndex, globalIndex - 1)}
                      disabled={isFirst}
                    >
                      <FaArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => moveBanner(globalIndex, globalIndex + 1)}
                      disabled={isLast}
                    >
                      <FaArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* รูป + ข้อมูล */}
                  <Image
                    width={600}
                    height={600}
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-xs text-gray-600 mt-1">
                      <span>
                        <strong>เริ่ม:</strong> {formatDate(banner.startDate)}
                      </span>
                      <span>
                        <strong>สิ้นสุด:</strong> {formatDate(banner.endDate)}
                      </span>
                    </div>
                    <div className="mt-1">{getStatusBadge(getStatus(banner))}</div>

                  </div>
                </div>

                {/* ปุ่มแก้ไข / ลบ */}
                <div className="flex gap-2">
                  <Button className="bg-paseo" size="sm" onClick={() => handleEdit(banner.id)}>
                    แก้ไข
                  </Button>
                  <Button
                    className="bg-red-500"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    ลบ
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>;
  }

  return (
    <div className="p-0 md:p-6 max-w-5xl mx-auto">
      {/* หัวข้อ + ปุ่มเพิ่ม */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">จัดการ Banner หน้าล็อกอิน</h1>
        <Button
          className="bg-paseo hover:bg-paseo-hover"
          onClick={() => router.push("/admin/bannerlogin/new")}
        >
          <IoIosAddCircle className="mr-2" size={20} />
          เพิ่ม Banner ใหม่
        </Button>
      </div>

      {/* แสดง section ตามลำดับความสำคัญ */}
      {renderSection("กำลังแสดงอยู่", activeBanners, "bg-green-500")}
      {renderSection("รอเริ่มแสดง", upcomingBanners, "bg-blue-500")}
      {renderSection("หมดอายุแล้ว", expiredBanners, "bg-gray-500")}
      {renderSection("ปิดใช้งาน", inactiveBanners, "bg-orange-500")}

      {banners.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>ยังไม่มี banner</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/admin/bannerlogin/new")}
          >
            สร้างอันแรก
          </Button>
        </div>
      )}
    </div>
  );
}