"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    onPreviousDay : () => void;
    onNextDay     : () => void;
    onToday       : () => void;
    onCreateTask  : () => void;
    onUnselectTask: () => void;
    onDeleteTask  : () => void;
    onUndo        : () => void;
}

export function useKeyboardShortcuts({
    onPreviousDay,
    onNextDay,
    onToday,
    onCreateTask,
    onUnselectTask,
    onDeleteTask,
    onUndo,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement | null;
            const tagName       = activeElement?.tagName;

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

            // Handle Ctrl+Z to undo even when typing
            if (e.ctrlKey && e.key === "z") {
                e.preventDefault();
                onUndo();
                return;
            }

            // Don't handle other shortcuts when typing
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
                case "Delete"   :
                case "Backspace": 
                    e.preventDefault();
                    onDeleteTask();
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
                    // Toggle theme by toggling data-theme or class
                    const html   = document.documentElement;
                    const isDark = html.classList.contains("dark");
                    if (isDark) {
                        html.classList.remove("dark");
                        localStorage.setItem("theme", "light");
                    } else {
                        html.classList.add("dark");
                        localStorage.setItem("theme", "dark");
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        onPreviousDay,
        onNextDay,
        onToday,
        onCreateTask,
        onUnselectTask,
        onDeleteTask,
        onUndo,
    ]);
}
