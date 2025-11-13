"use client";

import { useState, useEffect } from "react"; 
import UserProfile from '@/components/UserProfile/page';
import Loading from '@/components/loading';
import HeaderMobile from '@/components/HeaderMobile/page';

import MenuProfile from '@/components/MenuProfile/page';

import { FaClock } from "react-icons/fa";
import { RiBitCoinFill } from "react-icons/ri";

import { FaReceipt } from "react-icons/fa";

type UploadReceipt = {
  id: string;
  fileUrl: string;
  amount: number;
  status: string;
  createdAt: string;
  rejectReason?: string;
  shopName?: string;
  branchName?: string;
  approvedPoints?: number;
};

export default function HistoryScorePage() {
  const [balance, setBalance] = useState(0);
  const [uploads, setUpload] = useState<UploadReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/receipt/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setBalance(data.balance || 0);
      setUpload(data.receipts || []); // ✅ ใช้ receipts จาก API
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchHistory();
}, []);

  const thaiMonths = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  const getYears = () => {
    const years = new Set<string>();
    uploads.forEach((p) => years.add(getMonthYear(p.createdAt).year));
    return Array.from(years).sort((a, b) => Number(b) - Number(a)); // เรียงจากมากไปน้อย
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  // ฟังก์ชันช่วย
  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: String(date.getMonth() + 1).padStart(2, "0"),
      year: String(date.getFullYear()),
    };
  };

  const filteredUploads = uploads.filter((p) => {
    const { month, year } = getMonthYear(p.createdAt);
    const matchesMonth = selectedMonth ? month === selectedMonth : true;
    const matchesYear = selectedYear ? year === selectedYear : true;
    return matchesMonth && matchesYear;
  });

  return (
      <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-20 md:mb-20 mb-4 rounded-xl">
          <HeaderMobile />
          
          <div className="max-w-2xl mx-auto p-0 -mb-14 md:mt-20 md:-mb-16 rounded-xl rounded-t-5xl">
            <div className="w-full pt-4 px-4 md:pt-0 md:px-20 md:pb-0">
              <UserProfile />
            </div>
          </div>
  
          <div className="w-full bg-white p-4 pt-16 md:p-10 md:pt-20 rounded-t-5xl rounded-xl">
  
            <MenuProfile />
  
            <div className="flex flex-col gap-4 pt-4">
              <h1 className="text-xl font-semibold flex-1 text-center">ประวัติการส่งใบเสร็จ</h1>

              <div className="flex flex-row gap-2 mb-4">
                <select
                  className="flex-1 p-2 rounded-xl border"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">ทุกเดือน</option>
                  {thaiMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  className="flex-1 p-2 rounded-xl border"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">ทุกปี</option>
                  {getYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 w-full">
                {filteredUploads.map((r) => (
                  <div key={r.id} className="flex flex-row items-center gap-2 p-4 rounded-xl shadow-sm bg-white border">
                    <div className="w-10%">
                      <FaReceipt size={24} className="text-paseo" />
                    </div>

                        <div className="flex flex-col w-90% gap-2">
                          <div className="w-full flex flex-row justify-between">

                            <div className="flex flex-row gap-2 w-80%">
                              <FaClock size={16} className="text-paseo" />
                              <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-row justify-start gap-2 w-20%">
                              <RiBitCoinFill size={24} className="text-paseo" style={{ color: '#FFD32C' }}/>
                              <span className="font-bold text-paseo">
                                +{r.approvedPoints ?? 0}
                              </span>
                            </div>

                          </div>

                          <div className="text-sm mb-1 text-gray-700">
                            <span>ยอดซื้อ: </span>
                            <strong>{r.amount.toLocaleString()} บาท</strong>
                          </div>

                          {r.shopName && (
                            <div className="w-full flex flex-row justify-between">
                              <span className="text-sm text-medium text-black">ร้านค้า: {r.shopName}</span>
                              <span className="text-sm text-medium text-black">สาขา: {r.branchName}</span>
                            </div>
                          )}

                          {/* ✅ แสดงสถานะ */}
                          <span
                            className={`text-sm font-semibold ${
                              r.status === "APPROVED"
                                ? "text-paseo"
                                : r.status === "REJECTED"
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                          >
                            {r.status === "APPROVED"
                              ? "อนุมัติแล้ว"
                              : r.status === "REJECTED"
                              ? "ถูกปฏิเสธ"
                              : "รอตรวจสอบ"}
                          </span>

                        {/* ✅ ถ้ามีเหตุผลการปฏิเสธ */}
                        {r.status === "REJECTED" && r.rejectReason && (
                          <p className="text-xs text-red-500 mt-1">
                            เหตุผล: {r.rejectReason}
                          </p>
                        )}

                      </div>
                    
                  </div>
                ))}
              </div>

            </div>
                  
          </div>
  
      </div>
    );
  }
