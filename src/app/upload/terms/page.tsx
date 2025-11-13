"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import BannerUploadTerm from "@/components/BannerUploadTerm/page"; // Adjust path if needed

interface UploadTerm {
  id: string;
  description: string;
}

export default function UploadTermPage() {
  const [term, setTerm] = useState<UploadTerm>({ id: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch UploadTerm on mount
  useEffect(() => {
    const fetchTerm = async () => {
      try {
        const response = await axios.get("/api/admin/receipts/terms");
        setTerm(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load terms");
        setLoading(false);
      }
    };
    fetchTerm();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-0 mt-0 mb-20 md:mt-20 md:mb-20 mb-4 md:rounded-xl overflow-hidden">
        <div className="min-h-dvh pt-0 m-0 rounded-3xl bg-white shadow relative flex items-center justify-center">
          <div className="text-center">Loading terms...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-0 mt-0 mb-20 md:mt-20 md:mb-20 mb-4 md:rounded-xl overflow-hidden">
        <div className="min-h-dvh pt-0 m-0 rounded-3xl bg-white shadow relative flex items-center justify-center">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-0 mt-0 mb-20 md:mt-20 md:mb-20 mb-4 md:rounded-xl overflow-hidden relative">
      <div className="-mb-6 relative overflow-hidden">
        <Link href="/upload" className="absolute z-50 top-2 right-2 text-white p-2 rounded-full flex justify-center items-center bg-white shadow">
          <IoMdClose className="text-2xl text-black" />
        </Link>
        <BannerUploadTerm />
      </div>

      <div className="min-h-dvh pt-0 m-0 rounded-3xl bg-white shadow relative">
        <div className="space-y-4 p-10">
          <h3 className="text-black text-xl font-bold">เงื่อนไขการสะสมพอยท์</h3>

          {term.description ? (
            <div
              className="prose text-base mb-2 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
              dangerouslySetInnerHTML={{ __html: term.description }}
            />
          ) : (
            <p className="text-gray-500">No terms defined.</p>
          )}
        </div>
      </div>
    </div>
  );
}