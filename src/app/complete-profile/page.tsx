"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import Image from 'next/image';
import React from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import BannerRegister from "@/components/BannerRegister/page"
import HeaderMobile from '@/components/HeaderMobile/page';

import SimpleSelect from '@/components/form/SimpleSelect'
import BirthdaySelect, { normalizeDateOfBirth } from '@/components/form/BirthdaySelect'
import FormField from '@/components/form/FormField'
import ThaiAddressSelect from '@/components/address/ThaiAddressSelect'
import Loading from "@/components/loading"

import { FaSave } from "react-icons/fa";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

interface Interest {
  id: string;
  name: string;
}

function normalizeInterestsPayload(payload: unknown): Interest[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
    ? Array.isArray((payload as any).data)
      ? (payload as any).data
      : Array.isArray((payload as any).interests)
      ? (payload as any).interests
      : []
    : [];

  return list
    .filter((i: any) => i && typeof i.id === "string" && typeof i.name === "string")
    .map((i: any) => ({ id: i.id, name: i.name }));
}

const MIN_PAGE_LOAD_MS = 1000

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** รีทรายเมื่อ 5xx / เครือข่าย จนกว่าจะสำเร็จ — 401 ส่งกลับทันที (ไม่รีทราย) */
async function fetchUntilOk(
  url: string,
  opts?: { auth?: boolean; init?: RequestInit }
): Promise<Response> {
  let n = 0
  for (;;) {
    try {
      const res = opts?.auth
        ? await fetchWithAuth(url, opts.init ?? {}, { maxRetries: 0 })
        : await fetch(url, { cache: "no-store", ...opts?.init })
      if (res.status === 401) return res
      if (res.ok) return res
    } catch {
      /* เครือข่าย / timeout — ลองใหม่ */
    }
    const backoff = Math.min(800 + n * 300, 8000)
    await sleep(backoff)
    n += 1
  }
}

type FormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  occupation: string;
  residenceType: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  branchId: string;
  referralCode: string;
  interests: string[];
}

/** ให้ตรงกับ Prisma enum / หน้า profile/edit — กันส่ง "" ทำให้ 500 ตอน complete */
const GENDER_VALUES = new Set(["MALE", "FEMALE", "OTHER"])
const OCCUPATION_VALUES = new Set([
  "STUDENT",
  "PRIVATE_EMPLOYEE",
  "STATE_ENTERPRISE",
  "FREELANCER",
  "BUSINESS_OWNER",
  "HOMEMAKER",
  "OTHER",
])
const RESIDENCE_VALUES = new Set(["TOWNHOUSE", "CONDO", "SINGLE_HOUSE"])

function buildCompleteProfilePayload(
  form: FormState,
  interestIds: string[]
): Record<string, unknown> {
  const trim = (v: string) => (typeof v === "string" ? v.trim() : "")

  const dateOfBirth =
    form.dateOfBirth &&
    !Number.isNaN(Date.parse(form.dateOfBirth))
      ? form.dateOfBirth
      : undefined

  const payload: Record<string, unknown> = {
    firstName: trim(form.firstName) || undefined,
    lastName: trim(form.lastName) || undefined,
    interests: interestIds,
    phone: trim(form.phone) || undefined,
    email: trim(form.email) || undefined,
    address: trim(form.address) || undefined,
    subDistrict: trim(form.subDistrict) || undefined,
    district: trim(form.district) || undefined,
    province: trim(form.province) || undefined,
    postalCode: trim(form.postalCode) || undefined,
  }

  if (dateOfBirth) payload.dateOfBirth = dateOfBirth
  if (GENDER_VALUES.has(form.gender)) payload.gender = form.gender
  if (OCCUPATION_VALUES.has(form.occupation))
    payload.occupation = form.occupation
  if (RESIDENCE_VALUES.has(form.residenceType))
    payload.residenceType = form.residenceType

  const branchId = trim(form.branchId)
  if (branchId) payload.branchId = branchId

  const referralCode = trim(form.referralCode)
  if (referralCode) payload.referralCode = referralCode

  return payload
}

