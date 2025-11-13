'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import BackButton from '@/components/BackButton/page';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Loading from '@/components/loading';
import { CalendarIcon } from "lucide-react";

interface Interest {
  id: string;
  name: string;
}

interface ProfileForm {
  avatar: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  residenceType: string;
  houseNumber: string;
  alley: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  branchId: string;
  interests: string[];
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [form, setForm] = useState<ProfileForm>({
    avatar: '',
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    residenceType: '',
    houseNumber: '',
    alley: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    branchId: '',
    interests: [],
  });

  useEffect(() => {
    const fetchInterests = async () => {
      const res = await fetch("/api/admin/interest");
      const data = await res.json();
      setInterests(data);
    };
    fetchInterests();
  }, []);

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
  const date = form.dateOfBirth ? new Date(form.dateOfBirth) : undefined;

  const handleDateChange = (newDate: Date | undefined) => {
    setForm({
      ...form,
      dateOfBirth: newDate ? newDate.toISOString() : '',
    });
    setOpen(false);
  };

  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setForm({
          ...form,
          ...data.user,
        });
        setPreview(data.user.avatar || null);
      }
    };
    fetchUser();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', form.name || 'user');

    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setForm({ ...form, avatar: data.filename });
      setPreview(`/user/profile/${data.filename}`);
    } else {
      console.error('Upload error:', data.error);
      alert(data.error || 'อัปโหลดไม่สำเร็จ');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const userRes = await fetch('/api/profile');
      const interestRes = await fetch('/api/interests');
      const branchRes = await fetch('/api/shop/branch');

      const userData = await userRes.json();
      const interestsData = await interestRes.json();
      const branchesData = await branchRes.json();

      if (userData.user) {
        setForm({
          ...form,
          ...userData.user,
          dateOfBirth: userData.user.dateOfBirth
            ? new Date(userData.user.dateOfBirth).toISOString().split('T')[0]
            : '',
          interests: userData.user.interests?.map((i: any) => i.id) || [],
        });
      }
      setInterests(interestsData);
      setBranches(branchesData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setIsModalOpen(true); // Show modal on success
    } else {
      const data = await res.json();
      console.error('Update error:', data.error);
      alert(data.error || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push('/profile'); // Redirect to /profile
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full max-w-2xl mx-auto p-0 mt-0 mb-20 md:mt-20 md:mb-20 mb-4 bg-white md:rounded-xl">
      <div className="flex flex-row justify-center relative pt-9 pb-6 bg-paseo">
        <div className="absolute left-2 top-6">
          <BackButton className="mb-4" />
        </div>
        <h1 className="text-xl font-bold text-white mb-4">แก้ไขข้อมูลส่วนตัว</h1>
      </div>

      <div className="w-full pt-4 p-4 rounded-xl bg-white -mt-5 rounded-xl shadow-sm flex flex-row justify-center relative my-4 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4 relative overflow-hidden">
            <p className="font-semibold mb-2">รูปโปรไฟล์</p>
            <div className="flex items-center gap-4">
              {form.avatar ? (
                <Image
                  width={600}
                  height={600}
                  src={
                    form.avatar.startsWith('http')
                      ? form.avatar
                      : `/user/profile/${form.avatar}`
                  }
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border"
                  onError={() => setPreview(null)}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  ไม่มีรูป
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="border p-2 rounded-lg w-full"
              />
            </div>
          </div>

          <Input
            type="text"
            placeholder="ชื่อที่แสดง *"
            name="name"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between rounded-xl bg-gray-100 font-normal ${
                    !date ? 'text-gray-400' : ''
                  }`}
                >
                  {date
                    ? format(date, 'dd MMMM yyyy', { locale: th })
                    : 'เลือกวันเกิด *'}
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

            <Select
              value={form.gender}
              onValueChange={(value) => setForm({ ...form, gender: value })}
            >
              <SelectTrigger className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo appearance-none">
                <SelectValue placeholder="เพศ *" />
              </SelectTrigger>
              <SelectContent className="bg-white w-full">
                <SelectItem value="MALE">ชาย</SelectItem>
                <SelectItem value="FEMALE">หญิง</SelectItem>
                <SelectItem value="OTHER">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            disabled
            type="text"
            placeholder="เบอร์โทรศัพท์ *"
            name="phone"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl text-gray-400 bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            value={form.phone}
            required
          />

          <Input
            disabled
            type="email"
            placeholder="อีเมล *"
            name="email"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl text-gray-400 bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            value={form.email}
            required
          />

          <Select
            value={form.occupation}
            onValueChange={(value) => setForm({ ...form, occupation: value })}
          >
            <SelectTrigger className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo appearance-none">
              <SelectValue placeholder="อาชีพ *" />
            </SelectTrigger>
            <SelectContent className="bg-white w-full">
              <SelectItem value="STUDENT">นักศึกษา</SelectItem>
              <SelectItem value="PRIVATE_EMPLOYEE">พนักงานเอกชน</SelectItem>
              <SelectItem value="STATE_ENTERPRISE">พนักงานรัฐวิสาหกิจ</SelectItem>
              <SelectItem value="FREELANCER">อาชีพอิสระ</SelectItem>
              <SelectItem value="BUSINESS_OWNER">เจ้าของกิจการ</SelectItem>
              <SelectItem value="HOMEMAKER">พ่อบ้าน - แม่บ้าน</SelectItem>
              <SelectItem value="OTHER">อื่นๆ</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={form.residenceType}
            onValueChange={(value) => setForm({ ...form, residenceType: value })}
          >
            <SelectTrigger className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo appearance-none">
              <SelectValue placeholder="ที่อยู่ *" />
            </SelectTrigger>
            <SelectContent className="bg-white w-full">
              <SelectItem value="TOWNHOUSE">ทาวเฮาส์</SelectItem>
              <SelectItem value="CONDO">คอนโด</SelectItem>
              <SelectItem value="SINGLE_HOUSE">บ้านเดี่ยว</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="บ้านเลขที่ *"
            name="houseNumber"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
            value={form.houseNumber}
          />
          <Input
            type="text"
            placeholder="ซอย *"
            name="alley"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, alley: e.target.value })}
            value={form.alley}
          />
          <Input
            type="text"
            placeholder="แขวง *"
            name="subDistrict"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, subDistrict: e.target.value })}
            value={form.subDistrict}
          />
          <Input
            type="text"
            placeholder="เขต *"
            name="district"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            value={form.district}
          />
          <Input
            type="text"
            placeholder="จังหวัด *"
            name="province"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, province: e.target.value })}
            value={form.province}
          />
          <Input
            type="text"
            placeholder="รหัสไปรษณีย์ *"
            name="postalCode"
            className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo"
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            value={form.postalCode}
          />

          <Select
            value={form.branchId}
            onValueChange={(value) => setForm({ ...form, branchId: value })}
          >
            <SelectTrigger className="w-full pt-2 pb-2 pl-4 pr-4 border rounded-xl bg-gray-100 focus:outline-none focus:ring focus:ring-paseo appearance-none">
              <SelectValue placeholder="เลือกสาขาที่ทำการสมัคร *" />
            </SelectTrigger>
            <SelectContent className="bg-white w-full">
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <p className="font-semibold mb-2">ความสนใจ</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => {
                const selected = form.interests.includes(i.id);
                return (
                  <Badge
                    key={i.id}
                    onClick={() => toggleInterest(i.id)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-sm transition",
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

          <Button type="submit" className="w-full text-white p-3 rounded-xl" style={{ backgroundColor: '#9DC93C' }}>
            บันทึก
          </Button>
        </form>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h2 className="text-lg font-bold mb-2">อัปเดตข้อมูลสำเร็จ</h2>
            <p className="text-gray-600 mb-4">ข้อมูลส่วนตัวของคุณได้รับการอัปเดตเรียบร้อยแล้ว</p>
            <div className="flex justify-end">
              <Button
                onClick={handleModalClose}
                className="text-white p-2 rounded-xl"
                style={{ backgroundColor: '#9DC93C' }}
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