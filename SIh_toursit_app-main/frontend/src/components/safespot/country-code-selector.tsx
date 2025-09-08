"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const countryCodes = [
  { code: "+91", name: "India (+91)" },
  { code: "+1", name: "United States (+1)" },
  { code: "+44", name: "United Kingdom (+44)" },
  { code: "+61", name: "Australia (+61)" },
  { code: "+81", name: "Japan (+81)" },
  { code: "+86", name: "China (+86)" },
  { code: "+49", name: "Germany (+49)" },
  { code: "+33", name: "France (+33)" },
  { code: "+39", name: "Italy (+39)" },
  { code: "+82", name: "South Korea (+82)" },
  { code: "+65", name: "Singapore (+65)" },
  { code: "+60", name: "Malaysia (+60)" },
  { code: "+66", name: "Thailand (+66)" },
  { code: "+92", name: "Pakistan (+92)" },
  { code: "+880", name: "Bangladesh (+880)" },
  { code: "+977", name: "Nepal (+977)" },
  { code: "+94", name: "Sri Lanka (+94)" },
  { code: "+971", name: "UAE (+971)" },
  { code: "+966", name: "Saudi Arabia (+966)" },
  { code: "+234", name: "Nigeria (+234)" },
  { code: "+27", name: "South Africa (+27)" },
  { code: "+55", name: "Brazil (+55)" },
  { code: "+52", name: "Mexico (+52)" },
  { code: "+7", name: "Russia (+7)" },
  { code: "+34", name: "Spain (+34)" },
  { code: "+31", name: "Netherlands (+31)" },
  { code: "+46", name: "Sweden (+46)" },
  { code: "+47", name: "Norway (+47)" },
  { code: "+45", name: "Denmark (+45)" },
  { code: "+358", name: "Finland (+358)" },
]

export function CountryCodeSelector({
  value,
  onValueChange,
  className,
}: {
  value?: string
  onValueChange: (value: string) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select country code" />
      </SelectTrigger>
      <SelectContent>
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}