"use client";

import { useEffect } from "react";
import { toggleTheme } from "@/app/actions/theme";

interface UseKeyboardShortcutsProps {
    onPreviousDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onCreateTask: () => void;
    onUnselectTask: () => void;
}

export function useKeyboardShortcuts({
    onPreviousDay,
    onNextDay,
    onToday,
    onCreateTask,
    onUnselectTask,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement | null;
            const tagName = activeElement?.tagName;

            // Always handle ESC key, regardless of focus
            if (e.key === "Escape") {
                e.preventDefault();
                onUnselectTask();
                // Blur any focused element to remove focus from inputs
                if (activeElement) {
                    (activeElement as HTMLElement).blur();
                }
                return;
            }

            // Don't handle other shortcuts when user is typing in input fields
            if (
                activeElement?.isContentEditable ||
                tagName === "INPUT" ||
                tagName === "TEXTAREA" ||
                tagName === "SELECT"
            ) {
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    onPreviousDay();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    onNextDay();
                    break;
                case "t":
                case "T":
                    e.preventDefault();
                    onToday();
                    break;
                case "c":
                case "C":
                    e.preventDefault();
                    onCreateTask();
                    break;
                case "\\":
                    e.preventDefault();
                    // Persist theme on server and update UI immediately
                    (async () => {
                        const html = document.documentElement;
                        const willBeDark = !html.classList.contains("dark");
                        await toggleTheme();
                        html.classList.toggle("dark", willBeDark);
                    })();
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onPreviousDay, onNextDay, onToday, onCreateTask, onUnselectTask]);
}
