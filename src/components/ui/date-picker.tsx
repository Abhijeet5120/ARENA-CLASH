// src/components/ui/date-picker.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import type { Matcher } from "react-day-picker"; 
import { Calendar as CalendarIcon } from "lucide-react" 

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  isPickerButtonDisabled?: boolean; 
  disabledDates?: Matcher | Matcher[]; 
  className?: string;
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date", 
  isPickerButtonDisabled, 
  disabledDates, 
  className 
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={isPickerButtonDisabled} 
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value && value instanceof Date && !isNaN(value.getTime()) ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card/90 backdrop-blur-md">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          disabled={disabledDates} 
        />
      </PopoverContent>
    </Popover>
  )
}
