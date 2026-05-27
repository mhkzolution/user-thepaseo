'use client'

import { useEffect, useState } from 'react'

const THAI_MONTHS = [
  { value: '1', label: 'มกราคม' },
  { value: '2', label: 'กุมภาพันธ์' },
  { value: '3', label: 'มีนาคม' },
  { value: '4', label: 'เมษายน' },
  { value: '5', label: 'พฤษภาคม' },
  { value: '6', label: 'มิถุนายน' },
  { value: '7', label: 'กรกฎาคม' },
  { value: '8', label: 'สิงหาคม' },
  { value: '9', label: 'กันยายน' },
  { value: '10', label: 'ตุลาคม' },
  { value: '11', label: 'พฤศจิกายน' },
  { value: '12', label: 'ธันวาคม' },
] as const

const MIN_CE_YEAR = 1950

function getDaysInMonth(month: number, year: number): number {
  if (!month || !year) return 31
  return new Date(year, month, 0).getDate()
}

/** แปลงค่าจาก API (YYYY-MM-DD หรือ ISO datetime) เป็น YYYY-MM-DD */
export function normalizeDateOfBirth(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed.split(' ')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): { day: string; month: string; yearBe: string } {
  const normalized = normalizeDateOfBirth(iso)
  if (!normalized) return { day: '', month: '', yearBe: '' }
  const [y, m, d] = normalized.split('-').map(Number)
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    y < 1000 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return { day: '', month: '', yearBe: '' }
  }
  return {
    day: String(d),
    month: String(m),
    yearBe: String(y + 543),
  }
}

function toIsoDate(day: string, month: string, yearBe: string): string {
  if (!day || !month || !yearBe) return ''
  const ceYear = Number(yearBe) - 543
  const m = Number(month)
  let d = Number(day)
  if (!Number.isFinite(ceYear) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  if (ceYear < MIN_CE_YEAR || m < 1 || m > 12 || d < 1) return ''

  const maxDay = getDaysInMonth(m, ceYear)
  if (d > maxDay) d = maxDay

  const y = String(ceYear)
  const mo = String(m).padStart(2, '0')
  const da = String(d).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

function buildYearOptions(): { value: string; label: string }[] {
  const currentBe = new Date().getFullYear() + 543
  const minBe = MIN_CE_YEAR + 543
  const options: { value: string; label: string }[] = []
  for (let be = currentBe; be >= minBe; be--) {
    options.push({ value: String(be), label: String(be) })
  }
  return options
}

const YEAR_OPTIONS = buildYearOptions()

const selectClass =
  'w-full pt-2 pb-2 pl-3 pr-8 border rounded-lg bg-white text-xs text-center appearance-none ' +
  'focus-visible:border-ring focus-visible:ring-paseo focus-visible:ring-[2px] ' +
  'disabled:bg-gray-200 disabled:text-gray-400'

type Props = {
  value: string
  onChange: (isoDate: string) => void
}

/**
 * เก็บ วัน/เดือน/ปี ใน state ภายใน — ไม่ส่ง onChange('') ระหว่างเลือกไม่ครบ
 * (กันหน้า controlled ได้ค่าว่างแล้ว <select> แสดงแค่ placeholder)
 */
export default function BirthdaySelect({ value, onChange }: Props) {
  const parsed = parseIsoDate(value)
  const [day, setDay] = useState(parsed.day)
  const [month, setMonth] = useState(parsed.month)
  const [yearBe, setYearBe] = useState(parsed.yearBe)

  useEffect(() => {
    const p = parseIsoDate(value)
    if (p.day && p.month && p.yearBe) {
      setDay(p.day)
      setMonth(p.month)
      setYearBe(p.yearBe)
    }
  }, [value])

  const ceYear = yearBe ? Number(yearBe) - 543 : 0
  const daysInMonth = getDaysInMonth(Number(month), ceYear)

  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => {
    const n = i + 1
    return { value: String(n), label: String(n) }
  })

  const commit = (nextDay: string, nextMonth: string, nextYearBe: string) => {
    let d = nextDay
    const m = Number(nextMonth)
    const yCe = nextYearBe ? Number(nextYearBe) - 543 : 0
    if (m && yCe && d) {
      const max = getDaysInMonth(m, yCe)
      if (Number(d) > max) d = String(max)
    }
    setDay(d)
    setMonth(nextMonth)
    setYearBe(nextYearBe)
    const iso = toIsoDate(d, nextMonth, nextYearBe)
    if (iso) onChange(iso)
  }

  return (
    <div className="flex flex-row gap-2 w-full">
      <div className="w-[72px] shrink-0">
        <select
          value={day}
          onChange={(e) => commit(e.target.value, month, yearBe)}
          className={selectClass}
          aria-label="วัน"
        >
          <option value="" disabled>
            วัน
          </option>
          {dayOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 flex-1">
        <select
          value={month}
          onChange={(e) => commit(day, e.target.value, yearBe)}
          className={selectClass}
          aria-label="เดือน"
        >
          <option value="" disabled>
            เดือน
          </option>
          {THAI_MONTHS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-[88px] shrink-0">
        <select
          value={yearBe}
          onChange={(e) => commit(day, month, e.target.value)}
          className={selectClass}
          aria-label="ปี พ.ศ."
        >
          <option value="" disabled>
            ปี
          </option>
          {YEAR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
