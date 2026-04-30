"use client"

import { useRef } from "react"

type Props = {
  value: string
  onChange: (val: string) => void
}

export default function OTPInputSimple({ value, onChange }: Props) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return

    const newValue = value.split("")
    newValue[index] = val
    const joined = newValue.join("").slice(0, 6)

    onChange(joined)

    // auto next
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!paste) return

    onChange(paste)

    paste.split("").forEach((char, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = char
      }
    })

    inputsRef.current[Math.min(paste.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {[...Array(6)].map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-12 text-center text-lg font-semibold border-2 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-paseo
                     border-gray-300 transition"
        />
      ))}
    </div>
  )
}