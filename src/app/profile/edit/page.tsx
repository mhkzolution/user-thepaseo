'use client';

import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import Image from "next/image";
import BackButton from '@/components/BackButton/page';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Loading from '@/components/loading';
import { CalendarIcon } from "lucide-react";

import SimpleSelect from '@/components/form/SimpleSelect'
import FormField from '@/components/form/FormField'
import ThaiAddressSelect from '@/components/address/ThaiAddressSelect'
import { Camera } from "lucide-react";

interface Interest {
  id: string;
  name: string;
}

interface ProfileForm {
  avatar: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  residenceType: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  branchId: string;
  interests: string[];
}

const GENDER_VALUES = new Set(["MALE", "FEMALE", "OTHER"]);
const OCCUPATION_VALUES = new Set([
  "STUDENT",
  "PRIVATE_EMPLOYEE",
  "STATE_ENTERPRISE",
  "FREELANCER",
  "BUSINESS_OWNER",
  "HOMEMAKER",
  "OTHER",
]);
const RESIDENCE_VALUES = new Set(["TOWNHOUSE", "CONDO", "SINGLE_HOUSE"]);

function formatDateOnlyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateOnlyToLocalDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export default function ProfileEditPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [form, setForm] = useState<ProfileForm>({
    avatar: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    residenceType: '',
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    branchId: '',
    interests: [],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  async function readResponseSafely(res: Response): Promise<any> {
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      return res.json()
    }
    const text = await res.text()
    return { error: text || "Unexpected response format" }
  }

  function sanitizeProfilePayload(input: ProfileForm) {
    const trimmed = (v: string) => (typeof v === "string" ? v.trim() : "");
    const date =
      input.dateOfBirth && !Number.isNaN(new Date(input.dateOfBirth).getTime())
        ? input.dateOfBirth
        : "";

    return {
      avatar: trimmed(input.avatar) || undefined,
      firstName: trimmed(input.firstName),
      lastName: trimmed(input.lastName),
      phone: trimmed(input.phone) || undefined,
      email: trimmed(input.email) || undefined,
      dateOfBirth: date || null,
      gender: GENDER_VALUES.has(input.gender) ? input.gender : undefined,
      occupation: OCCUPATION_VALUES.has(input.occupation)
        ? input.occupation
        : undefined,
      residenceType: RESIDENCE_VALUES.has(input.residenceType)
        ? input.residenceType
        : undefined,
      address: trimmed(input.address) || undefined,
      subDistrict: trimmed(input.subDistrict) || undefined,
      district: trimmed(input.district) || undefined,
      province: trimmed(input.province) || undefined,
      postalCode: trimmed(input.postalCode) || undefined,
      branchId: trimmed(input.branchId) || undefined,
      interests: Array.isArray(input.interests)
        ? input.interests.filter(Boolean)
        : [],
    };
  }

  const toggleInterest = (id: string) => {
    if (form.interests.includes(id)) {
      setForm({
        ...form,
        interests: form.interests.filter((x) => x !== id),
      });
    } else {
      setForm({
        ...form,
        interests: [...form.interests, id],
      });
    }
  };

  const [open, setOpen] = React.useState(false);
  const date = parseDateOnlyToLocalDate(form.dateOfBirth);

  const handleDateChange = (newDate: Date | undefined) => {
    setForm({
      ...form,
      // เก็บเป็น YYYY-MM-DD แบบ local date เพื่อกันวันถอยจาก timezone
      dateOfBirth: newDate ? formatDateOnlyLocal(newDate) : '',
    });
    setOpen(false);
  };

  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "";
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    // รองรับค่าที่ admin คืนจาก makePublicUrl เช่น /uploads/user/xxx.png
    if (avatar.startsWith("/")) return `${API_ORIGIN}${avatar}`;
    // fallback กรณี API เก่าส่งเป็น filename อย่างเดียว
    return `${API_ORIGIN}/uploads/user/${avatar}`;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    const fullName = `${form.firstName || ''}_${form.lastName || ''}`
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();

    const fileName = `${fullName}_${Date.now()}`;

    formData.append('firstName', fileName || 'user');

    const res = await fetchWithAuth(`${API_URL}/profile/avatar`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json();
    if (res.ok) {
      const nextAvatar = data.avatar || data.url || data.filename;
      setForm((prev) => ({ ...prev, avatar: nextAvatar }));
    } else {
      console.error('Upload error:', data.error);
      alert(data.error || 'อัปโหลดไม่สำเร็จ');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const userRes = await fetchWithAuth(`${API_URL}/profile`);
      const interestRes = await fetchWithAuth(`${API_URL}/interests`);
      const branchRes = await fetchWithAuth(`${API_URL}/shop/branch`);
      const userData = await readResponseSafely(userRes);
      const interestsData = await readResponseSafely(interestRes);
      const branchesData = await readResponseSafely(branchRes);

      if (userData.user) {
        setForm({
          ...form,
          avatar: userData.user.avatar ?? form.avatar,
          firstName: userData.user.firstName ?? form.firstName,
          lastName: userData.user.lastName ?? form.lastName,
          phone: userData.user.phone ?? form.phone,
          email: userData.user.email ?? form.email,
          gender: userData.user.gender ?? form.gender,
          occupation: userData.user.occupation ?? form.occupation,
          residenceType: userData.user.residenceType ?? form.residenceType,
          address: userData.user.address ?? form.address,
          subDistrict: userData.user.subDistrict ?? form.subDistrict,
          district: userData.user.district ?? form.district,
          province: userData.user.province ?? form.province,
          postalCode: userData.user.postalCode ?? form.postalCode,
          branchId: userData.user.branchId ?? form.branchId,
          dateOfBirth: userData.user.dateOfBirth
            ? formatDateOnlyLocal(new Date(userData.user.dateOfBirth))
            : '',
          interests: userData.user.interests?.map((i: any) => i.id) || [],
        });
      }
      setInterests(Array.isArray(interestsData) ? interestsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res: Response;

      try {
        const payload = sanitizeProfilePayload(form);
        // หลัก: PATCH (ถ้าฝั่ง API อนุญาต CORS method นี้)
        res = await fetchWithAuth(`${API_URL}/profile`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch (err) {
        const payload = sanitizeProfilePayload(form);
        // fallback: บาง env อนุญาตแค่ PUT ใน CORS
        res = await fetchWithAuth(`${API_URL}/profile`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsModalOpen(true); // Show modal on success
      } else {
        const data = await readResponseSafely(res);
        console.error('Update error:', data.error);
        alert(data.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push('/profile');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full max-w-2xl mx-auto pt-10 p-0 mt-0 mb-4 md:mt-0 mb-4 bg-white">
      <div className="flex flex-row justify-start relative pt-4 pb-4 pl-2 rounded-t-xl">
        <h1 className="text-xl font-bold text-paseo">แก้ไขข้อมูลส่วนตัว</h1>
      </div>

      <div className="w-full rounded-xl flex flex-row justify-center relative my-0">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">

          <div className="profile-image md:py-6 md:px-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
            <div className="mb-4 relative overflow-hidden">
              <p className="font-semibold mb-2">รูปโปรไฟล์</p>
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                  {/* รูป */}
                  {form.avatar ? (
                    <Image
                      src={getAvatarSrc(form.avatar)}
                      alt="avatar"
                      fill
                      className="rounded-full object-cover border"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      ไม่มีรูป
                    </div>
                  )}

                  {/* ปุ่ม + / กล้อง */}
                  <button
                    type="button"
                    onClick={handleClickUpload}
                    className="absolute bottom-0 right-0 bg-paseo text-white p-2 rounded-full hover:scale-105 transition"
                  >
                    <Camera size={16} />
                  </button>
                </div>

                {/* input ซ่อน */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className='flex flex-row gap-2'>
              <FormField label="ชื่อ" required>
                <Input
                  type="text"
                  placeholder="ชื่อของคุณ *"
                  name="firstName"
                  className="w-full py-1 px-2 border rounded-xl bg-white focus:outline-none focus:ring focus:ring-paseo text-xs"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="นามสกุล" required>
                <Input
                  type="text"
                  placeholder="นามสกุลของคุณ *"
                  name="lastName"
                  className="w-full py-1 px-2 border rounded-xl bg-white focus:outline-none focus:ring focus:ring-paseo text-xs"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <div className='flex flex-row gap-2'>
              <FormField label="วันเกิด" required>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between rounded-xl bg-white focus:outline-none focus:ring focus:ring-paseo text-xs font-normal py-1 px-2 border ${
                        !date ? 'text-gray-400' : ''
                      }`}
                    >
                      {date
                        ? format(date, 'dd MMMM yyyy', { locale: th })
                        : 'เลือกวันเกิด'}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white" align="start">
                    <Calendar
                      className="w-80"
                      mode="single"
                      captionLayout="dropdown"
                      selected={date}
                      onSelect={handleDateChange}
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </FormField>

              <FormField label="เพศ" required>
                <SimpleSelect
                  value={form.gender}
                  placeholder="เลือกเพศ"
                  onChange={(value) => setForm({ ...form, gender: value })}
                  options={[
                    { value: 'MALE', label: 'ชาย' },
                    { value: 'FEMALE', label: 'หญิง' },
                    { value: 'OTHER', label: 'อื่นๆ' },
                  ]}
                />
              </FormField>
            </div>

            <FormField label="เบอร์โทรศัพท์" required>
              <Input
                disabled
                type="text"
                placeholder="เบอร์โทรศัพท์ *"
                name="phone"
                className="w-full py-1 px-2 border rounded-xl focus:outline-none focus:ring focus:ring-paseo text-xs"
                value={form.phone}
                required
              />
            </FormField>

            <FormField label="อีเมล" required>
              <Input
                disabled
                type="email"
                placeholder="อีเมล *"
                name="email"
                className="w-full py-1 px-2 border rounded-xl focus:outline-none focus:ring focus:ring-paseo text-xs"
                value={form.email}
                required
              />
            </FormField>

            <FormField label="อาชีพ" required>
              <SimpleSelect
                value={form.occupation}
                placeholder="อาชีพ *"
                onChange={(value) => setForm({ ...form, occupation: value })}
                options={[
                  { value: 'STUDENT', label: 'นักศึกษา' },
                  { value: 'PRIVATE_EMPLOYEE', label: 'พนักงานเอกชน' },
                  { value: 'STATE_ENTERPRISE', label: 'พนักงานรัฐวิสาหกิจ' },
                  { value: 'FREELANCER', label: 'อาชีพอิสระ' },
                  { value: 'BUSINESS_OWNER', label: 'เจ้าของกิจการ' },
                  { value: 'HOMEMAKER', label: 'พ่อบ้าน - แม่บ้าน' },
                  { value: 'OTHER', label: 'อื่นๆ' },
                ]}
              />
            </FormField>

          </div>
          
          
          <div className="profile-address md:py-6 md:px-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
            <FormField label="เลือกประเภทที่อยู่" required>
              <SimpleSelect
                value={form.residenceType}
                placeholder="เลือกประเภทที่อยู่ *"
                onChange={(value) => setForm({ ...form, residenceType: value })}
                options={[
                  { value: 'TOWNHOUSE', label: 'ทาวน์เฮาส์' },
                  { value: 'CONDO', label: 'คอนโด' },
                  { value: 'SINGLE_HOUSE', label: 'บ้านเดี่ยว' },
                ]}
              />
            </FormField>
            
            <div>
              <FormField label="ที่อยู่" required>
                <Input
                  type="text"
                  placeholder="ที่อยู่ *"
                  name="address"
                  className="w-full py-1 px-2 mb-2 border rounded-xl bg-white focus:outline-none focus:ring focus:ring-paseo text-xs"
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  value={form.address}
                />
              </FormField>

              <ThaiAddressSelect
                  value={{
                    province: form.province,
                    district: form.district,
                    subDistrict: form.subDistrict,
                    postalCode: form.postalCode,
                  }}
                  onChange={(addr) =>
                    setForm(f => ({
                      ...f,
                      ...addr,
                    }))
                  }
                />
            </div>
          </div>

          <div className="profile-other md:py-6 md:px-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
            <FormField label="สาขาที่ทำการสมัคร" required>
              <SimpleSelect
                value={form.branchId}
                placeholder="เลือกสาขาที่ทำการสมัคร *"
                onChange={(value) => setForm({ ...form, branchId: value })}
                options={branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            </FormField>

            <div>
              <p className="text-sm block font-medium pl-2">ความสนใจ</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => {
                  const selected = form.interests.includes(i.id);
                  return (
                    <Badge
                      key={i.id}
                      onClick={() => toggleInterest(i.id)}
                      className={cn(
                        "cursor-pointer rounded-full px-2 py-1 text-xs transition",
                        selected
                          ? "bg-paseo text-white hover:bg-paseo-hover"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {i.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          

          <Button type="submit" className="w-full text-white p-3 rounded-xl bg-paseo">
            บันทึก
          </Button>
        </form>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">อัปเดตข้อมูลสำเร็จ</h2>
            <p className="text-gray-600 mb-4">ข้อมูลส่วนตัวของคุณได้รับการอัปเดตเรียบร้อยแล้ว</p>
            <div className="flex justify-end">
              <Button
                onClick={handleModalClose}
                className="text-white p-2 rounded-xl bg-paseo"
              >
                ตกลง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}