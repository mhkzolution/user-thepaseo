"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  label: string;
  prizeType: string;
  pointAmount?: number | null;
  userCouponId?: string | null;
  rewardParticipationId?: string | null;
  onClose: () => void;
};

export default function SpinResultModal({
  open,
  label,
  prizeType,
  pointAmount,
  userCouponId,
  rewardParticipationId,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#6B7B3C]/10">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-xl font-bold text-[#6B7B3C]">ยินดีด้วย!</h2>
        <p className="mt-2 text-lg font-semibold text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">
          {prizeType === "POINTS" && pointAmount
            ? `ได้รับ ${pointAmount} พอยท์`
            : prizeType === "COUPON"
              ? "คูปองถูกเพิ่มในบัญชีของคุณแล้ว"
              : prizeType === "REWARD"
                ? "ของรางวัลถูกเพิ่มในบัญชีของคุณแล้ว"
                : "รางวัลถูกเพิ่มในบัญชีของคุณแล้ว"}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {userCouponId && (
            <Link
              href="/my-coupons"
              className="w-full rounded-full bg-[#6B7B3C] py-3 text-sm font-semibold text-white"
              onClick={onClose}
            >
              ดูคูปองของฉัน
            </Link>
          )}
          {rewardParticipationId && (
            <Link
              href="/profile/reward"
              className="w-full rounded-full bg-[#6B7B3C] py-3 text-sm font-semibold text-white"
              onClick={onClose}
            >
              ดูของรางวัลของฉัน
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
