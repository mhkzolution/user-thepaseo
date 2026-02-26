'use client'

import { ReactNode } from 'react'

type Props = {
  label: string
  required?: boolean
  children: ReactNode
}

export default function FormField({ label, required, children }: Props) {
  return (
    <div className="w-full flex flex-col items-start gap-1 mb-2">
      <label className="text-xs font-medium text-black border border-paseo-dark -mb-3 z-40 bg-paseo-hover border border-gray-100 py-0 px-2 ml-2 rounded-lg">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}
