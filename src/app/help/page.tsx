'use client';

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderMobile from '@/components/HeaderMobile/page';
import { Input } from "@/components/ui/input";
import Highlighter from "react-highlight-words";
import axios from "axios";
import Loading from "@/components/loading";
import SimpleAccordion from "@/components/SimpleAccordion";

import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { CiSearch, CiCircleRemove } from 'react-icons/ci';

interface Help {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface HelpTerms {
  description: string;

  email1?: string;
  email2?: string;
  email3?: string;

  phone1?: string;
  phone2?: string;
  phone3?: string;
}

export default function HelpPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { user, loading } = useContext(AuthContext);
  const [helpterm, setHelpTerm] = useState<HelpTerms>({
    description: "",
    email1: "",
    email2: "",
    email3: "",
    phone1: "",
    phone2: "",
    phone3: "",
  });
  const [helps, setHelps] = useState<Help[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  const emails = [helpterm.email1, helpterm.email2, helpterm.email3].filter(
    Boolean
  );

  const phones = [helpterm.phone1, helpterm.phone2, helpterm.phone3].filter(
    Boolean
  );

  // ✅ ดึงข้อมูล Help Terms (ข้อความท้ายหน้า)
  useEffect(() => {
    const fetchHelpTerm = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/help/helpterms`);
        setHelpTerm(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHelpTerm();
  }, []);

  // ✅ ดึงข้อมูล Help ทั้งหมด
  useEffect(() => {
    const fetchHelps = async () => {
      const res = await fetch(`${API_URL}/help`);
      const data = await res.json();
      // เรียงลำดับตาม order และแสดงเฉพาะ isActive = true
      const sorted = data
        .filter((h: Help) => h.isActive)
        .sort((a: Help, b: Help) => (a.order ?? 0) - (b.order ?? 0));
      setHelps(sorted);
    };
    fetchHelps();
  }, []);

  // ✅ ฟิลเตอร์ด้วย search
  const filteredHelps = useMemo(() => {
    return helps.filter(
      (h) =>
        h.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [helps, searchQuery]);

  if (loading) return <Loading />;
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-0 mb-20 md:mt-10 md:mb-4 mb-4 rounded-xl">
      <HeaderMobile />

      <div className="md:mt-16 mt-0 mb-0 md:pt-4 pt-16">
        <div className="relative max-w-2xl mx-auto md:pt-10 py-8 md:px-8 px-4 md:mt-0 mt-0 bg-white rounded-3xl shadow-md flex flex-col gap-4">
          <div className="px-4 pt-0 md:px-10 md:pt-0">
            <div className="flex flex-row gap-2 px-4">
              <span className="text-base font-bold">คำถามที่พบบ่อย / Help</span>
            </div>
          </div>

          {/* 🔍 ช่องค้นหา */}
          <div className="flex flex-col gap-4 px-4">

            <div className="px-4 pt-0 md:px-10 md:pt-0 mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาคำถามหรือคำตอบ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 p-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-paseo pl-10 pr-10"
                />

                <CiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <CiCircleRemove size={20} />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* 📚 Accordion แสดงคำถาม-คำตอบ */}
          <SimpleAccordion
            items={filteredHelps.map((h) => ({
              id: h.id,
              title: (
                <Highlighter
                  searchWords={[searchQuery]}
                  autoEscape
                  textToHighlight={h.question}
                  highlightClassName="bg-yellow-300 rounded-sm"
                />
              ),
              content: (
                <div
                  className="prose text-sm prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                  dangerouslySetInnerHTML={{
                    __html:
                      h.answer ||
                      "<p class='text-gray-400'>ยังไม่มีรายละเอียด...</p>",
                  }}
                />
              ),
            }))}
          />

          {/* 📞 ส่วนติดต่อท้ายหน้า */}
          <div className="pt-4 mt-4 border-t flex flex-col">
            <div className="mb-4">
              <p className="text-sm text-center text-gray-700">
                หากยังไม่ได้คำตอบ
              </p>

              <p className="text-sm text-center text-gray-700">
                คุณสามารถติดต่อเจ้าหน้าที่ได้โดยตรง
              </p>
            </div>
            

            {helpterm.description ? (
              <div
                className="prose text-base text-gray-700 mb-4 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                dangerouslySetInnerHTML={{ __html: helpterm.description }}
              />
            ) : (
              <p className="text-gray-500">ยังไม่มีข้อมูลติดต่อ</p>
            )}


            {emails.length > 0 && (
              <div className="flex flex-row items-start gap-4 mb-4">
                <div className="p-2 bg-paseo-dark rounded-lg">
                  <MdEmail size={24} className="text-white" />
                </div>

                <div className="flex flex-col">
                  <p className="text-base text-gray-500 leading-none">อีเมล</p>
                  {emails.map((email, index) => (
                    <p
                      key={index}
                      className="font-medium leading-tight mb-1"
                    >
                      <Link className="text-black text-base" href={`mailto:${email}`}>{email}</Link>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {phones.length > 0 && (
              <div className="flex flex-row items-start gap-4 mb-2">
                <div className="p-2 bg-paseo-dark rounded-lg">
                  <FaPhone size={24} className="text-white" />
                </div>

                <div>
                  <p className="text-gray-500 leading-none">เบอร์โทรศัพท์</p>
                  {phones.map((phone, index) => (
                    <p
                      key={index}
                      className="text-sm font-medium leading-tight mb-1"
                    >
                      <Link className="text-black text-base" href={`tel:${phone}`}>{phone}</Link>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
