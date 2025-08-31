"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Clock,
    AlignLeft,
    Trash2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

interface Task {
    id: string;
    startSlot: number;
    endSlot: number;
    title: string;
    description: string;
    colorIndex: number;
    date: string;
}

interface TaskTemplate {
    title: string;
    description: string;
    colorIndex: number;
}

interface TaskSidebarProps {
    selectedTask: Task | null;
    selectedDate: Date;
    tasks: Task[];
    templates: TaskTemplate[];
    copiedTaskId: string | null;
    onSelectDate: (date: Date | undefined) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onSaveTemplate: () => void;
    onApplyTemplate: (template: TaskTemplate) => void;
    onDeleteTemplate: (index: number) => void;
    onExportCSV: () => void;
    onCopyTaskTitle: (taskId: string, title: string) => void;
    formatTime: (slot: number) => string;
    titleInputRef: React.RefObject<HTMLInputElement>;
}

export function TaskSidebar({
    selectedTask,
    selectedDate,
    tasks,
    templates,
    copiedTaskId,
    onSelectDate,
    onUpdateTask,
    onDeleteTask,
    onSaveTemplate,
    onApplyTemplate,
    onDeleteTemplate,
    onExportCSV,
    onCopyTaskTitle,
    formatTime,
    titleInputRef,
}: TaskSidebarProps) {
    const [isRecentTasksExpanded, setIsRecentTasksExpanded] = useState(false);
    const [isSavedTasksExpanded, setIsSavedTasksExpanded] = useState(false);
    return (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-y-auto fixed top-20 right-0 h-[calc(100vh-5rem)] flex flex-col">
            <div className="flex-1 flex flex-col">
                {/* Permanent calendar */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold dark:text-white">
                        Calendar
                    </h2>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onSelectDate}
                        className="rounded-md border dark:border-gray-700 w-full max-w-[280px]"
                        numberOfMonths={1}
                        classNames={{
                            day_today:
                                "relative font-semibold text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 before:content-[''] before:absolute before:inset-0 before:m-auto before:size-7 before:rounded-full before:border before:border-blue-300 before:bg-blue-100/60 dark:before:border-blue-700 dark:before:bg-blue-900/40",
                        }}
                    />
                </div>
                <hr className="my-4 dark:border-gray-700" />

                <h2 className="text-xl font-semibold mb-4 dark:text-white">
                    Task Details
                </h2>

                {selectedTask ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                            </label>
                            <Input
                                ref={titleInputRef}
                                placeholder="Task title"
                                value={selectedTask.title}
                                onChange={(e) =>
                                    onUpdateTask(selectedTask.id, {
                                        title: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time
                            </label>
                            <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span>
                                    {formatTime(selectedTask.startSlot)} -{" "}
                                    {formatTime(selectedTask.endSlot)}
                                </span>
                                <span>
                                    {((selectedTask.endSlot -
                                        selectedTask.startSlot) *
                                        15) /
                                        60}{" "}
                                    hour/s
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <Textarea
                                placeholder="Add description"
                                value={selectedTask.description}
                                onChange={(e) =>
                                    onUpdateTask(selectedTask.id, {
                                        description: e.target.value,
                                    })
                                }
                                rows={5}
                                className="dark:bg-gray-800"
                            />
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full mt-4"
                            onClick={() => onDeleteTask(selectedTask.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Task
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Select a task to edit or create a new one</p>
                    </div>
                )}

                {/* Recent Task Titles */}
                <div className="mt-12">
                    <button
                        onClick={() =>
                            setIsRecentTasksExpanded(!isRecentTasksExpanded)
                        }
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                        <h3 className="text-md font-semibold dark:text-white">
                            Recent Task Titles
                        </h3>
                        {isRecentTasksExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>
                    {isRecentTasksExpanded && (
                        <div className="mt-2 space-y-1">
                            {tasks
                                .slice()
                                .sort((a, b) => Number(b.id) - Number(a.id))
                                .slice(0, 5)
                                .map((task) => {
                                    const isCopied = copiedTaskId === task.id;
                                    const titleText =
                                        task.title || "Untitled Task";

                                    return (
                                        <div
                                            key={task.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="truncate flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                    {titleText}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                {task.description && (
                                                    <p className="mb-1">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <p className="text-gray-500 dark:text-gray-500">
                                                    {formatTime(task.startSlot)}{" "}
                                                    - {formatTime(task.endSlot)}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    onCopyTaskTitle(
                                                        task.id,
                                                        titleText,
                                                    )
                                                }
                                                className="text-xs px-2 py-1 h-6"
                                            >
                                                {isCopied
                                                    ? "Copied"
                                                    : "Copy Title"}
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Saved templates */}
                <div className="mt-8">
                    <button
                        onClick={() =>
                            setIsSavedTasksExpanded(!isSavedTasksExpanded)
                        }
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                        <h3 className="text-md font-semibold dark:text-white">
                            Saved Tasks
                        </h3>
                        {isSavedTasksExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>
                    {isSavedTasksExpanded && (
                        <div className="mt-2 space-y-1">
                            {templates.map((tpl, i) => (
                                <div
                                    key={i}
                                    className="border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="truncate flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {tpl.title || "Untitled"}
                                        </span>
                                    </div>
                                    {tpl.description && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                            <p>{tpl.description}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onApplyTemplate(tpl)}
                                            className="text-xs px-2 py-1 h-6"
                                        >
                                            Use
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onDeleteTemplate(i)}
                                            className="text-xs px-2 py-1 h-6"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
