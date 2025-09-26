"use client";

import { useEffect, useState } from "react";
import { useNetworkState } from "@uidotdev/usehooks";

interface UseNetworkStatusReturn {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const network = useNetworkState();
  const [wasOffline, setWasOffline] = useState(false);

  const isOnline = network.online;
  const isSlowConnection = network.effectiveType === "slow-2g" || network.effectiveType === "2g";
  const connectionType = network.effectiveType;

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
    }
    
    if (isOnline && wasOffline) {
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
  };
}
