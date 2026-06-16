"use client";

import Image from "next/image";
import BackButton from "@/components/BackButton/page";
import {
  HiOutlineRefresh,
  HiOutlineLocationMarker,
  HiOutlineGift,
} from "react-icons/hi";
import { IoWalletOutline } from "react-icons/io5";
import { MdCheckCircle } from "react-icons/md";

export type CheckInSlot = {
  filled: boolean;
  date: string | null;
  isToday?: boolean;
};

export type CheckInGameUIProps = {
  name: string;
  imageUrl?: string | null;
  checkInTarget: number;
  targetSpendingAmount: number;
  checkInCount: number;
  spendingTotal: number;
  spendingComplete: boolean;
  checkInComplete: boolean;
  canClaim: boolean;
  hasClaimed: boolean;
  claiming?: boolean;
  slots: CheckInSlot[];
  prizeLabel?: string;
  shopCategoryName?: string;
  todayDailySpending?: number;
  todayDailyThreshold?: number;
  checkedInToday?: boolean;
  onClaim?: () => void;
  onViewBenefits?: () => void;
  onShowTerms?: () => void;
  showHeader?: boolean;
  compact?: boolean;
};

function ProgressRow({
  icon,
  label,
  current,
  target,
  unit,
  complete,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit: string;
  complete: boolean;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paseo text-white">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">
            {current.toLocaleString("th-TH")} / {target.toLocaleString("th-TH")} {unit}
          </p>
        </div>
        {complete && (
          <MdCheckCircle className="h-6 w-6 shrink-0 text-paseo" aria-hidden />
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-paseo transition-all duration-500"
          style={{ width: `${Math.max(pct, complete ? 100 : 4)}%` }}
        />
      </div>
    </div>
  );
}

function CheckInStamp() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="rotate-[-8deg] rounded border-2 border-dashed border-paseo/70 bg-paseo/10 px-1.5 py-0.5">
        <span className="text-[8px] font-extrabold uppercase tracking-wide text-paseo-dark">
          Check in
        </span>
      </div>
    </div>
  );
}

function TodaySlot({
  dailySpending = 0,
  dailyThreshold = 0,
  earned = false,
}: {
  dailySpending?: number;
  dailyThreshold?: number;
  earned?: boolean;
}) {
  const showDailyProgress = dailyThreshold > 0 && !earned;

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-white">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <HiOutlineLocationMarker className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-bold">วันนี้</span>
      {showDailyProgress && (
        <span className="text-[8px] font-medium leading-tight opacity-90">
          {dailySpending.toLocaleString("th-TH")}/{dailyThreshold.toLocaleString("th-TH")}
        </span>
      )}
    </div>
  );
}