async function readProfileCompleteError(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") || ""
  try {
    if (ct.includes("application/json")) {
      const data = await res.json()
      const bits: string[] = []
      if (typeof data?.error === "string" && data.error) bits.push(data.error)
      if (typeof data?.message === "string" && data.message)
        bits.push(data.message)
      if (Array.isArray(data?.issues)) {
        for (const issue of data.issues) {
          if (issue?.message) bits.push(String(issue.message))
        }
      }
      if (typeof data?.details === "string" && data.details)
        bits.push(data.details)
      return bits.filter(Boolean).join(" — ")
    }
    const text = (await res.text()).trim()
    if (text && text.length < 500) return text
  } catch {
    /* ignore */
  }
  return ""
}

/** เช็คกับ /auth/register/check-phone — ข้ามเมื่อเบอร์ตรงกับที่โหลดจาก /profile (เป็นของบัญชีนี้แล้ว) */
function shouldCheckPhoneAgainstRegisterApi(
  inputPhone: string,
  savedPhoneFromProfile: string
): boolean {
  const t = inputPhone.trim()
  const s = savedPhoneFromProfile.trim()
  if (!t) return false
  if (s !== "" && t === s) return false
  return true
}

async function fetchRegisterPhoneDuplicateCheck(
  apiUrl: string,
  phone: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${apiUrl}/auth/register/check-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok === true) return { ok: true }
    return {
      ok: false,
      error:
        typeof data.error === "string" && data.error
          ? data.error
          : "ไม่สามารถใช้เบอร์โทรศัพท์นี้ได้",
    }
  } catch {
    return { ok: false, error: "ไม่สามารถตรวจสอบเบอร์โทรได้" }
  }
}

