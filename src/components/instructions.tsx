"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function Instructions() {
    return (
        <div className = "mt-6 flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant = "outline" size = "sm">
                        Instructions
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Instructions</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className = "text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <p>
                                    • Click an empty slot to create a task
                                </p>
                                <p>
                                    • Drag across slots to create a multi-slot
                                    task
                                </p>
                                <p>
                                    • Click a task to edit in the sidebar
                                </p>
                                <p>
                                    • Drag top half to adjust start; bottom half
                                    for end
                                </p>
                                <p>
                                    • Overlaps are allowed; shorter tasks appear
                                    on top
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Close
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant = "outline" size = "sm">
                        Keyboard
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Keyboard shortcuts</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <ul className = "list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <li>
                                    <span className = "font-medium">C</span>
                                    : Open create task modal
                                </li>
                                <li>
                                    <span className = "font-medium">Ctrl+Enter</span>
                                    : Create task (in modal)
                                </li>
                                <li>
                                    <span className = "font-medium">ESC</span>
                                    : Unselect task / close modals
                                </li>
                                <li>
                                    <span className = "font-medium">Enter</span>
                                    : Next field (time inputs)
                                </li>
                                <li>
                                    <span className = "font-medium">Up/Down</span>
                                    : Adjust hours/minutes
                                </li>
                                <li>
                                    <span className = "font-medium">T</span>
                                    : Jump to today
                                </li>
                                <li>
                                    <span className = "font-medium">Arrow Left/Right</span>
                                    : Previous/next day
                                </li>
                                <li>
                                    <span className = "font-medium">Delete/Backspace</span>
                                    : Delete selected task
                                </li>
                                <li>
                                    <span className = "font-medium">\\</span>
                                    : Toggle dark/light mode
                                </li>
                                <li>
                                    <span className = "font-medium">Ctrl+Z</span>
                                    : Undo last action
                                </li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Close
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
