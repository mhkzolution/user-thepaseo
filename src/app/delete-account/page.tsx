"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import LegalPageShell from "@/components/LegalPageShell/page";
import Loading from "@/components/loading";
import { MdEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";

interface HelpTerms {
  description: string;
  email1?: string;
  email2?: string;
  email3?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
}

export default function DeleteAccountPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [helpterm, setHelpTerm] = useState<HelpTerms | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelpTerm = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/help/helpterms`);
        setHelpTerm(response.data);
      } catch {
        setHelpTerm(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchHelpTerm();
  }, [API_URL]);

  if (loading) {
    return <Loading />;
  }

  const emails = [helpterm?.email1, helpterm?.email2, helpterm?.email3].filter(Boolean) as string[];
  const phones = [helpterm?.phone1, helpterm?.phone2, helpterm?.phone3].filter(Boolean) as string[];

  return (
    <LegalPageShell title="การลบบัญชีผู้ใช้งาน (Delete Account)">
      <div className="prose prose-sm max-w-none text-gray-700 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6">
        <p className="text-sm text-gray-500">ปรับปรุงล่าสุด: 18 มิถุนายน 2026</p>

        <p>
          หน้านี้อธิบายวิธีขอลบบัญชีสมาชิก PaseoLife และข้อมูลส่วนบุคคลที่เกี่ยวข้อง
          ตามสิทธิของท่านภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          และนโยบายของ Google Play / App Store เกี่ยวกับการลบบัญชีผู้ใช้
        </p>

        <h2 className="text-base font-bold text-black mt-6">1. ใครสามารถขอลบบัญชีได้</h2>
        <ul>
          <li>เจ้าของบัญชีสมาชิก PaseoLife ที่ลงทะเบียนด้วยเบอร์โทรศัพท์หรือบัญชี LINE</li>
          <li>
            ท่านต้องเป็นผู้ที่ลงทะเบียนและใช้งานบัญชีนั้นจริง
            เจ้าหน้าที่อาจขอข้อมูลเพื่อยืนยันตัวตนก่อนดำเนินการ
          </li>
        </ul>

        <h2 className="text-base font-bold text-black mt-6">2. วิธีขอลบบัญชี</h2>
        <p>ปัจจุบันการลบบัญชีดำเนินการผ่านเจ้าหน้าที่ โดยมีขั้นตอนดังนี้:</p>
        <ol>
          <li>ติดต่อเจ้าหน้าที่ผ่านช่องทางในหัวข้อ &quot;ติดต่อเพื่อขอลบบัญชี&quot; ด้านล่าง</li>
          <li>
            ระบุข้อมูลเพื่อยืนยันตัวตน เช่น เบอร์โทรศัพท์ที่ลงทะเบียน
            อีเมล (หากมี) หรือชื่อ-นามสกุลในระบบ
          </li>
          <li>แจ้งความประสงค์ขอลบบัญชี PaseoLife และข้อมูลส่วนบุคคลที่เกี่ยวข้อง</li>
          <li>
            รอเจ้าหน้าที่ยืนยันและดำเนินการลบบัญชี
            โดยทั่วไปภายใน 30 วันทำการ นับจากวันที่ยืนยันตัวตนสำเร็จ
          </li>
        </ol>
        <p>
          หากท่านเข้าสู่ระบบด้วย LINE การลบบัญชีจะยกเลิกการเชื่อมต่อกับบัญชี LINE ในระบบสมาชิกด้วย
        </p>

        <h2 className="text-base font-bold text-black mt-6">3. สิ่งที่ควรทราบก่อนขอลบบัญชี</h2>
        <ul>
          <li>
            <strong>การลบไม่สามารถย้อนกลับได้</strong> — ข้อมูลและสิทธิประโยชน์ที่เกี่ยวข้องจะสูญหายถาวร
          </li>
          <li>
            <strong>พอยท์ (Paseopoint)</strong> — พอยท์คงเหลือทั้งหมดจะถูกยกเลิกทันทีเมื่อลบบัญชี
          </li>
          <li>
            <strong>คูปองและของรางวัล</strong> — คูปอง ของรางวัล หรือสิทธิประโยชน์ที่ยังไม่ได้ใช้
            จะไม่สามารถใช้งานต่อได้
          </li>
          <li>
            <strong>กิจกรรมและมินิเกม</strong> — สิทธิ์ที่ยังไม่ได้ใช้ในกิจกรรม แคมเปญ หรือมินิเกม
            จะถูกยกเลิก
          </li>
          <li>
            <strong>ใบเสร็จที่อัปโหลด</strong> — รูปภาพและข้อมูลใบเสร็จที่เกี่ยวข้องกับบัญชีจะถูกลบ
          </li>
          <li>
            <strong>การสมัครใหม่</strong> — หากต้องการใช้บริการอีกครั้ง ต้องลงทะเบียนเป็นสมาชิกใหม่
            และเริ่มสะสมพอยท์ใหม่ตั้งแต่ต้น
          </li>
        </ul>

        <h2 className="text-base font-bold text-black mt-6">4. ข้อมูลที่จะถูกลบ</h2>
        <p>เมื่อลบบัญชีสำเร็จ ข้อมูลต่อไปนี้จะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้:</p>
        <ul>
          <li>ข้อมูลโปรไฟล์: ชื่อ-นามสกุล วันเกิด เพศ อาชีพ ที่อยู่ สาขา ความสนใจ</li>
          <li>เบอร์โทรศัพท์ อีเมล และการเชื่อมต่อบัญชี LINE</li>
          <li>รูปโปรไฟล์และข้อมูลบัญชีสมาชิก</li>
          <li>ยอดพอยท์คงเหลือและประวัติการสะสม/ใช้พอยท์</li>
          <li>คูปอง ของรางวัล สิทธิประโยชน์ และประวัติการแลก/ใช้งาน</li>
          <li>การลงทะเบียนกิจกรรม แคมเปญ ภารกิจ มินิเกม และผลรางวัล</li>
          <li>รูปภาพใบเสร็จที่อัปโหลดและข้อมูลที่เกี่ยวข้อง</li>
          <li>รายการร้านค้าที่บันทึกเป็นรายการโปรด</li>
          <li>ข้อมูลรหัสแนะนำเพื่อน (Referral) ที่ผูกกับบัญชี</li>
        </ul>

        <h2 className="text-base font-bold text-black mt-6">5. ข้อมูลที่อาจเก็บไว้</h2>
        <p>
          แม้จะลบบัญชีแล้ว บริษัทอาจเก็บข้อมูลบางส่วนไว้ตามระยะเวลาที่กฎหมายกำหนด เช่น:
        </p>
        <ul>
          <li>บันทึกการทำธุรกรรมหรือการอนุมัติใบเสร็จเพื่อการบัญชีและการตรวจสอบ</li>
          <li>บันทึกการใช้งานที่จำเป็นต่อการป้องกันการทุจริตหรือข้อพิพาท</li>
          <li>ข้อมูลที่ต้องเก็บตามกฎหมายภาษี การบัญชี หรือคำสั่งของหน่วยงานที่มีอำนาจ</li>
        </ul>
        <p>ข้อมูลดังกล่าวจะถูกเก็บเท่าที่จำเป็นและทำให้ไม่สามารถระบุตัวตนได้เมื่อครบกำหนด</p>

        <h2 className="text-base font-bold text-black mt-6">6. ระยะเวลาดำเนินการ</h2>
        <ul>
          <li>การยืนยันตัวตน: ภายใน 3–5 วันทำการ หลังได้รับคำขอครบถ้วน</li>
          <li>การลบบัญชีและข้อมูลหลัก: ภายใน 30 วันทำการ หลังยืนยันตัวตนสำเร็จ</li>
          <li>ข้อมูลสำรองบางส่วนอาจใช้เวลานานขึ้นตามระบบจัดเก็บข้อมูล</li>
        </ul>

        <h2 className="text-base font-bold text-black mt-6">7. ติดต่อเพื่อขอลบบัญชี</h2>
        <p>กรุณาติดต่อเจ้าหน้าที่ด้วยข้อมูลต่อไปนี้:</p>
        <ul>
          <li>หัวข้อ: ขอลบบัญชี PaseoLife</li>
          <li>เบอร์โทรศัพท์ที่ลงทะเบียนในแอป</li>
          <li>ชื่อ-นามสกุล (ตามที่ลงทะเบียน)</li>
          <li>อีเมล (หากมี)</li>
        </ul>

        {helpterm?.description && (
          <div
            className="mb-4 not-prose"
            dangerouslySetInnerHTML={{ __html: helpterm.description }}
          />
        )}

        {emails.length > 0 && (
          <div className="flex flex-row items-start gap-4 mb-4 not-prose">
            <div className="p-2 bg-paseo-dark rounded-lg shrink-0">
              <MdEmail size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <p className="text-base text-gray-500 leading-none">อีเมล</p>
              {emails.map((email) => (
                <p key={email} className="font-medium leading-tight mb-1">
                  <Link className="text-black text-base" href={`mailto:${email}`}>
                    {email}
                  </Link>
                </p>
              ))}
            </div>
          </div>
        )}

        {phones.length > 0 && (
          <div className="flex flex-row items-start gap-4 mb-4 not-prose">
            <div className="p-2 bg-paseo-dark rounded-lg shrink-0">
              <FaPhone size={24} className="text-white" />
            </div>
            <div>
              <p className="text-gray-500 leading-none">เบอร์โทรศัพท์</p>
              {phones.map((phone) => (
                <p key={phone} className="text-sm font-medium leading-tight mb-1">
                  <Link className="text-black text-base" href={`tel:${phone}`}>
                    {phone}
                  </Link>
                </p>
              ))}
            </div>
          </div>
        )}

        {emails.length === 0 && phones.length === 0 && (
          <p>
            โปรดติดต่อเจ้าหน้าที่ผ่านหน้า{" "}
            <Link href="/help" className="text-paseo-dark underline">
              ช่วยเหลือ
            </Link>{" "}
            ในแอป
          </p>
        )}

        <p className="text-sm text-gray-500 mt-6">
          ดูเพิ่มเติมที่{" "}
          <Link href="/privacy" className="text-paseo-dark underline">
            นโยบายความเป็นส่วนตัว
          </Link>
          {" · "}
          <Link href="/terms" className="text-paseo-dark underline">
            ข้อกำหนดและเงื่อนไขการใช้งาน
          </Link>
        </p>
      </div>
    </LegalPageShell>
  );
}
