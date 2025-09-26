// Service Worker Registration Utility
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  public async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker: Not supported in this browser');
      return false;
    }

    try {
      console.log('Service Worker: Registering...');
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker: Registered successfully', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker: Update found');
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Service Worker: New version available');
              // You can show a notification to the user here
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker: Registration failed', error);
      return false;
    }
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker: Unregistered', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker: Unregistration failed', error);
      return false;
    }
  }

  public isRegistered(): boolean {
    return this.registration !== null;
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Send message to service worker
  public async sendMessage(message: any): Promise<any> {
    if (!this.registration || !this.registration.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Service Worker message timeout'));
      }, 5000);
    });
  }
}

import React from 'react';

// Hook for React components
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    const swManager = ServiceWorkerManager.getInstance();
    
    // Check if service worker is supported
    setIsSupported('serviceWorker' in navigator);

    // Register service worker
    if ('serviceWorker' in navigator) {
      swManager.register().then((success) => {
        setIsRegistered(success);
      });
    }

    // Listen for service worker state changes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker: Controller changed');
        setIsRegistered(swManager.isRegistered());
      });
    }
  }, []);

  return {
    isRegistered,
    isSupported,
    register: () => ServiceWorkerManager.getInstance().register(),
    unregister: () => ServiceWorkerManager.getInstance().unregister(),
    sendMessage: (message: any) => ServiceWorkerManager.getInstance().sendMessage(message)
  };
}
