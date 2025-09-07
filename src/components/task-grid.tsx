"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Repeat as RepeatIcon } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Task {
    id: string;
    startSlot: number;
    endSlot: number;
    title: string;
    description: string;
    colorIndex: number;
    date: string;
    isRepeated?: boolean;
    seriesKey?: string;
}

//

interface TaskGridProps {
    tasks: Task[];
    timeSlots: string[];
    selectedTaskId: string | null;
    previewSlots: { startSlot: number; endSlot: number } | null;
    colors: string[];
    repeatCount: number;
    repeatEvery: "day" | "week";
    weekdaysOnly: boolean;
    gridRef: React.RefObject<HTMLDivElement | null>;
    onMouseDown: (e: React.MouseEvent, slot: number) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onSaveAsTemplate: (task: Task) => void;
    onCreateRepeats: (taskId: string) => void;
    onDeleteRepeatedTasks: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onDeleteAllInSeries: (taskId: string) => void;
    setRepeatCount: (count: number) => void;
    setRepeatEvery: (period: "day" | "week") => void;
    setWeekdaysOnly: (weekdays: boolean) => void;
    formatTime: (slot: number) => string;
}

const SLOT_HEIGHT = 40;

export function TaskGrid({
    tasks,
    timeSlots,
    selectedTaskId,
    previewSlots,
    colors,
    repeatCount,
    repeatEvery,
    weekdaysOnly,
    gridRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onUpdateTask,
    onSaveAsTemplate,
    onCreateRepeats,
    onDeleteRepeatedTasks,
    onDeleteTask,
    onDeleteAllInSeries,
    setRepeatCount,
    setRepeatEvery,
    setWeekdaysOnly,
    formatTime,
}: TaskGridProps) {
    const getOverlapIndex = (task: Task): number => {
        const overlapping = tasks.filter(
            (t) =>
                t.id !== task.id &&
                t.startSlot < task.endSlot &&
                t.endSlot > task.startSlot,
        );
        const index = overlapping.filter(
            (t) =>
                t.startSlot < task.startSlot ||
                (t.startSlot === task.startSlot && t.id < task.id),
        ).length;
        return index;
    };
    return (
        <Card className="p-6">
            <div
                ref={gridRef}
                className="relative select-none"
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {/* Time labels overlay centered on grid lines */}
                <div className="pointer-events-none absolute left-0 top-0 w-20 z-10">
                    {timeSlots.map((time: string, index: number) => (
                        <div
                            key={`marker-${index}`}
                            className="absolute w-20 text-xs text-gray-600 dark:text-gray-300 px-2 bg-white dark:bg-gray-900 rounded"
                            style={{
                                top: `${index * SLOT_HEIGHT}px`,
                                transform: "translateY(-50%)",
                            }}
                        >
                            {time}
                        </div>
                    ))}
                </div>

                {/* Time grid */}
                {timeSlots.map((time: string, index: number) => (
                    <div
                        key={index}
                        className="flex h-10 cursor-crosshair group"
                        onMouseDown={(e: React.MouseEvent) =>
                            onMouseDown(e, index)
                        }
                    >
                        <div className="w-20 text-sm py-2 px-2 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-0">
                            {time}
                        </div>
                        <div className="flex-1 relative group-hover:bg-gray-50 dark:group-hover:bg-gray-800">
                            {/* Grid line that stops before time labels */}
                            <div className="absolute bottom-0 left-0 right-0 border-b border-gray-200 dark:border-gray-700"></div>
                            {/* Preview for new task or resizing */}
                            {previewSlots &&
                                index >= previewSlots.startSlot &&
                                index < previewSlots.endSlot && (
                                    <div className="absolute inset-0 bg-blue-200 dark:bg-blue-800 border border-blue-400 dark:border-blue-600 opacity-50 z-10" />
                                )}
                        </div>
                    </div>
                ))}

                {/* Render tasks */}
                {tasks
                    .slice()
                    .sort((a, b) => {
                        const durA = a.endSlot - a.startSlot;
                        const durB = b.endSlot - b.startSlot;
                        // shorter duration first to render on top via later z-index bump
                        return durA - durB;
                    })
                    .map((task: Task) => (
                        <div
                            key={task.id}
                            className={`absolute left-20 right-0 border-2 rounded cursor-move z-20 ${
                                colors[task.colorIndex] || colors[0]
                            } ${
                                selectedTaskId === task.id
                                    ? "ring-2 ring-blue-500 dark:ring-blue-400"
                                    : ""
                            } text-gray-900 dark:text-gray-100`}
                            style={{
                                top: `${task.startSlot * SLOT_HEIGHT}px`,
                                height: `${
                                    (task.endSlot - task.startSlot) *
                                    SLOT_HEIGHT
                                }px`,
                                left: `calc(5rem + ${
                                    getOverlapIndex(task) * 24
                                }px)`,
                                right: `${getOverlapIndex(task) * 24}px`,
                                zIndex:
                                    20 +
                                    (100 - (task.endSlot - task.startSlot)),
                            }}
                            onMouseDown={(e: React.MouseEvent) =>
                                onMouseDown(e, task.startSlot)
                            }
                        >
                            <div className="p-2 h-full overflow-hidden relative">
                                <div className="absolute top-1 right-1 z-30">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onMouseDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-64 p-3"
                                            align="end"
                                            onMouseDown={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-xs font-medium mb-1 dark:text-white">
                                                        Color
                                                    </div>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {colors.map(
                                                            (cls, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onUpdateTask(
                                                                            task.id,
                                                                            {
                                                                                colorIndex:
                                                                                    idx,
                                                                            },
                                                                        )
                                                                    }
                                                                    className={`h-6 w-6 rounded border ${cls} ${
                                                                        task.colorIndex ===
                                                                        idx
                                                                            ? "ring-2 ring-blue-500"
                                                                            : ""
                                                                    }`}
                                                                    aria-label={`Choose color ${
                                                                        idx + 1
                                                                    }`}
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-medium mb-1 dark:text-white">
                                                        Repeat
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs dark:text-gray-300">
                                                            Every
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            className="w-16 h-8 text-xs"
                                                            value={
                                                                repeatCount ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setRepeatCount(
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            placeholder="0"
                                                        />
                                                        <select
                                                            className="border rounded px-2 py-1 text-xs bg-transparent dark:bg-gray-800 dark:border-gray-600"
                                                            value={repeatEvery}
                                                            onChange={(e) =>
                                                                setRepeatEvery(
                                                                    e.target
                                                                        .value as
                                                                        | "day"
                                                                        | "week",
                                                                )
                                                            }
                                                        >
                                                            <option value="day">
                                                                day(s)
                                                            </option>
                                                            <option value="week">
                                                                week(s)
                                                            </option>
                                                        </select>
                                                    </div>
                                                    <label className="mt-2 flex items-center gap-1 text-xs dark:text-gray-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                weekdaysOnly
                                                            }
                                                            onChange={(e) =>
                                                                setWeekdaysOnly(
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        Weekdays only
                                                    </label>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSaveAsTemplate(
                                                                    task,
                                                                );
                                                            }}
                                                        >
                                                            Save Template
                                                        </Button>
                                                        <PopoverClose asChild>
                                                            <Button
                                                                size="sm"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    onCreateRepeats(
                                                                        task.id,
                                                                    );
                                                                }}
                                                            >
                                                                Apply Repeat
                                                            </Button>
                                                        </PopoverClose>

                                                        {/* Delete options */}
                                                        {(() => {
                                                            const isSeries =
                                                                task.isRepeated ||
                                                                tasks.some(
                                                                    (t) =>
                                                                        t.id !==
                                                                            task.id &&
                                                                        (t.seriesKey &&
                                                                        task.seriesKey
                                                                            ? t.seriesKey ===
                                                                              task.seriesKey
                                                                            : t.title ===
                                                                                  task.title &&
                                                                              t.description ===
                                                                                  task.description &&
                                                                              t.startSlot ===
                                                                                  task.startSlot &&
                                                                              t.endSlot ===
                                                                                  task.endSlot),
                                                                );
                                                            if (isSeries) {
                                                                return (
                                                                    <>
                                                                        {/* Delete only this event */}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                >
                                                                                    Delete
                                                                                    this
                                                                                    event
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>
                                                                                        Delete
                                                                                        this
                                                                                        event?
                                                                                    </AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        This
                                                                                        will
                                                                                        delete
                                                                                        only
                                                                                        this
                                                                                        task
                                                                                        instance.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <PopoverClose
                                                                                        asChild
                                                                                    >
                                                                                        <AlertDialogAction
                                                                                            onClick={(
                                                                                                e: React.MouseEvent,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                onDeleteTask(
                                                                                                    task.id,
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </PopoverClose>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>

                                                                        {/* Delete this and following */}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                >
                                                                                    Delete
                                                                                    this
                                                                                    and
                                                                                    following
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>
                                                                                        Delete
                                                                                        this
                                                                                        and
                                                                                        following?
                                                                                    </AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        This
                                                                                        will
                                                                                        delete
                                                                                        this
                                                                                        task
                                                                                        and
                                                                                        all
                                                                                        future
                                                                                        occurrences
                                                                                        in
                                                                                        the
                                                                                        series.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <PopoverClose
                                                                                        asChild
                                                                                    >
                                                                                        <AlertDialogAction
                                                                                            onClick={(
                                                                                                e: React.MouseEvent,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                onDeleteRepeatedTasks(
                                                                                                    task.id,
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </PopoverClose>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>

                                                                        {/* Delete all events */}
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                >
                                                                                    Delete
                                                                                    all
                                                                                    events
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>
                                                                                        Delete
                                                                                        entire
                                                                                        series?
                                                                                    </AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        This
                                                                                        will
                                                                                        delete
                                                                                        all
                                                                                        occurrences
                                                                                        of
                                                                                        this
                                                                                        task
                                                                                        across
                                                                                        all
                                                                                        dates.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>
                                                                                        Cancel
                                                                                    </AlertDialogCancel>
                                                                                    <PopoverClose
                                                                                        asChild
                                                                                    >
                                                                                        <AlertDialogAction
                                                                                            onClick={(
                                                                                                e: React.MouseEvent,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                onDeleteAllInSeries(
                                                                                                    task.id,
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </PopoverClose>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </>
                                                                );
                                                            }
                                                            return (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Delete
                                                                                this
                                                                                task?
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This
                                                                                action
                                                                                cannot
                                                                                be
                                                                                undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>
                                                                                Cancel
                                                                            </AlertDialogCancel>
                                                                            <PopoverClose
                                                                                asChild
                                                                            >
                                                                                <AlertDialogAction
                                                                                    onClick={(
                                                                                        e: React.MouseEvent,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        onDeleteTask(
                                                                                            task.id,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </PopoverClose>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="text-sm font-medium">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="font-bold flex items-center gap-1">
                                            {task.title || "Untitled Task"}
                                            {task.isRepeated && (
                                                <span
                                                    className={`inline-flex items-center justify-center h-4 w-4 rounded-full border ${
                                                        colors[
                                                            task.colorIndex
                                                        ] || ""
                                                    } bg-transparent dark:bg-transparent`}
                                                    title="Repeated task"
                                                >
                                                    <RepeatIcon className="h-3 w-3 opacity-80" />
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs">
                                            {formatTime(task.startSlot)} -{" "}
                                            {formatTime(task.endSlot)}
                                        </span>
                                        <span className="text-xs">
                                            {((task.endSlot - task.startSlot) *
                                                15) /
                                                60}{" "}
                                            hour/s
                                        </span>
                                    </div>
                                    {task.description && (
                                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-3 whitespace-pre-wrap">
                                            {task.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </Card>
    );
}