export default function CheckInGameUI({
  name,
  imageUrl,
  checkInTarget,
  targetSpendingAmount,
  checkInCount,
  spendingTotal,
  spendingComplete,
  checkInComplete,
  canClaim,
  hasClaimed,
  claiming = false,
  slots,
  prizeLabel,
  shopCategoryName,
  checkedInToday = false,
  todayDailySpending = 0,
  todayDailyThreshold = 0,
  onClaim,
  onViewBenefits,
  onShowTerms,
  showHeader = true,
  compact = false,
}: CheckInGameUIProps) {
  const spendingText =
    targetSpendingAmount > 0
      ? `สะสมยอดครบ ${targetSpendingAmount.toLocaleString("th-TH")} บาท`
      : null;
  const checkInText = `Check in ครบ ${checkInTarget} ครั้ง`;
  const goalParts = [spendingText, checkInText].filter(Boolean);

  const claimLabel = hasClaimed
    ? "รับสิทธิ์แล้ว"
    : canClaim
      ? "รับสิทธิ์เลย!"
      : claiming
        ? "กำลังรับสิทธิ์..."
        : "รับสิทธิ์เลย!";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-[#f4f8eb] via-white to-[#eef5dc] ${
        compact ? "" : "min-h-screen pb-28"
      }`}
    >
      {showHeader && (
        <div className="relative z-10 px-4 pt-4">
          <div className="flex items-center justify-between">
            <BackButton className="!mb-0 rounded-full bg-white/80 p-1 shadow-sm" />
            <h1 className="text-base font-bold text-gray-900">{name}</h1>
            {onShowTerms ? (
              <button
                type="button"
                onClick={onShowTerms}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-paseo-dark shadow-sm"
                aria-label="กติกา"
              >
                i
              </button>
            ) : (
              <span className="w-9" />
            )}
          </div>
        </div>
      )}

      <div className={`relative z-10 mx-auto max-w-md space-y-4 px-4 ${showHeader ? "pt-3" : "pt-4"}`}>
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-paseo via-[#8bb83a] to-paseo-dark p-4 shadow-[0_8px_24px_rgba(104,142,34,0.25)]">
          <div
            className="pointer-events-none absolute -bottom-6 left-0 right-0 h-16 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(255,255,255,0.5) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1 space-y-2 text-white">
              {goalParts.map((part) => (
                <div key={part}>
                  {part === spendingText && spendingText ? (
                    <>
                      <p className="text-xs font-medium opacity-90">สะสมยอดครบ</p>
                      <p className="text-2xl font-extrabold leading-tight">
                        {targetSpendingAmount.toLocaleString("th-TH")} บาท
                      </p>
                    </>
                  ) : null}
                  {part === checkInText && (
                    <>
                      {spendingText && (
                        <p className="mt-1 text-xs font-medium opacity-90">และ Check in ครบ</p>
                      )}
                      {!spendingText && (
                        <p className="text-xs font-medium opacity-90">Check in ครบ</p>
                      )}
                      <p className="text-2xl font-extrabold leading-tight">
                        {checkInTarget} ครั้ง
                      </p>
                    </>
                  )}
                </div>
              ))}
              {shopCategoryName && (
                <p className="text-[10px] font-medium opacity-80">เฉพาะหมวด {shopCategoryName}</p>
              )}
              <button
                type="button"
                onClick={onClaim}
                disabled={!canClaim || hasClaimed || claiming}
                className="mt-2 rounded-full bg-[#3d5520] px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#2f4218] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claimLabel}
              </button>
            </div>

            <div className="relative h-28 w-28 shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-contain drop-shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/15">
                  <HiOutlineGift className="h-12 w-12 text-white/80" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">ความคืบหน้า</h2>
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {targetSpendingAmount > 0 && (
              <ProgressRow
                icon={<IoWalletOutline className="h-4 w-4" />}
                label="ยอดใช้จ่ายสะสม"
                current={spendingTotal}
                target={targetSpendingAmount}
                unit="บาท"
                complete={spendingComplete}
              />
            )}
            <ProgressRow
              icon={<HiOutlineLocationMarker className="h-4 w-4" />}
              label="Check in สะสม"
              current={checkInCount}
              target={checkInTarget}
              unit="ครั้ง"
              complete={checkInComplete}
            />
          </div>
        </section>

        {/* Check-in grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Check in วันนี้</h2>
            {checkedInToday && (
              <span className="flex items-center gap-1 text-xs font-medium text-paseo-dark">
                <HiOutlineRefresh className="h-3.5 w-3.5" />
                เช็คอินแล้ว
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {slots.map((slot, i) => {
              if (slot.isToday) {
                return (
                  <div
                    key={i}
                    className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-paseo shadow-md"
                  >
                    <TodaySlot
                      dailySpending={todayDailySpending}
                      dailyThreshold={todayDailyThreshold}
                      earned={checkedInToday}
                    />
                  </div>
                );
              }

              if (slot.filled) {
                return (
                  <div
                    key={i}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-gray-100 bg-[#f7f8f4] shadow-sm"
                  >
                    <CheckInStamp />
                    {slot.date && (
                      <span className="text-[9px] font-medium text-gray-600">{slot.date}</span>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="flex aspect-square flex-col rounded-2xl border border-gray-100 bg-[#fafbf7] p-2 shadow-sm"
                >
                  <span className="text-[10px] font-semibold text-gray-400">{i + 1}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-500">
            สะสมยอดใช้จ่ายต่อวันให้ครบ{" "}
            {todayDailyThreshold > 0
              ? `${todayDailyThreshold.toLocaleString("th-TH")} บาท`
              : "ตามเงื่อนไข"}{" "}
            เมื่ออนุมัติใบเสร็จแล้วจะได้ stamp วันละ 1 ครั้ง
            {!checkedInToday && todayDailyThreshold > 0 && (
              <>
                {" "}
                (วันนี้สะสมแล้ว {todayDailySpending.toLocaleString("th-TH")} บาท)
              </>
            )}
          </p>
        </section>

        {/* Rewards summary */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paseo-hover text-paseo-dark">
              <HiOutlineGift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-semibold text-gray-900">
                รับสิทธิ์เมื่อทำครบทุกเงื่อนไข
              </p>
              <ul className="space-y-1.5 text-xs text-gray-600">
                {targetSpendingAmount > 0 && (
                  <li className="flex items-center gap-2">
                    <MdCheckCircle
                      className={`h-4 w-4 shrink-0 ${spendingComplete ? "text-paseo" : "text-gray-300"}`}
                    />
                    ยอดใช้จ่ายสะสมครบ {targetSpendingAmount.toLocaleString("th-TH")} บาท
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <MdCheckCircle
                    className={`h-4 w-4 shrink-0 ${checkInComplete ? "text-paseo" : "text-gray-300"}`}
                  />
                  Check in ครบ {checkInTarget} ครั้ง
                </li>
                {prizeLabel && (
                  <li className="flex items-center gap-2 text-paseo-dark">
                    <MdCheckCircle className="h-4 w-4 shrink-0 text-paseo" />
                    รางวัล: {prizeLabel}
                  </li>
                )}
              </ul>
            </div>
            {onViewBenefits && (
              <button
                type="button"
                onClick={onViewBenefits}
                className="shrink-0 rounded-full border border-paseo px-3 py-1.5 text-[11px] font-semibold text-paseo-dark transition hover:bg-paseo-hover"
              >
                ดูสิทธิประโยชน์
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
