"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface FeatureAnnouncementProps {
    isOpen   : boolean;
    onClose  : () => void;
    onTryDemo: () => void;
}

export function FeatureAnnouncement({
    isOpen,
    onClose,
    onTryDemo,
}: Readonly<FeatureAnnouncementProps>) {
    const [isDemoMode, setIsDemoMode] = useState(false);

    if (!isOpen) return null;

    const handleTryDemo = () => {
        setIsDemoMode(true);
        onTryDemo();

          // Auto-close after demo
        setTimeout(() => {
            setIsDemoMode(false);
            onClose();
        }, 3000);
    };

    return (
        <div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className = "bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className = "flex items-center justify-between mb-4">
        <h2  className = "text-xl font-bold text-gray-900 dark:text-white">
                        🎉 New Feature!
                    </h2>
                    <button
                        onClick   = {onClose}
                        className = "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg
                            className = "w-6 h-6"
                            fill      = "none"
                            stroke    = "currentColor"
                            viewBox   = "0 0 24 24"
                        >
                            <path
                                strokeLinecap  = "round"
                                strokeLinejoin = "round"
                                strokeWidth    = {2}
                                d              = "M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className = "space-y-4">
                <div className = "flex items-center space-x-3">
                <div className = "bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                            <svg
                                className = "w-6 h-6 text-blue-600 dark:text-blue-400"
                                fill      = "none"
                                stroke    = "currentColor"
                                viewBox   = "0 0 24 24"
                            >
                                <path
                                    strokeLinecap  = "round"
                                    strokeLinejoin = "round"
                                    strokeWidth    = {2}
                                    d              = "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className = "font-semibold text-gray-900 dark:text-white">
                                Undo with Keyboard Shortcut
                            </h3>
                            <p className = "text-sm text-gray-600 dark:text-gray-300">
                                Press{" "}
                                <kbd className = "px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                    Ctrl+Z
                                </kbd>{" "}
                                to undo your last action
                            </p>
                        </div>
                    </div>

                    <div className = "bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4  className = "font-medium text-gray-900 dark:text-white mb-2">
                            How it works:
                        </h4>
                        <ul className = "text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• Create, edit, or delete tasks</li>
                            <li>
                                • Press{" "}
                                <kbd className = "px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                                    Ctrl+Z
                                </kbd>{" "}
                                to undo
                            </li>
                            <li>• Works with all task operations</li>
                            <li>• Supports up to 50 undo levels</li>
                        </ul>
                    </div>

                    <div className = "flex space-x-3">
                        <Button
                            onClick   = {handleTryDemo}
                            disabled  = {isDemoMode}
                            className = "flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isDemoMode ? "Demo Running..." : "Try Demo"}
                        </Button>
                        <Button
                            onClick   = {onClose}
                            variant   = "outline"
                            className = "flex-1"
                        >
                            Got it!
                        </Button>
                    </div>

                    {isDemoMode && (
                        <div className = "bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                            <p   className = "text-sm text-green-800 dark:text-green-200">
                                ✨ Demo complete! Try creating a task and
                                pressing Ctrl+Z to undo it.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