export default function CompleteProfilePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, loading: authLoading, refreshUser, setUser } = useContext(AuthContext);
  const router = useRouter()
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [branches, setBranches] = useState<{ id: string; name: string; type: string }[]>([]);
  const [originalPhone, setOriginalPhone] = useState<string>("")
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [checkingPhone, setCheckingPhone] = useState(false)
  /** เบอร์ที่ยืนยัน OTP ในขั้นตอนนี้แล้ว (สำคัญเมื่อไม่มีเบอร์ในระบบ เช่น ล็อกอิน LINE) */
  const [otpVerifiedForPhone, setOtpVerifiedForPhone] = useState("")
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [interests, setInterests] = useState<Interest[]>([]);
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
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
  const [error, setError] = useState('')
  const [addressErrors, setAddressErrors] = useState<{ province?: string; district?: string; subDistrict?: string }>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (user) return
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) router.push("/auth/login")
  }, [authLoading, user, router])

  const thaiPhoneRegex = /^0[689]\d{8}$/
  const stepNames = ['ข้อมูลส่วนตัว', 'ที่อยู่', 'ข้อมูลเพิ่มเติม']

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    const run = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) {
        router.push("/auth/login")
        return
      }

      const startedAt = Date.now()

      const [branchRes, profileRes, interestsRes] = await Promise.all([
        fetchUntilOk(`${API_URL}/branch`),
        fetchUntilOk(`${API_URL}/profile`, { auth: true }),
        fetchUntilOk(`${API_URL}/interests`),
      ])

      if (cancelled) return

      if (profileRes.status === 401) {
        router.push("/auth/login")
        return
      }

      try {
        const branchData = await branchRes.json()
        setBranches(Array.isArray(branchData) ? branchData : [])

        const data = await profileRes.json()
        if (data.user) {
          setForm((prev) => ({
            ...prev,
            firstName: data.user.firstName || prev.firstName,
            lastName: data.user.lastName || prev.lastName,
            dateOfBirth: normalizeDateOfBirth(data.user.dateOfBirth) || prev.dateOfBirth,
            gender: data.user.gender || prev.gender,
            phone: data.user.phone || prev.phone,
            email: data.user.email || prev.email,
            address: data.user.address || prev.address,
            subDistrict: data.user.subDistrict || prev.subDistrict,
            district: data.user.district || prev.district,
            province: data.user.province || prev.province,
            postalCode: data.user.postalCode || prev.postalCode,
            branchId: data.user.branchId || prev.branchId,
            occupation: data.user.occupation || prev.occupation,
            residenceType: data.user.residenceType || prev.residenceType,
            interests: data.user.interests
              ? data.user.interests.map((i: any) => i.id)
              : [],
          }))

          const savedPhone =
            typeof data.user.phone === "string" ? data.user.phone.trim() : ""
          if (savedPhone) {
            setOriginalPhone(savedPhone)
            setIsPhoneVerified(true)
          } else {
            setOriginalPhone("")
            setIsPhoneVerified(false)
            setOtpVerifiedForPhone("")
          }
        }

        const interestsRaw = await interestsRes.json()
        setInterests(normalizeInterestsPayload(interestsRaw))
      } catch {
        /* ไม่ควรถึงจุดนี้หลัง res.ok */
      }

      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_PAGE_LOAD_MS) await sleep(MIN_PAGE_LOAD_MS - elapsed)
      if (!cancelled) setInitialLoadDone(true)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, router, API_URL]);

  /** ตัด interest id ที่ไม่มีใน master (มักเกิดจากข้อมูลเก่าใน DB) — ลด Prisma 500 ตอน complete */
  useEffect(() => {
    if (interests.length === 0) return;
    const valid = new Set(interests.map((i) => i.id));
    setForm((f) => {
      const next = f.interests.filter((id) => valid.has(id));
      if (next.length === f.interests.length) return f;
      return { ...f, interests: next };
    });
  }, [interests]);

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((x) => x !== id)
        : [...prev.interests, id],
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "phone") {
      const trimmed = value.trim()
      const orig = originalPhone.trim()
      if (trimmed === orig && orig !== "") {
        setIsPhoneVerified(true)
      } else {
        setIsPhoneVerified(false)
      }
      if (!thaiPhoneRegex.test(value)) {
        setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)");
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  };

  /** แก้เบอร์หลังยืนยัน OTP แล้ว → ต้องยืนยันใหม่ */
  useEffect(() => {
    if (!otpVerifiedForPhone) return;
    if (form.phone.trim() !== otpVerifiedForPhone) {
      setOtpVerifiedForPhone("");
      setIsPhoneVerified(false);
    }
  }, [form.phone, otpVerifiedForPhone]);

  const handleNextStep = async () => {
    setError("")

    // step 1 → ตรวจ phone
    if (step === 1) {
      if (!thaiPhoneRegex.test(form.phone)) {
        setError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
        return
      }

      const trimmed = form.phone.trim()
      const saved = originalPhone.trim()
      // ไม่มีเบอร์ในระบบ (เช่น LINE): ต้องยืนยัน OTP ทุกครั้งกับเบอร์ที่กรอก
      // มีเบอร์แล้ว: เปลี่ยนเบอร์ → OTP
      const needsOtp =
        saved === ""
          ? trimmed !== otpVerifiedForPhone
          : trimmed !== saved && !isPhoneVerified

      if (needsOtp) {
        if (shouldCheckPhoneAgainstRegisterApi(trimmed, originalPhone)) {
          const dup = await fetchRegisterPhoneDuplicateCheck(
            API_URL,
            trimmed
          )
          if (!dup.ok) {
            setError(dup.error || "ไม่สามารถใช้เบอร์โทรศัพท์นี้ได้")
            return
          }
        }
        // ใช้ OTP แบบ register (ยืนยันว่าเบอร์รับ SMS ได้ + ยังไม่ถูกใช้ลงทะเบียนคนอื่น) ไม่พึ่ง /auth/verify-otp ที่ตีแบบ login
        const res = await fetch(`${API_URL}/auth/register/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "ไม่สามารถส่ง OTP ได้")
          return
        }

        setShowOtpModal(true)
        return
      }
    }

    if (step === 2) {
      const addrErr: { province?: string; district?: string; subDistrict?: string } = {}
      if (!form.province.trim()) addrErr.province = "กรุณาเลือกจังหวัด"
      if (!form.district.trim()) addrErr.district = "กรุณาเลือกเขต / อำเภอ"
      if (!form.subDistrict.trim()) addrErr.subDistrict = "กรุณาเลือกแขวง / ตำบล"
      setAddressErrors(addrErr)
      if (Object.keys(addrErr).length > 0) return
    }

    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setAddressErrors({})
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // กด Enter ในขั้น 1–2 จะ submit ฟอร์มได้ — ถ้าโหลด interests จาก /profile มาแล้ว จะผ่าน validate ส่ง API ก่อนจบ step 3
    if (step !== 3) {
      return;
    }

    const validInterestIds = new Set(interests.map((i) => i.id));
    const interestsPayload = form.interests.filter((id) =>
      validInterestIds.has(id)
    );
    if (!interestsPayload.length) {
      setError("กรุณาเลือกความสนใจอย่างน้อยหนึ่งอย่าง");
      return;
    }

    const trimmedPhone = form.phone.trim()
    const savedPhone = originalPhone.trim()
    if (savedPhone === "") {
      if (trimmedPhone !== otpVerifiedForPhone) {
        setError("กรุณายืนยันเบอร์โทรศัพท์ด้วย OTP ก่อนบันทึกข้อมูล");
        return;
      }
    } else if (trimmedPhone !== savedPhone && !isPhoneVerified) {
      setError("กรุณายืนยันเบอร์โทรศัพท์ก่อนบันทึกข้อมูล");
      return;
    }

    if (shouldCheckPhoneAgainstRegisterApi(trimmedPhone, savedPhone)) {
      const dup = await fetchRegisterPhoneDuplicateCheck(
        API_URL,
        trimmedPhone
      )
      if (!dup.ok) {
        setError(dup.error || "ไม่สามารถใช้เบอร์โทรศัพท์นี้ได้")
        return
      }
    }

    const validBranchIds = new Set(branches.map((b) => b.id))
    const branchIdTrim = form.branchId.trim()
    if (!branchIdTrim || !validBranchIds.has(branchIdTrim)) {
      setError("กรุณาเลือกสาขาที่ทำการสมัคร (หรือรอให้รายการสาขาโหลดแล้วเลือกใหม่)")
      return
    }

    if (
      !form.dateOfBirth ||
      !GENDER_VALUES.has(form.gender) ||
      !OCCUPATION_VALUES.has(form.occupation)
    ) {
      setError("ข้อมูลส่วนตัวไม่ครบ — กรุณาย้อนกลับไปกรอกให้ครบ")
      return
    }

    if (!RESIDENCE_VALUES.has(form.residenceType)) {
      setError("ที่อยู่ไม่ครบ — กรุณาย้อนกลับไปเลือกประเภทที่อยู่")
      return
    }

    if (!form.province.trim() || !form.district.trim() || !form.subDistrict.trim()) {
      setError("จังหวัด/เขต/แขวง ไม่ครบ — กรุณาย้อนกลับไปขั้นที่ 2 กรอกให้ครบ")
      return
    }

    const payload = buildCompleteProfilePayload(form, interestsPayload)

    try {
      const res = await fetchWithAuth(
        `${API_URL}/profile/complete`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { maxRetries: 4, baseDelayMs: 500 }
      )
      if (res.ok) {
        setSuccess(true);
        const trimmedPhoneAfter = form.phone.trim();
        if (user && setUser && trimmedPhoneAfter) {
          const updated = { ...user, phone: trimmedPhoneAfter };
          setUser(updated);
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch {
            /* ignore */
          }
        }
        router.push("/profile");
        void refreshUser();
      } else {
        const fromApi = await readProfileCompleteError(res)
        const genericNoise =
          !fromApi ||
          /^something went wrong$/i.test(fromApi.trim())
        const fallback500 =
          "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่ หรือเปลี่ยนความสนใจที่เลือก (หากยังไม่ได้ ติดต่อเจ้าหน้าที่)"
        let msg: string
        if (!genericNoise) {
          msg = fromApi
        } else if (res.status >= 500) {
          msg = fallback500
        } else {
          msg = fromApi || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
        }
        setError(msg);
      }
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (authLoading || !initialLoadDone) {
    return <Loading />
  }

  return (
    <div className="max-w-lg mx-auto md:py-10 md:py-0 py-6 pb-0 rounded-xl relative">

        <div className="fixed inset-x-0 top-0 overflow-hidden pt-2 pb-2 md:hidden z-50 bg-white/60 backdrop-blur-lg rounded-b-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="relative flex flex-row justify-center">

            <div className="flex flex-row justify-center gap-2 h-min">
              <Image
                src="/logo.png"
                alt="Thepaseo"
                width={40}
                height={40}
                unoptimized
                priority
              />
            </div>
    
          </div>
        </div>

        <div className="md:pt-4 pt-10 mb-0 py-4 px-4 md:px-4">
          <BannerRegister />
        </div>

        <div className="md:p-10 p-4 m-0 md:mb-20 rounded-xl bg-white shadow z-50 relative">
          <div className="flex justify-center items-center gap-4 mb-2">
            <Image
              src="/logo-paseo-register.png"
              width={46}
              height={46}
              unoptimized
              priority
              alt="ThePaseo"
            />
            <h2 className="text-xl font-semibold text-center">ข้อมูลเพิ่มเติม</h2>
          </div>

          {/* Stepper */}
          <div className="flex justify-center items-center mb-4">
            {stepNames.map((name, index) => (
              <div key={index} className="flex flex-col flex-auto items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                    ${step > index + 1 ? 'text-white' : ''}
                    ${step === index + 1 ? 'text-white font-bold' : ''}
                    ${step < index + 1 ? 'text-gray-600' : ''}`}
                  style={
                    step > index + 1 ? { backgroundColor: '#9DC93C' } :
                    step === index + 1 ? { backgroundColor: '#688e22' } :
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
                <div className={`text-xs font-medium ${step === index + 1 ? 'text-black-600' : 'text-gray-500'}`}>
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
              <div className="flex flex-col gap-0 pb-16">
                <div className='flex flex-row gap-2'>
                  <FormField label="ชื่อ" required>
                    <Input
                      type="text"
                      placeholder="ชื่อของคุณ *"
                      name="firstName"
                      className="w-full py-1 px-2 border rounded-lg bg-white text-xs"
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
                      className="w-full py-1 px-2 border rounded-lg bg-white text-xs"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="วันเกิด" required>
                  <BirthdaySelect
                    value={form.dateOfBirth}
                    onChange={(dateOfBirth) =>
                      setForm((prev) => ({ ...prev, dateOfBirth }))
                    }
                  />
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

                <FormField label="เบอร์โทรศัพท์" required>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="เบอร์โทรศัพท์ (เช่น 0812345678)"
                    name="phone"
                    onChange={handleChange}
                    onBlur={async () => {
                      if (!thaiPhoneRegex.test(form.phone)) return
                      if (
                        !shouldCheckPhoneAgainstRegisterApi(
                          form.phone,
                          originalPhone
                        )
                      )
                        return
                      setCheckingPhone(true)
                      try {
                        const result = await fetchRegisterPhoneDuplicateCheck(
                          API_URL,
                          form.phone.trim()
                        )
                        if (!result.ok)
                          setError(
                            result.error || "ไม่สามารถใช้เบอร์โทรศัพท์นี้ได้"
                          )
                      } finally {
                        setCheckingPhone(false)
                      }
                    }}
                    className="w-full py-4 px-4 border rounded-lg bg-white text-sm"
                    value={form.phone}
                    required
                  />
                  {error &&
                    (error.includes("เบอร์โทร") ||
                      error.includes("เบอร์นี้") ||
                      error.includes("บัญชีอื่น")) && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                  {!error && checkingPhone && (
                    <p className="text-gray-500 text-sm">
                      กำลังตรวจสอบเบอร์โทร...
                    </p>
                  )}
                </FormField>

                

                <FormField label="อีเมล" required>
                  <Input
                    disabled
                    type="email"
                    placeholder="อีเมล *"
                    name="email"
                    className="w-full py-4 px-4 border bg-gray-100 rounded-lg text-sm"
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
                
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-0 pb-20">
                <FormField label="ประเภทที่อยู่" required>
                  <SimpleSelect
                    value={form.residenceType}
                    placeholder="ประเภทที่อยู่ *"
                    onChange={(value) => setForm({ ...form, residenceType: value })}
                    options={[
                      { value: 'TOWNHOUSE', label: 'ทาวน์เฮาส์' },
                      { value: 'CONDO', label: 'คอนโด' },
                      { value: 'SINGLE_HOUSE', label: 'บ้านเดี่ยว' },
                    ]}
                  />
                </FormField>

                <FormField label="ที่อยู่">
                  <Input
                    type="text"
                    placeholder="ที่อยู่"
                    name="address"
                    className="w-full py-4 px-4 border rounded-lg bg-white text-sm mb-2"
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    value={form.address}
                  />
                </FormField>
    
                <ThaiAddressSelect
                  required
                  errors={addressErrors}
                  value={{
                    province: form.province,
                    district: form.district,
                    subDistrict: form.subDistrict,
                    postalCode: form.postalCode,
                  }}
                  onChange={(addr) => {
                    setForm(f => ({ ...f, ...addr }))
                    setAddressErrors(prev => {
                      const next = { ...prev }
                      if (addr.province !== undefined) delete next.province
                      if (addr.district !== undefined) delete next.district
                      if (addr.subDistrict !== undefined) delete next.subDistrict
                      return next
                    })
                  }}
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4 pb-10">
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
                          "cursor-pointer rounded-lg px-3 py-1 text-xs transition",
                          selected
                            ? "bg-paseo text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {i.name}
                      </Badge>
                    );
                  })}
                </div>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
              </div>
            )}

            <div className="md:relative fixed bottom-0 left-0 px-4 py-2 w-full flex justify-between items-center bg-white/60 backdrop-blur-lg rounded-t-xl shadow-lg md:shadow-none border md:border-none md:mt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-40% text-sm text-white px-2 pl-4 py-2 rounded-full flex flex-row gap-2 items-center justify-between shadow bg-paseo-dark shadow"
                >
                  ย้อนกลับ
                  <FaArrowLeft color="#000" className="bg-white rounded-full p-1" size={24} />
                </button>
              ) : <div className="invisible"></div>}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                 className="w-40% text-sm text-white px-2 pr-4 py-2 rounded-full flex flex-row gap-2 items-center justify-between shadow bg-paseo shadow"
                >
                  <FaArrowRight color="#000" className="bg-white rounded-full p-1" size={24} />
                  ถัดไป
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-40% text-sm text-white px-2 pr-4 py-2 rounded-full flex flex-row gap-2 items-center justify-between shadow bg-paseo shadow"
                >
                  <FaSave color="#000" className="bg-white rounded-full p-1" size={24} />
                  บันทึก
                </button>
              )}
            </div>
          </form>

          {showOtpModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs overlay p-4"
            >
              <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm">
                <h3 className="text-lg font-semibold mb-2 text-center">
                  ยืนยันเบอร์โทรศัพท์
                </h3>

                <p className="text-sm text-gray-600 text-center mb-4">
                  ส่งรหัส OTP ไปที่ <strong>{form.phone}</strong>
                </p>

                <Input
                  placeholder="กรอกรหัส OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value)
                    setOtpError("")
                  }}
                />

                {otpError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{otpError}</p>
                )}

                <div className="relative w-full flex justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    className="bg-gray-200"
                    onClick={() => setShowOtpModal(false)}
                  >
                    ยกเลิก
                  </Button>

                  <Button
                    className="bg-paseo"
                    onClick={async () => {
                      const res = await fetch(
                        `${API_URL}/auth/register/verify-otp`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            phone: form.phone,
                            otp,
                          }),
                        }
                      )

                      const data = await res.json()

                      if (!res.ok) {
                        setOtpError(data.error || "OTP ไม่ถูกต้อง")
                        return
                      }

                      setOtpVerifiedForPhone(form.phone.trim())
                      setIsPhoneVerified(true)
                      setShowOtpModal(false)
                      setStep(2)
                    }}
                  >
                    ยืนยัน OTP
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}