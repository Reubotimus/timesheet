"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Mail,
  AlertCircle 
} from "lucide-react";
import { harvestClient } from "@/lib/harvest-forecast";
import { MicrosoftGraphClient } from "@/lib/microsoft-graph";

interface HarvestConnectionStatusProps {
  onConnectionEstablished?: (userId: string) => void;
}

export default function HarvestConnectionStatus({ onConnectionEstablished }: HarvestConnectionStatusProps) {
  const { data: session } = useSession();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [harvestUserId, setHarvestUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const currentUserId = harvestClient.getUserId();
    if (currentUserId) {
      setHarvestUserId(currentUserId);
      setConnectionStatus('connected');
      onConnectionEstablished?.(currentUserId);
    }
  }, [onConnectionEstablished]);

  const connectToHarvest = async () => {
    if (!session?.user?.accessToken) {
      setErrorMessage('No access token available. Please sign in again.');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      const graphClient = new MicrosoftGraphClient(session.user.accessToken);
      const userEmail = await graphClient.getUserEmail();
      
      if (!userEmail) {
        throw new Error('Could not retrieve your email address from Office 365. Please try again.');
      }
      
      const userId = await harvestClient.findUserIdByEmail(userEmail);
      
      if (userId) {
        harvestClient.setUserId(userId);
        setHarvestUserId(userId);
        setConnectionStatus('connected');
        onConnectionEstablished?.(userId);
      } else {
        throw new Error(
          `Could not find a Harvest user with email: ${userEmail}\n\n`
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to Harvest');
      setConnectionStatus('error');
    }
  };

  const disconnectFromHarvest = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('harvest_user_id');
    }
    
    setHarvestUserId(null);
    setConnectionStatus('disconnected');
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to Harvest';
      case 'connecting':
        return 'Connecting to Harvest...';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold">Harvest Forecast Connection</h3>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {harvestUserId && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">User ID:</span> {harvestUserId}
          </div>
        )}

        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line">{errorMessage}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {connectionStatus === 'disconnected' && (
            <Button 
              onClick={connectToHarvest} 
              disabled={!session?.user?.accessToken}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Auto-Connect via Email
            </Button>
          )}

          {connectionStatus === 'connecting' && (
            <Button disabled className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Connecting...
            </Button>
          )}

          {connectionStatus === 'connected' && (
            <Button 
              variant="outline" 
              onClick={disconnectFromHarvest}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Disconnect
            </Button>
          )}

          {connectionStatus === 'error' && (
            <Button 
              onClick={connectToHarvest} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          )}
        </div>

        {connectionStatus === 'disconnected' && (
          <div className="text-xs text-gray-500">
            <p>• We will use your Office 365 email to find your Harvest Forecast account</p>
            <p>• This automatically connects you to the right Harvest user profile</p>
            <p>• No emails are searched - we only use your email address</p>
          </div>
        )}
      </div>
    </Card>
  );
}
