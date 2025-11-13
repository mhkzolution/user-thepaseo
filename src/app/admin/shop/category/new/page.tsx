"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { shopCategorySchema, ShopCategoryFormValues } from "@/lib/validations/shopCategory";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function AddCategoryPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<ShopCategoryFormValues>({
    resolver: zodResolver(shopCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: "",
    },
  });

  // 📌 อัพโหลดรูปไปที่ API /api/admin/upload
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.path) {
        form.setValue("imageUrl", data.path);
        setPreview(data.path);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ShopCategoryFormValues) => {
    try {
      const res = await fetch("/api/admin/shop/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to create category");
      router.push("/admin/shop/category");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">เพิ่มหมวดหมู่ร้านค้า</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium">ชื่อหมวดหมู่</label>
          <input
            type="text"
            {...form.register("name")}
            className="w-full border p-2 rounded"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            type="text"
            {...form.register("slug")}
            className="w-full border p-2 rounded"
          />
          {form.formState.errors.slug && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.slug.message}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium">รูปภาพ</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          {uploading && <p className="text-gray-500">กำลังอัพโหลด...</p>}
          {preview && (
            <Image
              width={600}
              height={600}
              src={preview}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-paseo text-white rounded hover:bg-paseo-hover"
          disabled={form.formState.isSubmitting}
        >
          บันทึก
        </button>
      </form>
    </div>
  );
}
