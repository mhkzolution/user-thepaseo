"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Tesseract from "tesseract.js";

interface Branch {
  id: string;
  name: string;
}

interface ReceiptHistory {
  id: string;
  imageUrl: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function UploadPage() {
  const [tab, setTab] = useState<"upload" | "history">("upload");

  const [image, setImage] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [history, setHistory] = useState<ReceiptHistory[]>([]);

  // โหลดสาขา
  useEffect(() => {
    fetch("/api/branch/list")
      .then(res => res.json())
      .then(data => setBranches(data));
  }, []);

  // โหลดประวัติ
  useEffect(() => {
    if (tab === "history") {
      fetch("/api/receipt/history")
        .then(res => res.json())
        .then(data => setHistory(data));
    }
  }, [tab]);

  function looseMatch(text: string, keyword: string) {
    const pattern = keyword
      .split("")
      .map(ch => (ch === " " ? "\\s+" : `${ch}\\s*`))
      .join("");
    return new RegExp(pattern).test(text);
  }

  const handleOCR = async (file: File) => {
    setLoading(true);
    const { data } = await Tesseract.recognize(file, "tha+eng", { logger: m => console.log(m) });
    const lines = data.text.split("\n").map(l => l.trim()).filter(Boolean);

    const targetLine = lines.find(line =>
      looseMatch(line, "จำนวนเงินรวม") ||
      looseMatch(line, "ยอดรวม") ||
      looseMatch(line, "ยอดเงินสุทธิ") ||
      looseMatch(line, "Total")
    );

    if (targetLine) {
      const match = targetLine.match(/[\d,]+(\.\d{1,2})?/);
      if (match) {
        setAmount(match[0].replace(/,/g, ""));
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!image || !amount || !branchId) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("amount", amount);
    formData.append("branchId", branchId);

    const res = await fetch("/api/receipt/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("อัปโหลดสำเร็จ");
      setImage(null);
      setAmount("");
      setBranchId("");
      setTab("history"); // อัปโหลดเสร็จแล้วไปดูประวัติ
    } else {
      alert("เกิดข้อผิดพลาด");
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 mt-0 mb-20 md:mt-20 md:mb-20 mb-4 bg-white rounded-xl">
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 p-2 ${tab === "upload" ? "border-b-2 border-blue-500 font-bold" : ""}`}
          onClick={() => setTab("upload")}
        >
          อัปโหลดใบเสร็จ
        </button>
        <button
          className={`flex-1 p-2 ${tab === "history" ? "border-b-2 border-blue-500 font-bold" : ""}`}
          onClick={() => setTab("history")}
        >
          ประวัติการอัปโหลด
        </button>
      </div>

      {/* Upload Tab */}
      {tab === "upload" && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImage(file);
              if (file) handleOCR(file);
            }}
          />

          {image && (
            <Image
              width={600}
              height={600}
              src={URL.createObjectURL(image)}
              alt="preview"
              className="w-full rounded shadow"
            />
          )}

          <div>
            <label>จำนวนเงิน</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded"
            />
            {loading && <p className="text-sm text-gray-500">กำลังอ่านข้อมูลจากรูป...</p>}
          </div>

          <div>
            <label>เลือกสาขา</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">-- เลือกสาขา --</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
          >
            {uploading ? "กำลังอัปโหลด..." : "ส่งข้อมูล"}
          </button>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="space-y-4">
          {history.length === 0 && <p className="text-gray-500">ยังไม่มีประวัติการอัปโหลด</p>}
          {history.map(item => (
            <div key={item.id} className="border p-2 rounded flex gap-4 items-center">
              <Image
                width={600}
                height={600}
                src={item.imageUrl}
                alt="receipt"
                className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <p>ยอดเงิน: {item.amount.toLocaleString()} บาท</p>
                <p>สถานะ: 
                  <span className={
                    item.status === "APPROVED" ? "text-paseo" :
                    item.status === "REJECTED" ? "text-red-600" : "text-yellow-600"
                  }>
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
  );
}
