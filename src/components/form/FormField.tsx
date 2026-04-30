'use client'

import { ReactNode } from 'react'

type Props = {
  label: string
  required?: boolean
  children: ReactNode
}

export default function FormField({ label, required, children }: Props) {
  return (
    <div className="w-full flex flex-col items-start gap-0 mb-0">
      <label className="text-sm block font-medium pl-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}