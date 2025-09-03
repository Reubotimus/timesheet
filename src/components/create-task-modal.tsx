"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimeInput } from "./time-input";

interface TaskTemplate {
    title: string;
    description: string;
    colorIndex: number;
}

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (taskData: {
        title: string;
        description: string;
        startTime: string;
        endTime: string;
        repeatCount?: number;
        repeatEvery?: "day" | "week";
        weekdaysOnly?: boolean;
    }) => void;
    templates: TaskTemplate[];
    onApplyTemplate: (template: TaskTemplate) => void;
}

export function CreateTaskModal({
    isOpen,
    onClose,
    onCreate,
    templates,
    onApplyTemplate,
}: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("9:00 AM");
    const [endTime, setEndTime] = useState("10:00 AM");
    const [showRepeat, setShowRepeat] = useState(false);
    const [repeatCount, setRepeatCount] = useState(1);
    const [repeatEvery, setRepeatEvery] = useState<"day" | "week">("day");
    const [weekdaysOnly, setWeekdaysOnly] = useState(false);
    const repeatEverySelectRef = useRef<HTMLSelectElement | null>(null);

    const handleCreate = () => {
        if (!title.trim()) return;

        onCreate({
            title: title.trim(),
            description: description.trim(),
            startTime,
            endTime,
            ...(showRepeat && {
                repeatCount,
                repeatEvery,
                weekdaysOnly,
            }),
        });

        // Reset form
        setTitle("");
        setDescription("");
        setStartTime("9:00 AM");
        setEndTime("10:00 AM");
        setShowRepeat(false);
        setRepeatCount(1);
        setRepeatEvery("day");
        setWeekdaysOnly(false);
    };

    const handleApplyTemplate = (template: TaskTemplate) => {
        setTitle(template.title);
        setDescription(template.description);
        onApplyTemplate(template);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter" && e.ctrlKey) {
            handleCreate();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">
                    Create New Task
                </h2>

                {/* Templates */}
                {templates.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quick Templates
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {templates.slice(0, 6).map((template, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handleApplyTemplate(template)
                                    }
                                    className="text-xs"
                                >
                                    {template.title || "Untitled"}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title *
                        </label>
                        <Input
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Time
                            </label>
                            <TimeInput
                                value={startTime}
                                onChange={setStartTime}
                                placeholder="9:00 AM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Time
                            </label>
                            <TimeInput
                                value={endTime}
                                onChange={setEndTime}
                                placeholder="10:00 AM"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <Textarea
                            placeholder="Task description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Repeat Options */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <input
                                type="checkbox"
                                checked={showRepeat}
                                onChange={(e) =>
                                    setShowRepeat(e.target.checked)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        setShowRepeat(!showRepeat);
                                    }
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            Repeat Task
                        </label>

                        {showRepeat && (
                            <div className="space-y-2 pl-6 border-l-2 border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm dark:text-gray-300">
                                        Every
                                    </span>
                                    <Input
                                        type="number"
                                        min={1}
                                        className="w-16 h-8"
                                        value={repeatCount}
                                        onChange={(e) =>
                                            setRepeatCount(
                                                Number(e.target.value),
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                repeatEverySelectRef.current?.focus();
                                            }
                                        }}
                                    />
                                    <select
                                        ref={repeatEverySelectRef}
                                        className="border rounded px-2 py-1 text-sm bg-transparent dark:bg-gray-800 dark:border-gray-600"
                                        value={repeatEvery}
                                        onChange={(e) =>
                                            setRepeatEvery(
                                                e.target.value as
                                                    | "day"
                                                    | "week",
                                            )
                                        }
                                    >
                                        <option value="day">day(s)</option>
                                        <option value="week">week(s)</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={weekdaysOnly}
                                        onChange={(e) =>
                                            setWeekdaysOnly(e.target.checked)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                setWeekdaysOnly((w) => !w);
                                            }
                                        }}
                                    />
                                    Weekdays only
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!title.trim()}
                        className="flex-1"
                    >
                        Create Task
                    </Button>
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Press Ctrl+Enter to create • ESC to cancel
                </div>
            </div>
        </div>
    );
}
