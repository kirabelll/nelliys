"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface RealTimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

export function RealTimeIndicator({ isConnected, lastUpdate }: RealTimeIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  if (isConnected) {
    return (
      <Badge 
        variant="default" 
        className={`flex items-center gap-1 transition-all ${showPulse ? 'animate-pulse bg-green-600' : ''}`}
      >
        <Wifi className="h-3 w-3" />
        Live Updates
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <RefreshCw className="h-3 w-3" />
      Polling Mode
    </Badge>
  );
}