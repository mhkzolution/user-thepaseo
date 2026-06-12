"use client";

import { useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import JsBarcode from "jsbarcode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RedeemCodeTabsProps {
  redeemCode: string | null | undefined;
  className?: string;
}

export default function RedeemCodeTabs({ redeemCode, className = "" }: RedeemCodeTabsProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const code = redeemCode?.trim() || "";

  useEffect(() => {
    if (!barcodeRef.current || !code) return;

    try {
      JsBarcode(barcodeRef.current, code, {
        format: "CODE128",
        width: code.length > 12 ? 1.5 : 2,
        height: 64,
        displayValue: true,
        fontSize: 14,
        margin: 8,
        background: "transparent",
      });
    } catch {
      barcodeRef.current.innerHTML = "";
    }
  }, [code]);

  if (!code) {
    return (
      <div className={`bg-paseo-hover rounded-xl py-6 text-center ${className}`}>
        <p className="text-black text-sm mb-1">รหัสสำหรับใช้คูปอง</p>
        <p className="text-lg text-gray-500">ไม่มีรหัส</p>
      </div>
    );
  }

  return (
    <div className={`bg-paseo-hover rounded-xl py-4 px-3 ${className}`}>
      <p className="text-black text-sm mb-3 text-center">รหัสสำหรับใช้คูปอง</p>

      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/60">
          <TabsTrigger value="code" className="text-xs sm:text-sm">
            Code
          </TabsTrigger>
          <TabsTrigger value="barcode" className="text-xs sm:text-sm">
            Barcode
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="text-xs sm:text-sm">
            QR Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4">
          <div className="flex items-center justify-center min-h-[80px] px-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tracking-wider break-all text-center">
              {code}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="barcode" className="mt-4">
          <div className="flex items-center justify-center min-h-[80px] overflow-x-auto bg-white rounded-lg py-3">
            <svg ref={barcodeRef} />
          </div>
        </TabsContent>

        <TabsContent value="qrcode" className="mt-4">
          <div className="flex items-center justify-center min-h-[80px] bg-white rounded-lg py-4">
            <QRCode value={code} size={Math.min(160, Math.max(120, code.length * 4))} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
