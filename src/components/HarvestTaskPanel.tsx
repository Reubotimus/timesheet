"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Clock, Building2, Loader2, AlertCircle } from "lucide-react";
import { harvestClient } from "@/lib/harvest-forecast";
import type { HarvestTaskItem } from "@/lib/types";

interface HarvestTaskPanelProps {
  selectedDate: Date;
  onTaskDragStart?: (task: HarvestTaskItem, e: React.DragEvent) => void;
}

export default function HarvestTaskPanel({ selectedDate, onTaskDragStart }: HarvestTaskPanelProps) {
  const [harvestTasks, setHarvestTasks] = useState<HarvestTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connected = harvestClient.isConfigured();
      setIsConnected(connected);
      
      if (!connected) {
        setError('Harvest Forecast not connected. Please connect via Office 365 first.');
      } else {
        setError(null);
      }
    };

    checkConnection();
    
    const handleStorageChange = () => {
      checkConnection();
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(checkConnection, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const fetchHarvestTasks = async () => {
    if (!isConnected) {
      setError('Please connect to Harvest Forecast first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await harvestClient.getTaskItems();
      setHarvestTasks(tasks);
      setLastFetchTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Harvest tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (task: HarvestTaskItem, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'harvest-task',
      task: task
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    onTaskDragStart?.(task, e);
  };

  if (!isConnected) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Harvest Schedule</h3>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          Connect to Harvest Forecast to view and schedule your tasks.
        </div>
        
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
          <strong>Not Connected:</strong> Please use the connection panel above to connect to Harvest via Office 365.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Harvest Schedule</h3>
        <Button
          onClick={fetchHarvestTasks}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isLoading ? 'Fetching...' : 'Fetch from Harvest'}
        </Button>
      </div>

      {lastFetchTime && (
        <p className="text-xs text-gray-500">
          Last updated: {lastFetchTime.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {harvestTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading tasks...
              </div>
            ) : (
              'No Harvest tasks for this date. Click "Fetch from Harvest" to load.'
            )}
          </div>
        ) : (
          harvestTasks.map((task) => (
            <Card
              key={task.id}
              className="p-3 cursor-move hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: task.color }}
              draggable
              onDragStart={(e) => handleDragStart(task, e)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {task.duration}h
                  </div>
                </div>

                {task.clientName && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Building2 className="w-3 h-3" />
                    {task.clientName}
                  </div>
                )}

                {task.description && (
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="text-xs text-gray-500">
                  Drag to calendar to schedule
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {harvestTasks.length > 0 && (
        <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded border">
          <strong>Tip:</strong> Drag any task from above to the calendar to schedule it at a specific time.
        </div>
      )}
    </div>
  );
} 