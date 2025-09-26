"use client";

import { useEffect } from 'react';
import { ServiceWorkerManager } from '@/lib/serviceWorker';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on app load
    const swManager = ServiceWorkerManager.getInstance();
    
    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      swManager.register().then((success) => {
        if (success) {
          console.log('Service Worker: Successfully registered');
        } else {
          console.log('Service Worker: Registration failed');
        }
      });
    } else {
      console.log('Service Worker: Skipped in development mode');
    }
  }, []);

  return <>{children}</>;
}
