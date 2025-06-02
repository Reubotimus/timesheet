"use client"
import ReactDatePicker from "react-datepicker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

import "react-datepicker/dist/react-datepicker.css"

export interface CalendarProps {
    selected?: Date
    onSelect?: (date: Date | null) => void
    disabled?: boolean
    className?: string
    showOutsideDays?: boolean
    mode?: "single" | "range" | "multiple"
    defaultMonth?: Date
    numberOfMonths?: number
    fromDate?: Date
    toDate?: Date
}

function Calendar({
    selected,
    onSelect,
    disabled,
    className,
    numberOfMonths = 1,
    fromDate,
    toDate,
}: CalendarProps) {
    // Handle selection based on mode
    const handleChange = (date: Date | null) => {
        onSelect?.(date)
    }

    return (
        <ReactDatePicker
            selected={selected}
            onChange={handleChange}
            inline
            disabled={disabled}
            monthsShown={numberOfMonths}
            minDate={fromDate}
            maxDate={toDate}
            showPopperArrow={false}
            formatWeekDay={() => ""} // Hide weekday names
            calendarStartDay={0}
            showFullMonthYearPicker
            className={cn("!border-none", className)}
            renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
            }) => (
                <div className="flex items-center justify-between px-2 py-2">
                    <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-50 hover:opacity-100 disabled:opacity-30",
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm font-medium">
                        {date.toLocaleString("default", { month: "long", year: "numeric" })}
                    </div>
                    <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-50 hover:opacity-100 disabled:opacity-30",
                        )}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
            dayClassName={(date) => {
                const isToday = new Date().toDateString() === date.toDateString()
                return cn("rounded-md hover:bg-accent", isToday && "bg-accent border border-primary")
            }}
        />
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
