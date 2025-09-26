"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { NetworkStatusToasts } from "@/components/NetworkStatusToasts";

export default function NetworkStatusExample() {
  const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Network Status</h2>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} 
          />
          <span className="font-medium">
            Status: {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          Connection Type: {connectionType || 'Unknown'}
        </div>
        
        {isSlowConnection && (
          <div className="text-sm text-amber-600">
            ⚠️ Slow connection detected
          </div>
        )}
      </div>

      {/* Network status toasts */}
      <NetworkStatusToasts />
    </div>
  );
}
