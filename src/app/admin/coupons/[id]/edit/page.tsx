"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor/page";
import TagSelector from "@/components/TagSelector";

type Campaign = { id: string; name: string };
type Shop = { id: string; name: string };
type Branch = { id: string; name: string };

export default function EditCouponPage() {
  const { id } = useParams();
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

  const [shops, setShops] = useState<Shop[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isRedemption, setIsRedemption] = useState<boolean>(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อมูลคูปอง
  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/coupons/${id}`);
      const data = await res.json();
      setCode(data.code || "");
      setName(data.name || "");
      setDescription(data.description || "");
      setTerms(data.terms || "");
      setPointCost(data.pointCost || 0);
      setPointEarn(data.pointEarn || 0);
      setQuantity(data.quantity || null);
      setMaxPerUser(data.maxPerUser || null);
      setStartDate(data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "");
      setEndDate(data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "");
      setExpiresAt(data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : "");
      setSelectedBranches(data.branches?.map((b: any) => b.id) || []);
      // ✅ แก้ส่วนนี้
      if (data.isRedemption) {
        // ถ้า reward เป็นจุดบริการ
        setSelectedShops(["redemption"]);
      } else {
        // ถ้าไม่ใช่ ให้ map จากร้านค้า
        setSelectedShops(data.shops?.map((s: any) => s.id) || []);
      }
      setAutoAssign(data.autoAssign || false);
      setCampaignId(data.campaignId || null);
      setExistingImage(data.imageUrl || null);
      setTags(data.tagIds || []);
    })();
  }, [id]);

  // ✅ โหลดสาขาและร้านค้า
  useEffect(() => {
    const loadData = async () => {
      try {
        const resShops = await fetch("/api/admin/shop");
        const dataShops = await resShops.json();
        setShops(Array.isArray(dataShops) ? dataShops : dataShops.shops || []);

        const resBranches = await fetch("/api/admin/branches");
        const dataBranches = await resBranches.json();
        setBranches(Array.isArray(dataBranches) ? dataBranches : dataBranches.branches || []);
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
      .then((data) => setCampaigns(data.data || []));
  }, []);

  // ✅ Preview ภาพ
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ✅ บันทึกการแก้ไข
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("terms", terms);
    formData.append("pointCost", String(pointCost));
    formData.append("pointEarn", String(pointEarn));
    if (quantity !== null) formData.append("quantity", String(quantity));
    if (maxPerUser !== null) formData.append("maxPerUser", String(maxPerUser));
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("expiresAt", expiresAt);
    formData.append("autoAssign", String(autoAssign));
    if (campaignId) formData.append("campaignId", campaignId);
    if (file) formData.append("file", file);

    selectedBranches.forEach((id) => formData.append("branchIds[]", id));
    selectedShops.forEach((id) => formData.append("shopIds[]", id));

    formData.append("tags", JSON.stringify(tags));

    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      router.push("/admin/coupons");
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">แก้ไข Coupon</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ✅ Upload */}
        <div>
          <label className="block mb-1 font-medium">รูปคูปอง</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {preview ? (
            <Image
              width={600}
              height={600}
              src={preview}
              alt="preview"
              className="h-32 mt-2 rounded-lg"
            />
          ) : existingImage ? (
            <Image
              width={600}
              height={600}
              src={existingImage}
              alt="existing"
              className="h-32 mt-2 rounded-lg"
            />
          ) : null}
        </div>

        {/* ✅ ข้อมูลทั่วไป */}
        <div>
          <label className="block mb-1 font-medium">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border p-2 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">ชื่อคูปอง</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded-lg"
            required
          />
        </div>

        {/* ✅ RichText */}
        <div>
          <label className="block mb-1 font-medium">รายละเอียด</label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <div>
          <label className="block mb-1 font-medium">เงื่อนไข</label>
          <RichTextEditor value={terms} onChange={setTerms} />
        </div>

        {/* ✅ วันที่ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>วันที่เริ่ม</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label>วันที่สิ้นสุด</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label>วันหมดอายุ</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* ✅ แต้ม */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>ใช้แต้ม (Point Cost)</label>
            <input
              type="number"
              value={pointCost}
              onChange={(e) => setPointCost(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label>ได้แต้ม (Point Earn)</label>
            <input
              type="number"
              value={pointEarn}
              onChange={(e) => setPointEarn(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        {/* ✅ จำนวนและจำกัด */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>จำนวนสูงสุด</label>
            <input
              type="number"
              value={quantity ?? ""}
              onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label>จำกัดต่อผู้ใช้</label>
            <input
              type="number"
              value={maxPerUser ?? ""}
              onChange={(e) => setMaxPerUser(e.target.value ? Number(e.target.value) : null)}
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        {/* ✅ Campaign */}
        <select
          value={campaignId || ""}
          onChange={(e) => setCampaignId(e.target.value || null)}
          className="w-full border p-2 rounded-lg"
        >
          <option value="">-- เลือก Campaign (optional) --</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* ✅ สาขา */}
        <div>
          <label className="block mb-1 font-medium">สาขา</label>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => {
              const isSelected = selectedBranches.includes(b.id);
              return (
                <span
                  key={b.id}
                  onClick={() =>
                    setSelectedBranches((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== b.id)
                        : [...prev, b.id]
                    )
                  }
                  className={`px-3 py-1 rounded-lg cursor-pointer ${
                    isSelected ? "bg-paseo text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {b.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* ✅ ร้านค้า / จุดบริการ */}
        <div>
          <label className="block mb-1 font-medium">ร้านค้า / จุดบริการ</label>
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
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              if (selected.includes("redemption")) {
                setSelectedShops(["redemption"]);
                setIsRedemption(true);
              } else {
                setSelectedShops(selected);
                setIsRedemption(false);
              }
            }}
            className="w-full border p-2 rounded-lg"
          >
            <option value="redemption">🎁 จุดบริการ (Redemption)</option>

            {shops
              .filter((s) => s.name.toLowerCase().includes(shopSearch.toLowerCase()))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <TagSelector value={tags} onChange={setTags} />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-paseo text-white rounded-lg font-semibold hover:bg-paseo-hover"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
      </form>
    </div>
  );
}
