"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { format, addDays, subDays, addWeeks, isWeekend } from "date-fns";
import { TaskGrid } from "@/components/task-grid";
import { TaskSidebar } from "@/components/task-sidebar";
import { CreateTaskModal } from "@/components/create-task-modal";
import { Header } from "@/components/header";
import { Instructions } from "@/components/instructions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";

interface Task {
    id: string;
    startSlot: number;
    endSlot: number;
    title: string;
    description: string;
    colorIndex: number;
    date: string; // ISO date string
    isRepeated?: boolean;
    seriesKey?: string; // deterministic grouping for repeated series
}

type DragOperationType = "none" | "click" | "drag";

interface DragOperation {
    type: DragOperationType;
    startTime: number;
    startPosition: { x: number; y: number; slot: number };
    currentSlot: number;
    resizingTask?: string;
    resizeType?: "start" | "end";
    taskStartSlot?: number;
    taskEndSlot?: number;
}

interface TaskTemplate {
    title: string;
    description: string;
    colorIndex: number;
}

const LOCAL_STORAGE_TEMPLATES_KEY = "time-tracker-templates";
const SLOT_HEIGHT = 40;
const SLOT_COUNT = 68;

const COLORS = [
    "bg-blue-200 border-blue-400 text-blue-900 dark:bg-blue-800 dark:border-blue-600 dark:text-blue-100",
    "bg-green-200 border-green-400 text-green-900 dark:bg-green-800 dark:border-green-600 dark:text-green-100",
    "bg-yellow-200 border-yellow-400 text-yellow-900 dark:bg-yellow-800 dark:border-yellow-600 dark:text-yellow-100",
    "bg-purple-200 border-purple-400 text-purple-900 dark:bg-purple-800 dark:border-purple-600 dark:text-purple-100",
    "bg-pink-200 border-pink-400 text-pink-900 dark:bg-pink-800 dark:border-pink-600 dark:text-pink-100",
    "bg-indigo-200 border-indigo-400 text-indigo-900 dark:bg-indigo-800 dark:border-indigo-600 dark:text-indigo-100",
    "bg-red-200 border-red-400 text-red-900 dark:bg-red-800 dark:border-red-600 dark:text-red-100",
    "bg-orange-200 border-orange-400 text-orange-900 dark:bg-orange-800 dark:border-orange-600 dark:text-orange-100",
    "bg-cyan-200 border-cyan-400 text-cyan-900 dark:bg-cyan-800 dark:border-cyan-600 dark:text-cyan-100",
    "bg-teal-200 border-teal-400 text-teal-900 dark:bg-teal-800 dark:border-teal-600 dark:text-teal-100",
    "bg-lime-200 border-lime-400 text-lime-900 dark:bg-lime-800 dark:border-lime-600 dark:text-lime-100",
    "bg-emerald-200 border-emerald-400 text-emerald-900 dark:bg-emerald-800 dark:border-emerald-600 dark:text-emerald-100",
    "bg-rose-200 border-rose-400 text-rose-900 dark:bg-rose-800 dark:border-rose-600 dark:text-rose-100",
    "bg-fuchsia-200 border-fuchsia-400 text-fuchsia-900 dark:bg-fuchsia-800 dark:border-fuchsia-600 dark:text-fuchsia-100",
    "bg-violet-200 border-violet-400 dark:bg-violet-800 dark:border-violet-600",
    "bg-sky-200 border-sky-400 dark:bg-sky-800 dark:border-sky-600",
    "bg-amber-200 border-amber-400 dark:bg-amber-800 dark:border-amber-600",
    "bg-slate-200 border-slate-400 dark:bg-slate-800 dark:border-slate-600",
];

const LOCAL_STORAGE_KEY = "time-tracker-tasks";

//

