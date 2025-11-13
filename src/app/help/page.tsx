'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import HeaderMobile from '@/components/HeaderMobile/page';
import { Input } from "@/components/ui/input";
import Highlighter from "react-highlight-words";
import axios from "axios";
import Loading from "@/components/loading";

interface Help {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface HelpTerms {
  id: string;
  description: string;
}

export default function HelpPage() {
  const [user, setUser] = useState<any>(null);
  const [helpterm, setHelpTerm] = useState<HelpTerms>({ id: "", description: "" });
  const [helps, setHelps] = useState<Help[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ ตรวจสอบการล็อกอิน
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else if (res.status === 401) {
          router.push("/auth/login");
        }
      } catch (err) {
        console.error("fetchProfile error:", err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // ✅ ดึงข้อมูล Help Terms (ข้อความท้ายหน้า)
  useEffect(() => {
    const fetchHelpTerm = async () => {
      try {
        const response = await axios.get("/api/admin/help/helpterms");
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
      const res = await fetch("/api/help");
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

  return (
    <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-20 md:mb-0 mb-4 rounded-xl">
          <HeaderMobile />

      <div className="relative max-w-2xl mx-auto p-0 pt-10 bg-white rounded-t-5xl rounded-b-lg shadow-md flex flex-col gap-4">
        <div className="px-4 pb-10">

          <h1 className="text-2xl font-bold mb-6 text-center">คำถามที่พบบ่อย / Help</h1>

          {/* 🔍 ช่องค้นหา */}
          <div className="mb-4">
            <Input
              placeholder="ค้นหาคำถามหรือคำตอบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 📚 Accordion แสดงคำถาม-คำตอบ */}
          <Accordion type="single" collapsible className="space-y-2">
            {filteredHelps.map((h) => (
              <AccordionItem key={h.id} value={h.id}>
                <AccordionTrigger>
                  <Highlighter
                    searchWords={[searchQuery]}
                    autoEscape={true}
                    textToHighlight={h.question}
                    highlightClassName="bg-yellow-200"
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="prose text-base mb-2 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                    dangerouslySetInnerHTML={{
                      __html:
                        h.answer ||
                        "<p class='text-gray-400'>ยังไม่มีรายละเอียด...</p>",
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}

            {filteredHelps.length === 0 && (
              <p className="text-center text-gray-500 mt-4">
                ไม่พบคำถามที่ตรงกับการค้นหา
              </p>
            )}
          </Accordion>

          {/* 📞 ส่วนติดต่อท้ายหน้า */}
          <div className="text-center pt-6 mt-8 border-t">
            <p className="mb-2 text-gray-700">
              หากยังไม่ได้คำตอบ คุณสามารถติดต่อเจ้าหน้าที่ได้โดยตรง
            </p>

            {helpterm.description ? (
              <div
                className="prose text-base text-gray-700 mb-2 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                dangerouslySetInnerHTML={{ __html: helpterm.description }}
              />
            ) : (
              <p className="text-gray-500">ยังไม่มีข้อมูลติดต่อ</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
