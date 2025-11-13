// lib/validations/shopCategory.ts
import * as z from "zod";

export const shopCategorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
  slug: z
    .string()
    .min(1, "กรุณากรอก slug")
    .regex(/^[a-z0-9-]+$/, "ใช้ได้เฉพาะตัวอักษรเล็ก, ตัวเลข และขีดกลาง"),
  imageUrl: z
    .string()
    .min(1, "กรุณาใส่ URL รูปภาพ")
    .refine((val) => val.startsWith("/") || val.startsWith("http"), {
      message: "กรุณาใส่ URL รูปภาพ",
    }),
});

export type ShopCategoryFormValues = z.infer<typeof shopCategorySchema>;
