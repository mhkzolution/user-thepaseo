const REVIEWER_PHONE = process.env.REVIEWER_PHONE ?? "0123456789"
const REVIEWER_OTP = process.env.REVIEWER_OTP ?? "123456"

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("66") && digits.length === 11) {
    return "0" + digits.slice(2)
  }
  return digits
}

export function isReviewerPhone(phone: string): boolean {
  return normalizePhone(phone) === REVIEWER_PHONE
}

export function isReviewerBypass(phone: string, otp: string): boolean {
  return isReviewerPhone(phone) && otp === REVIEWER_OTP
}
