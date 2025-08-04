"use client"

import { cn } from "@/lib/utils"

interface CheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function Checkbox({ id, checked, onCheckedChange, className }: CheckboxProps) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={cn("w-4 h-4 border rounded focus:ring focus:ring-[#4F7942]", className)}
    />
  )
}

