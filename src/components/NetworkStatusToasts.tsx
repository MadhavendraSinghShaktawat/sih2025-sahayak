"use client";

import { useEffect, useState } from "react";
import BasicToast from "@/components/smoothui/ui/BasicToast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function NetworkStatusToasts() {
  const { isOnline } = useNetworkStatus();
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setShowOfflineToast(true);
      setWasOffline(true);
    }
    
    if (isOnline && wasOffline) {
      setShowOnlineToast(true);
      setWasOffline(false);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {showOfflineToast && (
        <BasicToast
          message="You're offline. Some features may not work properly."
          type="warning"
          duration={5000}
          onClose={() => setShowOfflineToast(false)}
        />
      )}
      
      {showOnlineToast && (
        <BasicToast
          message="You're back online! All features are now available."
          type="success"
          duration={3000}
          onClose={() => setShowOnlineToast(false)}
        />
      )}
    </>
  );
}
