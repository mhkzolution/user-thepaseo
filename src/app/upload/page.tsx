"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BannerUpload from "@/components/BannerUpload/page";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image";
import { CiReceipt } from "react-icons/ci";
import { IoReceipt } from "react-icons/io5";
import { MdAddAPhoto } from "react-icons/md";
import { GoFileDirectoryFill } from "react-icons/go";
import { MdPictureAsPdf } from "react-icons/md";

export default function UploadPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // file input แยก 3 แบบ
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("กรุณาเลือกไฟล์");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const res = await fetch("/api/receipt/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setIsModalOpen(true);
      setFiles([]);
    } else {
      alert("บันทึกไม่สำเร็จ");
    }
    setUploading(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  useEffect(() => {
    }, [emblaApi])

  return (
    <div className="h-screen max-w-2xl mx-auto p-0 mt-0 mb-0 md:mt-20 md:mb-20 md:rounded-xl overflow-hidden">
      <div className="-mb-6">
        <BannerUpload />
      </div>

      <div className="pt-0 m-0 rounded-3xl bg-white shadow relative">
        {/* ปุ่ม Test */}
        <div className="w-full flex justify-center mb-4 -top-20 absolute flex-col items-center">
          <Button
            className="rounded-full h-40 w-40 text-xl text-center bg-paseo-hover text-paseo flex flex-col border-4 border-paseo mb-2"
            onClick={() => setShowOptions(!showOptions)}
          >
            <IoReceipt size={64} />
            <span className="text-gray-500 text-center text-sm">อัพโหลดใบเสร็จ</span>
          </Button>

            <Link href="/upload/terms">
              <span className="text-gray-500 text-center b">
                เงื่อนไขการสะสมพอยท์
              </span>
            </Link>

          {showOptions && (
            <div className="flex flex-col justify-start items-start mt-4 p-4 bg-white rounded-xl shadow-2xl z-50 relative border-2 border-paseo">
              <Button
                className="w-full py-6 flex justify-start gap-4 hover:bg-paseo-hover"
                variant="outline"
                onClick={() => {
                  setShowOptions(false);
                  cameraInputRef.current?.click();
                }}
              >
                <MdAddAPhoto size={32} />
                ถ่ายภาพ
              </Button>

              <hr className="w-full my-4 border-dotted border-t-4 border-paseo"></hr>

              <Button
                className="w-full py-6 flex justify-start gap-4 hover:bg-paseo-hover"
                variant="outline"
                onClick={() => {
                  setShowOptions(false);
                  galleryInputRef.current?.click();
                }}
              >
                <GoFileDirectoryFill size={32} />
                คลังภาพ (เลือกหลายไฟล์)
              </Button>

              <hr className="w-full my-4 border-dotted border-t-4 border-paseo"></hr>

              <Button
                className="w-full py-6 flex justify-start gap-4 hover:bg-paseo-hover"
                variant="outline"
                onClick={() => {
                  setShowOptions(false);
                  pdfInputRef.current?.click();
                }}
              >
                <MdPictureAsPdf size={32} />
                อัพโหลด PDF
              </Button>
            </div>
          )}
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={galleryInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="application/pdf"
          ref={pdfInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ส่วน preview */}
        <div
          className="space-y-4 p-10 z-60"
          style={{ paddingTop: "6.5rem" }}
        >
          <div className="mt-6 mb-6">

            <div className="embla w-full" ref={emblaRef}>
              <div className="embla__container h-full flex gap-4">
                {Array.from({ length: 10 }).map((_, i) => {
                  const file = files[i];

                  if (file) {
                    return (
                      <div
                        className="embla__slide_upload flex items-center justify-center rounded-xl w-24 h-24 bg-gray-100 overflow-hidden"
                        key={i}
                      >
                        {file.type.startsWith("image/") ? (
                          <Image
                            width={600}
                            height={600}
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="object-cover w-full h-full rounded-xl border"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-24 rounded-xl border bg-white text-gray-700 p-4">
                            <div className="text-5xl mb-2">📄</div>
                            <span className="text-sm truncate w-full text-center">
                              {file.name}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ช่องว่าง (ยังไม่ได้อัพไฟล์)
                  return (
                    <div
                      key={i}
                      className="embla__slide_upload flex items-center justify-center rounded-xl h-24 border-paseo border-2 border-dashed text-gray-400 cursor-pointer"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <CiReceipt className="text-paseo" size={40} />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full text-white px-4 py-3 rounded-full disabled:opacity-50"
            style={{ backgroundColor: "#9DC93C" }}
          >
            {uploading ? "กำลังอัปโหลด..." : "ส่งใบเสร็จ"}
          </button>

        </div>

        <div className="flex flex-col items-center relative">
            <div className="pl-10 pr-10">
              <Image
                src="/upload-terms.png"
                width={500}
                height={500}
                alt="ThePaseo"
                className="cover"
              />
            </div>

            <div className="flex flex-row relative">
              <Image
                src="/upload-l.png"
                width={500}
                height={500}
                alt="ThePaseo"
                className="cover"
              />

              <Image
                src="/upload-r.png"
                width={500}
                height={500}
                alt="ThePaseo"
                className="cover"
              />

            </div>

          </div>
      </div>

      {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
                  <h2 className="text-lg font-bold mb-2">อัพโหลดสำเร็จ</h2>
                  <p className="text-gray-600 mb-4">เจ้าหน้าที่กำลังตรวจสอบข้อมูลให้คุณ พอยท์จะถูกมอบเข้าบัญชีภายใน 24 ชั่วโมง</p>
                  <div className="flex justify-center">
                    <Button
                      onClick={handleModalClose}
                      className="text-base text-white py-3 px-4 rounded-xl bg-paseo"
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