export default function TimeTracker() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [dragOperation, setDragOperation] = useState<DragOperation>({
        type: "none",
        startTime: 0,
        startPosition: { x: 0, y: 0, slot: 0 },
        currentSlot: 0,
    });
    const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [repeatCount, setRepeatCount] = useState<number>(0);
    const [repeatEvery, setRepeatEvery] = useState<"day" | "week">("day");
    const [weekdaysOnly, setWeekdaysOnly] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    //

    // Overlap helpers
    const rangesOverlap = (
        aStart: number,
        aEnd: number,
        bStart: number,
        bEnd: number,
    ) => aStart < bEnd && aEnd > bStart;

    const hasOverlapOnDate = (
        date: string,
        start: number,
        end: number,
        excludeTaskId?: string,
    ) => {
        return tasks.some(
            (t: Task) =>
                t.date === date &&
                t.id !== excludeTaskId &&
                rangesOverlap(start, end, t.startSlot, t.endSlot),
        );
    };

    const adjustStartAvoidOverlap = (
        date: string,
        desiredStart: number,
        end: number,
        excludeTaskId?: string,
    ) => {
        let adjusted = Math.max(0, Math.min(SLOT_COUNT - 1, desiredStart));
        // Find blockers that would overlap with [adjusted, end)
        const blockers = tasks.filter(
            (t: Task) =>
                t.date === date &&
                t.id !== excludeTaskId &&
                rangesOverlap(adjusted, end, t.startSlot, t.endSlot),
        );
        if (blockers.length === 0) return Math.min(adjusted, end - 1);
        const maxEndBefore = blockers.reduce((max: number, t: Task) => {
            if (t.endSlot <= end) {
                return Math.max(max, t.endSlot);
            }
            return max;
        }, 0);
        adjusted = Math.max(adjusted, maxEndBefore);
        adjusted = Math.min(adjusted, end - 1);
        return adjusted;
    };

    const adjustEndAvoidOverlap = (
        date: string,
        start: number,
        desiredEnd: number,
        excludeTaskId?: string,
    ) => {
        let adjusted = Math.max(start + 1, Math.min(SLOT_COUNT, desiredEnd));
        // Find blockers that would overlap with [start, adjusted)
        const blockers = tasks.filter(
            (t: Task) =>
                t.date === date &&
                t.id !== excludeTaskId &&
                rangesOverlap(start, adjusted, t.startSlot, t.endSlot),
        );
        if (blockers.length === 0) return Math.max(adjusted, start + 1);
        const minStartAfter = blockers.reduce((min: number, t: Task) => {
            if (t.startSlot >= start) {
                return Math.min(min, t.startSlot);
            }
            return min;
        }, SLOT_COUNT);
        adjusted = Math.min(adjusted, minStartAfter);
        adjusted = Math.max(adjusted, start + 1);
        return adjusted;
    };

    // Load tasks from localStorage on initial render
    useEffect(() => {
        const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedTasks) {
            try {
                setTasks(JSON.parse(savedTasks));
            } catch (error) {
                console.error("Failed to parse saved tasks:", error);
            }
        }
    }, []);

    // Save tasks to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }, [tasks]);

    // Load templates
    useEffect(() => {
        const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
        if (raw) {
            try {
                setTemplates(JSON.parse(raw));
            } catch {}
        }
    }, []);

    // Save templates
    useEffect(() => {
        localStorage.setItem(
            LOCAL_STORAGE_TEMPLATES_KEY,
            JSON.stringify(templates),
        );
    }, [templates]);

    // Theme initialization
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const prefersDark =
            saved === "dark" ||
            (!saved &&
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", !!prefersDark);
        setTheme(prefersDark ? "dark" : "light");
    }, []);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    };

    // Filter tasks for selected date
    const filteredTasks = tasks.filter(
        (task: Task) => task.date === format(selectedDate, "yyyy-MM-dd"),
    );

    const handlePreviousDay = () => {
        setSelectedDate((prev: Date) => subDays(prev, 1));
    };

    const handleNextDay = () => {
        setSelectedDate((prev: Date) => addDays(prev, 1));
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onPreviousDay: handlePreviousDay,
        onNextDay: handleNextDay,
        onToday: () => setSelectedDate(new Date()),
        onCreateTask: () => {
            setShowCreateModal(true);
        },
        onUnselectTask: () => setSelectedTaskId(null),
    });

    // Generate time slots from 7 AM to 12 AM (68 slots of 15 minutes each)
    const timeSlots = Array.from({ length: SLOT_COUNT }, (_, i) => {
        const totalMinutes = 7 * 60 + i * 15;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes
            .toString()
            .padStart(2, "0")} ${period}`;
    });

    const formatTime = (slot: number) => {
        return timeSlots[slot] || "";
    };

    const getSlotFromY = useCallback((y: number) => {
        if (!gridRef.current) return 0;
        const rect = gridRef.current.getBoundingClientRect();
        const relativeY = y - rect.top;
        const slotHeight = SLOT_HEIGHT; // Each slot is 40px high
        return Math.max(
            0,
            Math.min(SLOT_COUNT - 1, Math.floor(relativeY / slotHeight)),
        );
    }, []);

    const isSlotOccupied = (slot: number, excludeTaskId?: string) => {
        return filteredTasks.some(
            (task: Task) =>
                task.id !== excludeTaskId &&
                slot >= task.startSlot &&
                slot < task.endSlot,
        );
    };

    const handleMouseDown = (e: React.MouseEvent, slot: number) => {
        e.preventDefault();

        // Check if clicking on an existing task
        const clickedTask = filteredTasks.find(
            (task: Task) => slot >= task.startSlot && slot < task.endSlot,
        );

        if (clickedTask) {
            // Select the task for editing in sidebar
            setSelectedTaskId(clickedTask.id);

            // Get the task's DOM element
            const taskElement = e.currentTarget as HTMLElement;
            const taskRect = taskElement.getBoundingClientRect();

            // Calculate if we're in the top or bottom half based on mouse position
            const relativeY = e.clientY - taskRect.top;
            const isTopHalf = relativeY < taskRect.height / 2;

            // debug removed

            setDragOperation({
                type: "click",
                startTime: Date.now(),
                startPosition: { x: e.clientX, y: e.clientY, slot },
                currentSlot: slot,
                resizingTask: clickedTask.id,
                resizeType: isTopHalf ? "start" : "end",
                taskStartSlot: clickedTask.startSlot,
                taskEndSlot: clickedTask.endSlot,
            });
        } else {
            setDragOperation({
                type: "click",
                startTime: Date.now(),
                startPosition: { x: e.clientX, y: e.clientY, slot },
                currentSlot: slot,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragOperation.type === "none") return;

        const currentSlot = getSlotFromY(e.clientY);
        const dx = e.clientX - dragOperation.startPosition.x;
        const dy = e.clientY - dragOperation.startPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        //

        // If we're in click state and moved more than 5px, transition to drag
        if (dragOperation.type === "click" && distance > 5) {
            setDragOperation((prev: DragOperation) => ({
                ...prev,
                type: "drag",
            }));
        }

        // Update current slot
        setDragOperation((prev: DragOperation) => ({
            ...prev,
            currentSlot,
        }));
    };

    const handleMouseUp = () => {
        if (dragOperation.type === "none") return;

        // Handle click operation
        if (dragOperation.type === "click") {
            const slot = dragOperation.startPosition.slot;
            const clickedTask = filteredTasks.find(
                (task: Task) => slot >= task.startSlot && slot < task.endSlot,
            );

            if (!clickedTask) {
                // Create a single-cell task
                const newTask: Task = {
                    id: Date.now().toString(),
                    startSlot: slot,
                    endSlot: slot + 1,
                    title: "",
                    description: "",
                    colorIndex: filteredTasks.length % COLORS.length,
                    date: format(selectedDate, "yyyy-MM-dd"),
                };
                setTasks((prev: Task[]) => [...prev, newTask]);
                setSelectedTaskId(newTask.id);
            } else if (clickedTask && titleInputRef.current) {
                // Focus the title input when clicking an existing task
                titleInputRef.current.focus();
            }
        }
        // Handle drag operation
        else if (dragOperation.type === "drag") {
            if (dragOperation.resizingTask) {
                // Resize existing task
                setTasks((prev: Task[]) =>
                    prev.map((task: Task) => {
                        if (task.id !== dragOperation.resizingTask) return task;

                        if (dragOperation.resizeType === "start") {
                            const desiredStart = Math.min(
                                dragOperation.currentSlot,
                                task.endSlot - 1,
                            );
                            const finalStart = adjustStartAvoidOverlap(
                                task.date,
                                Math.max(0, desiredStart),
                                task.endSlot,
                                task.id,
                            );
                            if (
                                hasOverlapOnDate(
                                    task.date,
                                    finalStart,
                                    task.endSlot,
                                    task.id,
                                )
                            ) {
                                return task; // reject resize if still overlapping
                            }
                            return { ...task, startSlot: finalStart };
                        } else {
                            const desiredEnd = Math.max(
                                dragOperation.currentSlot + 1,
                                task.startSlot + 1,
                            );
                            const clampedDesiredEnd = Math.min(SLOT_COUNT, desiredEnd);
                            const finalEnd = adjustEndAvoidOverlap(
                                task.date,
                                task.startSlot,
                                clampedDesiredEnd,
                                task.id,
                            );
                            if (
                                hasOverlapOnDate(
                                    task.date,
                                    task.startSlot,
                                    finalEnd,
                                    task.id,
                                )
                            ) {
                                return task; // reject resize if still overlapping
                            }
                            return { ...task, endSlot: finalEnd };
                        }
                    }),
                );
            } else {
                // Create new task
                const startSlot = Math.min(
                    dragOperation.startPosition.slot,
                    dragOperation.currentSlot,
                );
                const endSlot =
                    Math.max(
                        dragOperation.startPosition.slot,
                        dragOperation.currentSlot,
                    ) + 1;

                if (endSlot > startSlot) {
                    const dateStr = format(selectedDate, "yyyy-MM-dd");
                    if (hasOverlapOnDate(dateStr, startSlot, endSlot)) {
                        // Do not create overlapping tasks
                        // no-op
                        
                    } else {
                    const newTask: Task = {
                        id: Date.now().toString(),
                        startSlot,
                        endSlot,
                        title: "",
                        description: "",
                        colorIndex: filteredTasks.length % COLORS.length,
                            date: dateStr,
                    };
                    setTasks((prev: Task[]) => [...prev, newTask]);
                    setSelectedTaskId(newTask.id);
                    }
                }
            }
        }

        // Reset drag operation
        setDragOperation({
            type: "none",
            startTime: 0,
            startPosition: { x: 0, y: 0, slot: 0 },
            currentSlot: 0,
        });
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        setTasks((prev: Task[]) =>
            prev.map((task: Task) => {
                if (task.id !== taskId) return task;
                // Enforce minimum duration of 1 slot (15 minutes)
                let newStart =
                    updates.startSlot !== undefined
                        ? Math.max(
                              0,
                              Math.min(SLOT_COUNT - 1, updates.startSlot),
                          )
                        : task.startSlot;
                let newEnd =
                    updates.endSlot !== undefined
                        ? Math.max(1, Math.min(SLOT_COUNT, updates.endSlot))
                        : task.endSlot;

                if (
                    updates.startSlot !== undefined ||
                    updates.endSlot !== undefined
                ) {
                    if (newEnd <= newStart) {
                        newEnd = newStart + 1;
                        if (newEnd > SLOT_COUNT) {
                            newStart = Math.max(0, SLOT_COUNT - 1);
                            newEnd = SLOT_COUNT;
                        }
                    }
                    // Prevent overlaps with other tasks on the same date
                    const adjustedStart = adjustStartAvoidOverlap(
                        task.date,
                        newStart,
                        newEnd,
                        task.id,
                    );
                    const adjustedEnd = adjustEndAvoidOverlap(
                        task.date,
                        adjustedStart,
                        newEnd,
                        task.id,
                    );
                    if (
                        hasOverlapOnDate(
                            task.date,
                            adjustedStart,
                            adjustedEnd,
                            task.id,
                        )
                    ) {
                        return task; // reject update if still overlapping
                    }
                    const sanitized: Partial<Task> = {
                        ...updates,
                        startSlot: adjustedStart,
                        endSlot: adjustedEnd,
                    };
                    return { ...task, ...sanitized };
                }

                return { ...task, ...updates };
            }),
        );
    };

    const deleteTask = (taskId: string) => {
        setTasks((prev: Task[]) =>
            prev.filter((task: Task) => task.id !== taskId),
        );
        setSelectedTaskId(null);
    };

    const getPreviewSlots = () => {
        if (dragOperation.type === "none") return null;

        if (dragOperation.type === "drag" && !dragOperation.resizingTask) {
            const startSlot = Math.min(
                dragOperation.startPosition.slot,
                dragOperation.currentSlot,
            );
            const endSlot =
                Math.max(
                    dragOperation.startPosition.slot,
                    dragOperation.currentSlot,
                ) + 1;
            return { startSlot, endSlot };
        } else if (
            dragOperation.type === "drag" &&
            dragOperation.resizingTask &&
            dragOperation.resizeType
        ) {
            const task = tasks.find(
                (t: Task) => t.id === dragOperation.resizingTask,
            );
            if (!task) return null;

            if (dragOperation.resizeType === "start") {
                const newStartSlot = Math.min(
                    dragOperation.currentSlot,
                    task.endSlot - 1,
                );
                return {
                    startSlot: Math.max(0, newStartSlot),
                    endSlot: task.endSlot,
                };
            } else {
                const newEndSlot = Math.max(
                    dragOperation.currentSlot + 1,
                    task.startSlot + 1,
                );
                return {
                    startSlot: task.startSlot,
                    endSlot: Math.min(SLOT_COUNT, newEndSlot),
                };
            }
        }

        return null;
    };

    const previewSlots = getPreviewSlots();
    const selectedTask = tasks.find((task: Task) => task.id === selectedTaskId);

    // Export/Import helpers
    const triggerImport = () => {
        const input = document.getElementById(
            "import-input",
        ) as HTMLInputElement | null;
        input?.click();
    };

    const onImportFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();

            if (file.name.endsWith(".csv")) {
                // Parse CSV
                const lines = text.split("\n").filter((line) => line.trim());
                if (lines.length < 2) return; // Need header + at least one data row

                const header = lines[0].split(",");
                const tasks: Task[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(",");
                    if (values.length >= header.length) {
                        const task: Task = {
                            id: values[0] || Date.now().toString(),
                            date:
                                values[1] || format(selectedDate, "yyyy-MM-dd"),
                            startSlot: Number(values[2]) || 0,
                            endSlot: Number(values[3]) || 1,
                            title: values[4]?.replace(/"/g, "") || "",
                            description: values[5]?.replace(/"/g, "") || "",
                            colorIndex: isNaN(Number(values[6]))
                                ? COLORS.findIndex((c) => c === values[6]) || 0
                                : Number(values[6]) || 0,
                        };
                        tasks.push(task);
                    }
                }
                setTasks(tasks);
            } else {
                // Parse JSON
                const imported: unknown = JSON.parse(text);
                if (!Array.isArray(imported)) return;
                const sanitized: Task[] = (imported as unknown[])
                    .filter(
                        (t: unknown): t is { [key: string]: unknown } =>
                            Boolean(t) && typeof t === "object",
                    )
                    .map((t) => {
                        const obj = t as { [key: string]: unknown };
                        return {
                            id: String(obj.id ?? Date.now().toString()),
                            startSlot: Number(obj.startSlot ?? 0),
                            endSlot: Number(obj.endSlot ?? 1),
                            title: String(obj.title ?? ""),
                            description: String(obj.description ?? ""),
                            colorIndex:
                                typeof obj.colorIndex === "number"
                                    ? (obj.colorIndex as number)
                                    : typeof obj.color === "string"
                                    ? COLORS.findIndex(
                                          (c) => c === (obj.color as string),
                                      )
                                    : 0,
                            date: String(
                                obj.date ?? format(selectedDate, "yyyy-MM-dd"),
                            ),
                        };
                    });
                setTasks(sanitized);
            }
        } catch (error) {
            console.error("Failed to import file:", error);
        }
        e.target.value = "";
    };

    // Export helpers
    const exportTasksJSON = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timesheet.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportTasksCSV = () => {
        const header = [
            "id",
            "date",
            "startSlot",
            "endSlot",
            "title",
            "description",
            "color",
        ];
        const rows = tasks.map((t: Task) =>
            [
                t.id,
                t.date,
                t.startSlot,
                t.endSlot,
                JSON.stringify(t.title ?? ""),
                JSON.stringify(t.description ?? ""),
                t.colorIndex,
            ].join(","),
        );
        const csv = [header.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timesheet.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Templates helpers

    const deleteTemplate = (index: number) => {
        setTemplates((prev: TaskTemplate[]) =>
            prev.filter((_, i) => i !== index),
        );
    };

    const applyTemplateToSelected = (tpl: TaskTemplate) => {
        if (selectedTask) {
            updateTask(selectedTask.id, {
                title: tpl.title,
                description: tpl.description,
                colorIndex: tpl.colorIndex,
            });
        } else {
            const today = format(selectedDate, "yyyy-MM-dd");
            let slot = 0;
            while (slot < SLOT_COUNT - 1 && isSlotOccupied(slot)) slot++;
            const newTask: Task = {
                id: Date.now().toString(),
                startSlot: slot,
                endSlot: slot + 1,
                title: tpl.title,
                description: tpl.description,
                colorIndex: tpl.colorIndex,
                date: today,
            };
            setTasks((prev: Task[]) => [...prev, newTask]);
            setSelectedTaskId(newTask.id);
        }
    };

    // Repeat helpers
    const createRepeats = (seriesKey?: string) => {
        if (!selectedTask || repeatCount <= 0) return;
        const key =
            seriesKey ||
            `${selectedTask.title}|${selectedTask.description}|${selectedTask.startSlot}|${selectedTask.endSlot}`;
        const base = {
            ...selectedTask,
            isRepeated: true,
            seriesKey: key,
        } as Task;
        const tasksToCreate: Task[] = [];

        // Create tasks for the next 30 occurrences (reasonable limit)
        for (let occurrence = 1; occurrence <= 30; occurrence++) {
            let nextDate: Date;

            if (repeatEvery === "day") {
                // Every N days
                nextDate = addDays(selectedDate, occurrence * repeatCount);
            } else {
                // Every N weeks
                nextDate = addWeeks(selectedDate, occurrence * repeatCount);
            }

            // Skip weekends if weekdaysOnly is enabled
            if (weekdaysOnly && isWeekend(nextDate)) {
                // Find next weekday
                while (isWeekend(nextDate)) {
                    nextDate = addDays(nextDate, 1);
                }
            }

            const dateStr = format(nextDate, "yyyy-MM-dd");
            const dayTasks = tasks.filter((t: Task) => t.date === dateStr);
            const conflict = dayTasks.some(
                (t: Task) =>
                    base.startSlot < t.endSlot && base.endSlot > t.startSlot,
            );

            if (!conflict) {
                const newTask: Task = {
                    ...base,
                    id: (Date.now() + occurrence).toString(),
                    date: dateStr,
                    isRepeated: true,
                    seriesKey: key,
                };
                tasksToCreate.push(newTask);
            }
        }

        // Add all new tasks at once
        if (tasksToCreate.length > 0) {
            setTasks((prev: Task[]) => [...prev, ...tasksToCreate]);
        }
    };

    const deleteRepeatedTasks = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Compare date strings (yyyy-MM-dd) lexicographically to avoid timezone pitfalls
        const key =
            task.seriesKey ||
            `${task.title}|${task.description}|${task.startSlot}|${task.endSlot}`;
        const tasksToDelete = tasks.filter((t) => {
            return (
                (t.seriesKey
                    ? t.seriesKey === key
                    : t.title === task.title &&
                      t.description === task.description &&
                      t.startSlot === task.startSlot &&
                      t.endSlot === task.endSlot) && t.date >= task.date
            );
        });

        const idsToDelete = tasksToDelete.map((t) => t.id);
        setTasks((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
    };

    const deleteAllInSeries = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const key =
            task.seriesKey ||
            `${task.title}|${task.description}|${task.startSlot}|${task.endSlot}`;
        setTasks((prev) =>
            prev.filter((t) =>
                t.seriesKey
                    ? t.seriesKey !== key
                    : !(
                          t.title === task.title &&
                          t.description === task.description &&
                          t.startSlot === task.startSlot &&
                          t.endSlot === task.endSlot
                      ),
            ),
        );
        setSelectedTaskId(null);
    };

    const timeToSlot = (timeStr: string): number => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let totalHours = hours;
        if (period === "PM" && hours !== 12) totalHours += 12;
        if (period === "AM" && hours === 12) totalHours = 0;
        const totalMinutes = totalHours * 60 + minutes;
        const startMinutes = 7 * 60; // 7 AM
        return Math.max(0, Math.floor((totalMinutes - startMinutes) / 15));
    };

    const createTaskFromModal = (taskData: {
        title: string;
        description: string;
        startTime: string;
        endTime: string;
        repeatCount?: number;
        repeatEvery?: "day" | "week";
        weekdaysOnly?: boolean;
    }) => {
        let startSlot = 0;
        let endSlot = 1;

        if (taskData.startTime && taskData.endTime) {
            startSlot = timeToSlot(taskData.startTime);
            endSlot = timeToSlot(taskData.endTime);
            if (endSlot <= startSlot) endSlot = startSlot + 1;
        } else {
            // Find first available slot
            while (startSlot < SLOT_COUNT - 1 && isSlotOccupied(startSlot))
                startSlot++;
            endSlot = startSlot + 1;
        }

        const dateStr = format(selectedDate, "yyyy-MM-dd");
        if (hasOverlapOnDate(dateStr, startSlot, endSlot)) {
            // Do not create overlapping tasks
            return;
        }

        const seriesKeyBase = `${taskData.title}|${taskData.description}|${startSlot}|${endSlot}`;

        const baseTask: Task = {
            id: Date.now().toString(),
            startSlot,
            endSlot,
            title: taskData.title,
            description: taskData.description,
            colorIndex: filteredTasks.length % COLORS.length,
            date: dateStr,
            isRepeated: Boolean(
                taskData.repeatCount && taskData.repeatCount > 0,
            ),
            seriesKey:
                taskData.repeatCount && taskData.repeatCount > 0
                    ? seriesKeyBase
                    : undefined,
        };

        const tasksToCreate: Task[] = [baseTask];

        // Handle repeats if specified
        if (taskData.repeatCount && taskData.repeatCount > 0) {
            // Create tasks for the next 30 occurrences (reasonable limit)
            for (let occurrence = 1; occurrence <= 30; occurrence++) {
                let nextDate: Date;

                if (taskData.repeatEvery === "day") {
                    // Every N days
                    nextDate = addDays(
                        selectedDate,
                        occurrence * taskData.repeatCount,
                    );
                } else {
                    // Every N weeks
                    nextDate = addWeeks(
                        selectedDate,
                        occurrence * taskData.repeatCount,
                    );
                }

                if (taskData.weekdaysOnly && isWeekend(nextDate)) {
                    while (isWeekend(nextDate)) {
                        nextDate = addDays(nextDate, 1);
                    }
                }

                const dateStr = format(nextDate, "yyyy-MM-dd");
                const dayTasks = tasks.filter((t: Task) => t.date === dateStr);
                const conflict = dayTasks.some(
                    (t: Task) => startSlot < t.endSlot && endSlot > t.startSlot,
                );

                if (!conflict) {
                    tasksToCreate.push({
                        ...baseTask,
                        id: (Date.now() + occurrence).toString(),
                        date: dateStr,
                        isRepeated: true,
                        seriesKey: seriesKeyBase,
                    });
                }
            }
        }

        setTasks((prev: Task[]) => [...prev, ...tasksToCreate]);
        setSelectedTaskId(baseTask.id);
        setShowCreateModal(false);
    };

    const saveTaskAsTemplate = (task: Task) => {
        const tpl: TaskTemplate = {
            title: task.title,
            description: task.description,
            colorIndex: task.colorIndex,
        };
        setTemplates((prev: TaskTemplate[]) => [tpl, ...prev].slice(0, 50));
    };

    const handleCopyTaskTitle = (taskId: string, titleText: string) => {
        navigator.clipboard.writeText(titleText);
        setCopiedTaskId(taskId);
        setTimeout(() => setCopiedTaskId(null), 2000);
    };

    const handleCreateRepeats = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task || repeatCount <= 0) return;

        // Assign a seriesKey to the selected task if missing
        const key =
            task.seriesKey ||
            `${task.title}|${task.description}|${task.startSlot}|${task.endSlot}`;
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId
                    ? { ...t, isRepeated: true, seriesKey: key }
                    : t,
            ),
        );

        setSelectedTaskId(taskId);
        createRepeats(key);
    };

    const applyTemplateToModal = () => {
        // no-op; modal handles applying template locally
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            <Header
                selectedDate={selectedDate}
                theme={theme}
                onPreviousDay={handlePreviousDay}
                onNextDay={handleNextDay}
                onToggleTheme={toggleTheme}
            />

            {/* Main Content with top padding for fixed header and right margin for sidebar */}
            <div className="flex-1 pt-20 pr-80 p-4 mr-4">
                <TaskGrid
                    tasks={filteredTasks}
                    timeSlots={timeSlots}
                    selectedTaskId={selectedTaskId}
                    previewSlots={previewSlots}
                    colors={COLORS}
                    repeatCount={repeatCount}
                    repeatEvery={repeatEvery}
                    weekdaysOnly={weekdaysOnly}
                    gridRef={gridRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onUpdateTask={updateTask}
                    onSaveAsTemplate={saveTaskAsTemplate}
                    onCreateRepeats={handleCreateRepeats}
                    onDeleteRepeatedTasks={deleteRepeatedTasks}
                    onDeleteTask={deleteTask}
                    onDeleteAllInSeries={deleteAllInSeries}
                    setRepeatCount={setRepeatCount}
                    setRepeatEvery={setRepeatEvery}
                    setWeekdaysOnly={setWeekdaysOnly}
                    formatTime={formatTime}
                />

                <Instructions />

                {/* Import/Export buttons - bottom right */}
                <div className="mt-6 flex justify-end gap-2">
                    <input
                        id="import-input"
                        type="file"
                        accept="application/json,.csv"
                        className="hidden"
                        onChange={onImportFileChange}
                    />
                    <Button variant="outline" onClick={triggerImport} size="sm">
                        Import
                    </Button>
                    <div className="relative">
                        <select
                            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm pr-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onChange={(e) => {
                                if (e.target.value === "json") {
                                    exportTasksJSON();
                                } else if (e.target.value === "csv") {
                                    exportTasksCSV();
                                }
                                e.target.value = ""; // Reset selection
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>
                                Export
                            </option>
                            <option value="json">Export JSON</option>
                            <option value="csv">Export CSV</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg
                                className="fill-current h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={createTaskFromModal}
                templates={templates}
                onApplyTemplate={applyTemplateToModal}
            />

            <TaskSidebar
                selectedTask={selectedTask || null}
                selectedDate={selectedDate}
                tasks={tasks}
                templates={templates}
                copiedTaskId={copiedTaskId}
                onSelectDate={(date) => date && setSelectedDate(date)}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onApplyTemplate={applyTemplateToSelected}
                onDeleteTemplate={deleteTemplate}
                onCopyTaskTitle={handleCopyTaskTitle}
                formatTime={formatTime}
                titleInputRef={
                    titleInputRef as React.RefObject<HTMLInputElement>
                }
            />
        </div>
    );
}
