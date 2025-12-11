"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor/page";
import TagSelector from "@/components/TagSelector";

type Campaign = { id: string; name: string };
type Shop = { id: string; name: string };
type Branch = { id: string; name: string };

export default function CreateCouponPage() {
  const router = useRouter();

  const [shopSearch, setShopSearch] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [terms, setTerms] = useState("");
  const [pointCost, setPointCost] = useState(0);
  const [pointEarn, setPointEarn] = useState(0);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [maxPerUser, setMaxPerUser] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [autoAssign, setAutoAssign] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [shops, setShops] = useState<Shop[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const [tags, setTags] = useState<string[]>([]);

  // ✅ โหลดข้อมูลร้านค้า + สาขา
  useEffect(() => {
    const loadData = async () => {
      try {
        const resShops = await fetch("/api/admin/shop");
        const dataShops = await resShops.json();
        setShops(Array.isArray(dataShops) ? dataShops : dataShops.shops || []);

        const resBranches = await fetch("/api/admin/branches");
        const dataBranches = await resBranches.json();
        setBranches(
          Array.isArray(dataBranches)
            ? dataBranches
            : dataBranches.branches || []
        );
      } catch (error) {
        console.error("❌ Error fetching shops/branches:", error);
        setShops([]);
        setBranches([]);
      }
    };
    loadData();
  }, []);

  // ✅ โหลดแคมเปญ
  useEffect(() => {
    fetch("/api/admin/campaign")
      .then((res) => res.json())
      .then((data) => setCampaigns(data.data || []))
      .catch(() => setCampaigns([]));
  }, []);

  // ✅ Preview image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  // ✅ Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("terms", terms);
    formData.append("pointCost", String(pointCost));
    formData.append("pointEarn", String(pointEarn));
    if (quantity !== null) formData.append("quantity", String(quantity));
    if (maxPerUser !== null)
      formData.append("maxPerUser", String(maxPerUser));
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("expiresAt", expiresAt);
    formData.append("autoAssign", String(autoAssign));
    if (campaignId) formData.append("campaignId", campaignId);
    if (file) formData.append("file", file);

    selectedBranches.forEach((id) =>
      formData.append("branchIds[]", id)
    );
    selectedShops.forEach((id) =>
      formData.append("shopIds[]", id)
    );

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      router.push("/admin/coupons");
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">สร้าง Coupon ใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ✅ รูปภาพ */}
        <div>
          <label className="block mb-1 font-medium">รูป</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {preview && (
            <Image
              width={600}
              height={600}
              src={preview}
              alt="preview"
              className="h-32 mt-2 rounded-lg border"
            />
          )}
        </div>

        {/* ✅ ข้อมูลทั่วไป */}
        <div>
          <label className="block mb-1 font-medium">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon Code"
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">ชื่อคูปอง</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coupon Name"
            className="w-full border p-2 rounded-lg"
            required
          />
        </div>

        {/* ✅ รายละเอียด */}
        <div>
          <label className="block mb-1 font-medium">รายละเอียด</label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <div>
          <label className="block mb-1 font-medium">เงื่อนไข</label>
          <RichTextEditor value={terms} onChange={setTerms} />
        </div>

        {/* ✅ พอยต์ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">ใช้แต้ม (Point Cost)</label>
            <input
              type="number"
              value={pointCost}
              onChange={(e) => setPointCost(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">ได้แต้ม (Point Earn)</label>
            <input
              type="number"
              value={pointEarn}
              onChange={(e) => setPointEarn(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        {/* ✅ จำนวนและสิทธิ์ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">จำนวนสูงสุด (Quantity)</label>
            <input
              type="number"
              value={quantity ?? ""}
              onChange={(e) =>
                setQuantity(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">จำกัดต่อ User</label>
            <input
              type="number"
              value={maxPerUser ?? ""}
              onChange={(e) =>
                setMaxPerUser(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        {/* ✅ วันที่ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">วันที่เริ่ม</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">วันที่สิ้นสุด</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">วันหมดอายุ</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* ✅ Auto Assign + Campaign */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoAssign}
            onChange={(e) => setAutoAssign(e.target.checked)}
          />
          Auto Assign
        </label>

        <select
          value={campaignId || ""}
          onChange={(e) => setCampaignId(e.target.value || null)}
          className="w-full border p-2 rounded-lg"
        >
          <option value="">-- เลือก Campaign (ถ้ามี) --</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* ✅ Multi-select สาขา */}
        <div>
          <label className="block mb-1 font-medium">สาขา</label>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => {
              const isSelected = selectedBranches.includes(b.id);
              return (
                <span
                  key={b.id}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    isSelected
                      ? "bg-paseo text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                  onClick={() =>
                    setSelectedBranches((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== b.id)
                        : [...prev, b.id]
                    )
                  }
                >
                  {b.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* ✅ Multi-select ร้านค้า + Redemption */}
        <div>
          <label className="block mb-1 font-medium">ร้านค้า / จุดแลกรางวัล</label>

          <input
            type="text"
            placeholder="🔍 ค้นหาร้านค้า..."
            value={shopSearch}
            onChange={(e) => setShopSearch(e.target.value)}
            className="w-full border p-2 rounded-lg mb-2"
          />

          <select
            multiple
            value={selectedShops}
            onChange={(e) =>
              setSelectedShops(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className="w-full border p-2 rounded-lg"
          >
            {/* ✅ ตัวเลือกพิเศษ Redemption */}
            <option value="redemption">🎁 จุดบริการ (Redemption)</option>

            {shops
              .filter((s) =>
                s.name.toLowerCase().includes(shopSearch.toLowerCase())
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>

          <p className="text-sm text-gray-500 mt-1">
            เลือกได้หลายร้าน หรือเลือก “จุดบริการ” ถ้าไม่ได้จัดที่ร้านค้าใด
          </p>
        </div>

        <TagSelector value={tags} onChange={setTags} />

        <button
          type="submit"
          className="w-full py-3 mt-4 rounded-lg text-white font-semibold bg-paseo hover:bg-paseo-hover"
        >
          บันทึก
        </button>
      </form>
    </div>
  );
}
