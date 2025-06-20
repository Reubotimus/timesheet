"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Clock,
  AlignLeft,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";

interface Task {
  id: string;
  startSlot: number;
  endSlot: number;
  title: string;
  description: string;
  color: string;
  date: string; // ISO date string
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

const COLORS = [
  "bg-blue-200 border-blue-400",
  "bg-green-200 border-green-400",
  "bg-yellow-200 border-yellow-400",
  "bg-purple-200 border-purple-400",
  "bg-pink-200 border-pink-400",
  "bg-indigo-200 border-indigo-400",
  "bg-red-200 border-red-400",
  "bg-orange-200 border-orange-400",
];

const LOCAL_STORAGE_KEY = "time-tracker-tasks";

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
  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // Filter tasks for selected date
  const filteredTasks = tasks.filter(
    (task) => task.date === format(selectedDate, "yyyy-MM-dd")
  );

  const handlePreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  // Generate time slots from 7 AM to 12 AM (68 slots of 15 minutes each)
  const timeSlots = Array.from({ length: 68 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 15;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  });

  const formatTime = (slot: number) => {
    return timeSlots[slot] || "";
  };

  const getSlotFromY = useCallback((y: number) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const relativeY = y - rect.top;
    const slotHeight = 40; // Each slot is 40px high
    return Math.max(0, Math.min(67, Math.floor(relativeY / slotHeight)));
  }, []);

  const isSlotOccupied = (slot: number, excludeTaskId?: string) => {
    return filteredTasks.some(
      (task) =>
        task.id !== excludeTaskId &&
        slot >= task.startSlot &&
        slot < task.endSlot
    );
  };

  const handleMouseDown = (e: React.MouseEvent, slot: number) => {
    e.preventDefault();

    // Check if clicking on an existing task
    const clickedTask = filteredTasks.find(
      (task) => slot >= task.startSlot && slot < task.endSlot
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

      console.log("Task resize debug:", {
        clickedSlot: slot,
        taskStart: clickedTask.startSlot,
        taskEnd: clickedTask.endSlot,
        relativeY,
        taskHeight: taskRect.height,
        isTopHalf,
        mouseY: e.clientY,
      });

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
    } else if (!isSlotOccupied(slot)) {
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

    // Only log when transitioning from click to drag or when slot changes
    if (
      (dragOperation.type === "click" && distance > 5) ||
      (dragOperation.type === "drag" &&
        currentSlot !== dragOperation.currentSlot)
    ) {
      console.log("Drag operation:", {
        type: dragOperation.type,
        resizeType: dragOperation.resizeType,
        currentSlot,
        distance,
        fromClickToDrag: dragOperation.type === "click" && distance > 5,
      });
    }

    // If we're in click state and moved more than 5px, transition to drag
    if (dragOperation.type === "click" && distance > 5) {
      setDragOperation((prev) => ({
        ...prev,
        type: "drag",
      }));
    }

    // Update current slot
    setDragOperation((prev) => ({
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
        (task) => slot >= task.startSlot && slot < task.endSlot
      );

      if (!clickedTask && !isSlotOccupied(slot)) {
        // Create a single-cell task
        const newTask: Task = {
          id: Date.now().toString(),
          startSlot: slot,
          endSlot: slot + 1,
          title: "",
          description: "",
          color: COLORS[filteredTasks.length % COLORS.length],
          date: format(selectedDate, "yyyy-MM-dd"),
        };
        setTasks((prev) => [...prev, newTask]);
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
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== dragOperation.resizingTask) return task;

            if (dragOperation.resizeType === "start") {
              const newStartSlot = Math.min(
                dragOperation.currentSlot,
                task.endSlot - 1
              );
              const finalStartSlot = Math.max(0, newStartSlot);

              // Ensure we don't conflict with other tasks
              let adjustedStartSlot = finalStartSlot;
              while (
                adjustedStartSlot < task.endSlot - 1 &&
                isSlotOccupied(adjustedStartSlot, task.id)
              ) {
                adjustedStartSlot++;
              }

              return { ...task, startSlot: adjustedStartSlot };
            } else {
              const newEndSlot = Math.max(
                dragOperation.currentSlot + 1,
                task.startSlot + 1
              );
              const finalEndSlot = Math.min(68, newEndSlot);

              // Check slots forward from the current position
              let adjustedEndSlot = task.startSlot + 1;
              while (
                adjustedEndSlot <= finalEndSlot &&
                !isSlotOccupied(adjustedEndSlot - 1, task.id)
              ) {
                adjustedEndSlot++;
              }
              adjustedEndSlot--; // Step back one slot to the last valid position

              return { ...task, endSlot: adjustedEndSlot };
            }
          })
        );
      } else {
        // Create new task
        const startSlot = Math.min(
          dragOperation.startPosition.slot,
          dragOperation.currentSlot
        );
        const endSlot =
          Math.max(
            dragOperation.startPosition.slot,
            dragOperation.currentSlot
          ) + 1;

        // Check if any slots are occupied
        const hasConflict = Array.from(
          { length: endSlot - startSlot },
          (_, i) => startSlot + i
        ).some((slot) => isSlotOccupied(slot));

        if (!hasConflict && endSlot > startSlot) {
          const newTask: Task = {
            id: Date.now().toString(),
            startSlot,
            endSlot,
            title: "",
            description: "",
            color: COLORS[filteredTasks.length % COLORS.length],
            date: format(selectedDate, "yyyy-MM-dd"),
          };
          setTasks((prev) => [...prev, newTask]);
          setSelectedTaskId(newTask.id);
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
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSelectedTaskId(null);
  };

  const getPreviewSlots = () => {
    if (dragOperation.type === "none") return null;

    if (dragOperation.type === "drag" && !dragOperation.resizingTask) {
      const startSlot = Math.min(
        dragOperation.startPosition.slot,
        dragOperation.currentSlot
      );
      const endSlot =
        Math.max(dragOperation.startPosition.slot, dragOperation.currentSlot) +
        1;
      return { startSlot, endSlot };
    } else if (
      dragOperation.type === "drag" &&
      dragOperation.resizingTask &&
      dragOperation.resizeType
    ) {
      const task = tasks.find((t) => t.id === dragOperation.resizingTask);
      if (!task) return null;

      if (dragOperation.resizeType === "start") {
        const newStartSlot = Math.min(
          dragOperation.currentSlot,
          task.endSlot - 1
        );
        return {
          startSlot: Math.max(0, newStartSlot),
          endSlot: task.endSlot,
        };
      } else {
        const newEndSlot = Math.max(
          dragOperation.currentSlot + 1,
          task.startSlot + 1
        );
        return {
          startSlot: task.startSlot,
          endSlot: Math.min(68, newEndSlot),
        };
      }
    }

    return null;
  };

  const previewSlots = getPreviewSlots();
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">
              {format(selectedDate, "MMMM d, yyyy")}
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Card className="p-6">
          <div
            ref={gridRef}
            className="relative select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Time grid */}
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className="flex border-b border-gray-200 h-10 hover:bg-gray-50 cursor-crosshair"
                onMouseDown={(e) => handleMouseDown(e, index)}
              >
                <div className="w-20 text-sm text-gray-600 py-2 px-2 border-r border-gray-200 bg-gray-100">
                  {time}
                </div>
                <div className="flex-1 relative">
                  {/* Preview for new task or resizing */}
                  {previewSlots &&
                    index >= previewSlots.startSlot &&
                    index < previewSlots.endSlot && (
                      <div className="absolute inset-0 bg-blue-200 border border-blue-400 opacity-50 z-10" />
                    )}
                </div>
              </div>
            ))}

            {/* Render tasks */}
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`absolute left-20 right-0 border-2 rounded cursor-move z-20 ${
                  task.color
                } ${selectedTaskId === task.id ? "ring-2 ring-blue-500" : ""}`}
                style={{
                  top: `${task.startSlot * 40}px`,
                  height: `${(task.endSlot - task.startSlot) * 40}px`,
                }}
                onMouseDown={(e) => handleMouseDown(e, task.startSlot)}
              >
                <div className="p-2 h-full overflow-hidden">
                  <div className="text-sm font-medium">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold">
                        {task.title || "Untitled Task"}
                      </span>
                      <span>
                        {formatTime(task.startSlot)} -{" "}
                        {formatTime(task.endSlot)}
                      </span>
                      <span>
                        {((task.endSlot - task.startSlot) * 15) / 60} hour/s
                      </span>
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-700 mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 text-sm text-gray-600 space-y-1">
          <p>
            <strong>Instructions:</strong>
          </p>
          <p>• Click on an empty time slot to create a single-cell task</p>
          <p>• Drag across empty time slots to create a multi-cell task</p>
          <p>• Click on a task to edit it in the sidebar</p>
          <p>• Drag the top half of a task to adjust start time</p>
          <p>• Drag the bottom half of a task to adjust end time</p>
        </div>
      </div>

      {/* Edit Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto sticky top-0 h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl font-semibold mb-4">Task Details</h2>

          {selectedTask ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  ref={titleInputRef}
                  placeholder="Task title"
                  value={selectedTask.title}
                  onChange={(e) =>
                    updateTask(selectedTask.id, { title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    {formatTime(selectedTask.startSlot)} -{" "}
                    {formatTime(selectedTask.endSlot)}
                  </span>
                  <span>
                    {((selectedTask.endSlot - selectedTask.startSlot) * 15) /
                      60}{" "}
                    hour/s
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Add description"
                  value={selectedTask.description}
                  onChange={(e) =>
                    updateTask(selectedTask.id, { description: e.target.value })
                  }
                  rows={5}
                />
              </div>

              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={() => deleteTask(selectedTask.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Task
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlignLeft className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Select a task to edit or create a new one</p>
            </div>
          )}
          {/* Recent Task Titles */}
          <div className="mt-12">
            <h3 className="text-md font-semibold mb-2">Recent Task Titles</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              {tasks
                .slice()
                .sort((a, b) => Number(b.id) - Number(a.id))
                .slice(0, 5)
                .map((task) => {
                  const isCopied = copiedTaskId === task.id;
                  const titleText = task.title || "Untitled Task";

                  const handleCopy = () => {
                    navigator.clipboard.writeText(titleText);
                    setCopiedTaskId(task.id);
                    setTimeout(() => setCopiedTaskId(null), 2000); // reset after 2 seconds
                  };

                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <div className="w-12 shrink-0 text-xs flex items-center justify-start text-blue-500">
                        <button
                          onClick={handleCopy}
                          className="w-full text-left"
                        >
                          {isCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <span className="truncate text-sm w-full text-left">
                        {titleText}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
