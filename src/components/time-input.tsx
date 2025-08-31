"use client";

import React, { useState, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function TimeInput({
    value,
    onChange,
    placeholder,
    className,
}: TimeInputProps) {
    const [hours, setHours] = useState<string>("9");
    const [minutes, setMinutes] = useState<string>("00");
    const [period, setPeriod] = useState<"AM" | "PM">("AM");
    const [editing, setEditing] = useState<
        "none" | "hours" | "minutes" | "period"
    >("none");

    // Initialize from value synchronously to avoid flicker
    useLayoutEffect(() => {
        if (value) {
            const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
                setHours(match[1]);
                setMinutes(match[2]);
                setPeriod(match[3].toUpperCase() as "AM" | "PM");
            }
        }
        // run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Parse external updates (skip while editing)
    useEffect(() => {
        if (editing !== "none") return; // avoid prop-to-state sync while user edits
        if (value) {
            const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
                if (match[1] !== hours) setHours(match[1]);
                if (match[2] !== minutes) setMinutes(match[2]);
                if (match[3].toUpperCase() !== period)
                    setPeriod(match[3].toUpperCase() as "AM" | "PM");
            }
        }
    }, [value, editing]);

    // Update parent when internal state changes (formatted)
    useEffect(() => {
        const formattedTime = `${hours}:${minutes.padStart(2, "0")} ${period}`;
        if (formattedTime !== value && hours && minutes) {
            onChange(formattedTime);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hours, minutes, period]);

    const adjustHours = (delta: number) => {
        const currentHours = parseInt(hours) || 1;
        let newHours = currentHours + delta;
        if (newHours < 1) newHours = 12;
        if (newHours > 12) newHours = 1;
        setHours(newHours.toString());
    };

    const adjustMinutes = (delta: number) => {
        const currentMinutes = parseInt(minutes) || 0;
        let newMinutes = currentMinutes + delta * 15; // 15-minute increments
        if (newMinutes < 0) newMinutes = 45;
        if (newMinutes >= 60) newMinutes = 0;
        setMinutes(newMinutes.toString());
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        type: "hours" | "minutes",
    ) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (type === "hours") adjustHours(1);
            else adjustMinutes(1);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (type === "hours") adjustHours(-1);
            else adjustMinutes(-1);
        } else if (e.key === "Tab") {
            return;
        } else if (e.key === "Enter") {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            if (form) {
                const inputs = Array.from(
                    form.querySelectorAll("input, button, select, textarea"),
                );
                const currentIndex = inputs.indexOf(e.currentTarget);
                const nextInput = inputs[currentIndex + 1] as HTMLElement;
                if (nextInput) {
                    nextInput.focus();
                }
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Hours */}
            <div className="relative flex-shrink-0">
                <Input
                    type="text"
                    value={hours}
                    onFocus={() => setEditing("hours")}
                    onBlur={() => setEditing("none")}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (
                            val === "" ||
                            (parseInt(val) >= 1 && parseInt(val) <= 12)
                        ) {
                            setHours(val);
                        }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "hours")}
                    className="w-16 h-8 text-center text-sm pr-6"
                    placeholder={placeholder?.split(":")[0] ?? "9"}
                />
                <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => adjustHours(1)}
                        tabIndex={-1}
                    >
                        <ChevronUp className="h-2 w-2" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => adjustHours(-1)}
                        tabIndex={-1}
                    >
                        <ChevronDown className="h-2 w-2" />
                    </Button>
                </div>
            </div>

            <span className="text-sm text-gray-500">:</span>

            {/* Minutes */}
            <div className="relative flex-shrink-0">
                <Input
                    type="text"
                    value={minutes}
                    onFocus={() => setEditing("minutes")}
                    onBlur={() => {
                        setEditing("none");
                        setMinutes((m) =>
                            (m || "0").toString().padStart(2, "0"),
                        );
                    }}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (
                            val === "" ||
                            (parseInt(val) >= 0 && parseInt(val) <= 59)
                        ) {
                            setMinutes(val);
                        }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "minutes")}
                    className="w-16 h-8 text-center text-sm pr-6"
                    placeholder={
                        placeholder?.split(":")[1]?.slice(0, 2) ?? "00"
                    }
                />
                <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => adjustMinutes(1)}
                        tabIndex={-1}
                    >
                        <ChevronUp className="h-2 w-2" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => adjustMinutes(-1)}
                        tabIndex={-1}
                    >
                        <ChevronDown className="h-2 w-2" />
                    </Button>
                </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-0.5 ml-1 flex-shrink-0">
                <Button
                    type="button"
                    variant={period === "AM" ? "default" : "outline"}
                    size="sm"
                    className="h-4 text-xs px-2 py-0 min-w-[2rem]"
                    onClick={() => setPeriod("AM")}
                    onFocus={() => setEditing("period")}
                    onBlur={() => setEditing("none")}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setPeriod("PM");
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setPeriod("AM");
                        }
                    }}
                >
                    AM
                </Button>
                <Button
                    type="button"
                    variant={period === "PM" ? "default" : "outline"}
                    size="sm"
                    className="h-4 text-xs px-2 py-0 min-w-[2rem]"
                    onClick={() => setPeriod("PM")}
                    onFocus={() => setEditing("period")}
                    onBlur={() => setEditing("none")}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setPeriod("AM");
                        } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setPeriod("PM");
                        }
                    }}
                >
                    PM
                </Button>
            </div>
        </div>
    );
}
