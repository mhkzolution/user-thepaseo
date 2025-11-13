"use client";
//app/upload

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';
import BannerUpload from "@/components/BannerUpload/page"

interface ReceiptHistory {
  id: string;
  imageUrl: string;
  amount: number;
  status: string;
  fileType: string;
  createdAt: string;
}

export default function UploadPage() {
  const [tab, setTab] = useState<"upload" | "history">("upload");
  const [images, setImages] = useState<File[]>([]);
  const [history, setHistory] = useState<ReceiptHistory[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดประวัติ
  useEffect(() => {
    if (tab === "history") {
      fetch("/api/receipt/history")
        .then((res) => res.json())
        .then((data) => setHistory(data));
    }
  }, [tab]);

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert("กรุณาเลือกไฟล์");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));

    const res = await fetch("/api/receipt/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("อัปโหลดสำเร็จ");
      setImages([]);
      setTab("history");
    } else {
      alert("เกิดข้อผิดพลาด");
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  return (
    <div className="container mx-auto h-screen overflow-hidden p-0 md:p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md mx-auto p-0 md:rounded-xl rounded-none shadow overflow-hidden">

        <div className="-mb-6">

          <BannerUpload />
        </div>
        

        <div className="min-h-dvh p-10 m-0 rounded-3xl bg-white shadow z-50 relative">
          {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 p-2 ${
            tab === "upload" ? "border-b-2 border-paseo font-bold" : ""
          }`}
          onClick={() => setTab("upload")}
        >
          อัปโหลดใบเสร็จ
        </button>
        <button
          className={`flex-1 p-2 ${
            tab === "history" ? "border-b-2 border-paseo font-bold" : ""
          }`}
          onClick={() => setTab("history")}
        >
          ประวัติการอัปโหลด
        </button>
      </div>

      {/* Upload */}
      {tab === "upload" && (
        <div className="space-y-4">
          <div className="mb-6">
            <label className="block text-gray-700 text-left font-semibold mb-2">
              อัปโหลดภาพใบเสร็จ (เลือกได้หลายไฟล์)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-paseo transition-colors duration-200"
            >
              <span className="text-gray-500">
                {images.length > 0
                  ? `${images.length} ไฟล์ที่เลือก`
                  : "ยังไม่มีไฟล์"}
              </span>
              <button
                type="button"
                className="text-white font-semibold py-2 px-4 rounded-full"
                style={{ backgroundColor: "#9DC93C" }}
              >
                เลือกไฟล์
              </button>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {images.map((img, i) => (
                  <Image
                    width={600}
                    height={600}
                    key={i}
                    src={URL.createObjectURL(img)}
                    alt="preview"
                    className="h-full object-cover object-center rounded-lg shadow"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="text-white px-4 py-2 rounded-full disabled:opacity-50"
            style={{ backgroundColor: "#9DC93C" }}
          >
            {uploading ? "กำลังอัปโหลด..." : "ส่งข้อมูล"}
          </button>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 && (
            <p className="text-gray-500">ยังไม่มีประวัติการอัปโหลด</p>
          )}
          {history.map((item) => (
            <div key={item.id} className="border p-2 rounded flex gap-4 items-center">
              {item.fileType === "image" ? (
                <Image
                  src={item.imageUrl}
                  alt="receipt"
                  width={600}
                  height={600}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <Link
                  href={item.imageUrl}
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  ดูไฟล์ PDF
                </Link>
              )}

              <div className="flex-1">
                <p>
                  สถานะ:{" "}
                  <span
                    className={
                      item.status === "APPROVED"
                        ? "text-paseo"
                        : item.status === "REJECTED"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {item.status}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
