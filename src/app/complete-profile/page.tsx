"use client"

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Image from 'next/image';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BannerRegister from "@/components/BannerRegister/page"

interface Interest {
  id: string;
  name: string;
}

type FormState = {
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  occupation: string;
  residenceType: string;
  houseNumber: string;
  alley: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  branchId: string;
  referralCode: string;
  interests: string[];
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [branches, setBranches] = useState<{ id: string; name: string; type: string }[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    houseNumber: "",
    alley: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    branchId: "",
    occupation: "",
    residenceType: "",
    referralCode: "",
    interests: [],
  })
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const thaiPhoneRegex = /^0[689]\d{8}$/
  const stepNames = ['ข้อมูลส่วนตัว', 'ที่อยู่', 'ข้อมูลเพิ่มเติม']

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branch");
        if (!res.ok) throw new Error("โหลดสาขาไม่สำเร็จ");
        const data = await res.json();
        setBranches(data);
      } catch (error) {
        console.error("โหลดสาขาไม่สำเร็จ:", error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.user) {
          setForm((prev) => ({
            ...prev,
            dateOfBirth: data.user.dateOfBirth || prev.dateOfBirth,
            gender: data.user.gender || prev.gender,
            phone: data.user.phone || prev.phone,
            email: data.user.email || prev.email,
            houseNumber: data.user.houseNumber || prev.houseNumber,
            alley: data.user.alley || prev.alley,
            subDistrict: data.user.subDistrict || prev.subDistrict,
            district: data.user.district || prev.district,
            province: data.user.province || prev.province,
            postalCode: data.user.postalCode || prev.postalCode,
            branchId: data.user.branchId || prev.branchId,
            occupation: data.user.occupation || prev.occupation,
            residenceType: data.user.residenceType || prev.residenceType,
            interests: data.user.interests || [],
          }));
          if (data.user.dateOfBirth) setDate(new Date(data.user.dateOfBirth));
        }
      } catch (err) {
        console.error("โหลดข้อมูล profile ล้มเหลว", err);
      }
    };
    loadProfile();
  }, [session]);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await fetch("/api/admin/interest");
        if (!res.ok) throw new Error("โหลดความสนใจไม่สำเร็จ");
        const data = await res.json();
        setInterests(data);
      } catch (error) {
        console.error("Error fetching interests:", error);
      }
    };
    fetchInterests();
  }, []);

  const toggleInterest = (id: string) => {
    setForm({
      ...form,
      interests: form.interests.includes(id)
        ? form.interests.filter((x) => x !== id)
        : [...form.interests, id],
    });
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setForm({
      ...form,
      dateOfBirth: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "phone" && !thaiPhoneRegex.test(value)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)");
    } else {
      setError("");
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !thaiPhoneRegex.test(form.phone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.interests.length) {
      setError('กรุณาเลือกความสนใจอย่างน้อยหนึ่งอย่าง');
      return;
    }

    try {
      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        router.push('/profile');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="container mx-auto h-screen overflow-hidden p-0 md:p-6 flex flex-col justify-center items-center">
      <div className="h-full w-full max-w-md mx-auto p-0 md:rounded-xl rounded-none shadow overflow-hidden">
        <div className="-mb-6" style={{ height: '25%' }}>
          <BannerRegister />
        </div>

        <div className="h-screen p-10 m-0 rounded-3xl bg-white shadow z-50 relative" style={{ height: '80%' }}>
          <div className="flex justify-center items-center gap-4 mb-5">
            <Image src="/logo-paseo-register.png" width={96} height={96} alt="ThePaseo" />
            <h2 className="text-5xl font-semibold text-center">Welcome</h2>
          </div>

          {/* Stepper */}
          <div className="flex justify-center items-center mb-8">
            {stepNames.map((name, index) => (
              <div key={index} className="flex flex-col flex-auto items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                    ${step > index + 1 ? 'text-white' : ''}
                    ${step === index + 1 ? 'text-white font-bold' : ''}
                    ${step < index + 1 ? 'text-gray-600' : ''}`}
                  style={
                    step > index + 1 ? { backgroundColor: '#9DC93C' } :
                    step === index + 1 ? { backgroundColor: '#06C755' } :
                    { backgroundColor: '#ddd' }
                  }
                >
                  {step > index + 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className={`text-sm font-medium ${step === index + 1 ? 'text-black-600' : 'text-gray-500'}`}>
                  {name}
                </div>
                {index < stepNames.length - 1 && (
                  <div className={`ml-3 flex-1 h-1 rounded-full ${step > index + 1 ? 'bg-color-paseo' : 'bg-gray-300'}`}></div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div className='flex flex-row gap-4'>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-between rounded-xl bg-gray-100 font-normal ${!date ? "text-gray-400" : ""}`}>
                        {date ? format(date, "dd MMMM yyyy", { locale: th }) : "เลือกวันเกิด *"}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-white" align="start">
                      <Calendar
                        className='w-80'
                        mode="single"
                        captionLayout="dropdown"
                        selected={date}
                        onSelect={handleDateChange}
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>

                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className="w-full rounded-xl bg-gray-100">
                      <SelectValue placeholder="เพศ *" />
                    </SelectTrigger>
                    <SelectContent className="bg-white w-full">
                      <SelectItem value="MALE">ชาย</SelectItem>
                      <SelectItem value="FEMALE">หญิง</SelectItem>
                      <SelectItem value="OTHER">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input type="tel" placeholder="เบอร์โทรศัพท์ (เช่น 0812345678)" name="phone" onChange={handleChange} value={form.phone} required />
                {error.includes("เบอร์โทร") && <p className="text-red-500 text-sm">{error}</p>}

                <Input type="email" placeholder="อีเมล *" name="email" disabled value={form.email} />
                <Select value={form.occupation} onValueChange={(v) => setForm({ ...form, occupation: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-gray-100"><SelectValue placeholder="อาชีพ *" /></SelectTrigger>
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

                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-gray-100"><SelectValue placeholder="เลือกสาขาที่ทำการสมัคร *" /></SelectTrigger>
                  <SelectContent className="bg-white w-full">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <Select value={form.residenceType} onValueChange={(v) => setForm({ ...form, residenceType: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-gray-100"><SelectValue placeholder="ประเภทที่อยู่ *" /></SelectTrigger>
                  <SelectContent className="bg-white w-full">
                    <SelectItem value="TOWNHOUSE">ทาวน์เฮาส์</SelectItem>
                    <SelectItem value="CONDO">คอนโด</SelectItem>
                    <SelectItem value="SINGLE_HOUSE">บ้านเดี่ยว</SelectItem>
                  </SelectContent>
                </Select>

                <Input name="houseNumber" placeholder="บ้านเลขที่ *" onChange={handleChange} value={form.houseNumber} />
                <Input name="alley" placeholder="ซอย *" onChange={handleChange} value={form.alley} />
                <Input name="subDistrict" placeholder="แขวง *" onChange={handleChange} value={form.subDistrict} />
                <Input name="district" placeholder="เขต *" onChange={handleChange} value={form.district} />
                <Input name="province" placeholder="จังหวัด *" onChange={handleChange} value={form.province} />
                <Input name="postalCode" placeholder="รหัสไปรษณีย์ *" onChange={handleChange} value={form.postalCode} />
              </div>
            )}

            {step === 3 && (
              <>
                <Input name="referralCode" placeholder="รหัสผู้แนะนำ (ถ้ามี)" onChange={handleChange} value={form.referralCode} />
                <p className="font-semibold mb-2 mt-4">ความสนใจ</p>
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
                            ? "bg-color-paseo text-white hover:bg-color-paseo-hover"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {i.name}
                      </Badge>
                    );
                  })}
                </div>
              </>
            )}

            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

            <div className="mt-6 flex justify-between items-center">
              {step > 1 ? (
                <button type="button" onClick={handlePrevStep} className="text-white p-3 rounded-full" style={{ backgroundColor: '#06C755' }}>
                  <FaArrowLeft />
                </button>
              ) : <div className="invisible"></div>}

              {step < 3 ? (
                <button type="button" onClick={handleNextStep} className="text-white p-3 rounded-full" style={{ backgroundColor: '#9DC93C' }}>
                  <FaArrowRight />
                </button>
              ) : (
                <button type="submit" className="text-white p-3 rounded-xl" style={{ backgroundColor: '#9DC93C' }}>
                  บันทึก
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
