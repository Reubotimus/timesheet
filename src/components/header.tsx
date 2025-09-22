"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import { toggleTheme } from "@/app/actions/theme";

interface HeaderProps {
    selectedDate: Date;
    onPreviousDay: () => void;
    onNextDay: () => void;
}

export function Header({ selectedDate, onPreviousDay, onNextDay }: HeaderProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        setIsDark(html.classList.contains("dark"));
    }, []);

    const handleToggleTheme = async () => {
        const next = !isDark;
        // Persist on server via cookie
        await toggleTheme();
        // Immediate UI update without full refresh
        document.documentElement.classList.toggle("dark", next);
        setIsDark(next);
    };
    return (
        <div className="fixed top-0 left-0 right-0 z-[1100] bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80 dark:supports-[backdrop-filter]:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-12"
                    onClick={onPreviousDay}
                    aria-label="Previous day"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold dark:text-white">
                        {format(selectedDate, "EEEE, do MMMM yyyy")}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-12"
                        onClick={onNextDay}
                        aria-label="Next day"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle theme"
                        onClick={handleToggleTheme}
                    >
                        {isDark ? (
                            <Moon className="h-5 w-5 transition-transform duration-300 rotate-0" />
                        ) : (
                            <Sun className="h-5 w-5 transition-transform duration-300 rotate-180" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
