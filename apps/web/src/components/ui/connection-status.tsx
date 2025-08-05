"use client";

import { useSocket } from "@/hooks/useSocket";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected, error } = useSocket();

  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        Connection Error
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isConnected ? "default" : "secondary"} 
      className="flex items-center gap-1"
    >
      <Wifi className="h-3 w-3" />
      {isConnected ? "Live" : "Connecting..."}
    </Badge>
  );
}