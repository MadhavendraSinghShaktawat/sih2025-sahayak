"use client"

import * as React from "react"
import { AnimatedOTPInput } from "@/components/smoothui/ui/AnimatedOTPInputs"

export function RoomPassInput({
  value,
  onChange,
  onComplete,
}: {
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}) {
  return (
    <AnimatedOTPInput
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
    />
  )
}

export default RoomPassInput


