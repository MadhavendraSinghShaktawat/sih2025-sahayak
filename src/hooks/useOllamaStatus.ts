"use client";

import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function useOllamaStatus() {
  const { isOnline } = useNetworkStatus();
  const [isOllamaAvailable, setIsOllamaAvailable] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  const checkOllamaAvailability = async () => {
    try {
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
      const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "tinyllama";
      
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setIsOllamaAvailable(false);
        return false;
      }

      const data = await response.json();
      const isAvailable = data.models?.some((model: any) => model.name === ollamaModel) || false;
      setIsOllamaAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      setIsOllamaAvailable(false);
      return false;
    }
  };

  useEffect(() => {
    // Check Ollama availability when component mounts
    checkOllamaAvailability();
  }, []);

  useEffect(() => {
    // Show toast when going offline and Ollama is not available
    if (!isOnline && isOllamaAvailable === false) {
      setToastMessage("You're offline and local AI is not available. Some features may not work.");
      setToastType("warning");
      setShowToast(true);
    }
    
    // Show toast when going online
    if (isOnline && isOllamaAvailable === false) {
      setToastMessage("You're back online! All AI features are now available.");
      setToastType("success");
      setShowToast(true);
    }
  }, [isOnline, isOllamaAvailable]);

  return {
    isOllamaAvailable,
    checkOllamaAvailability,
    showToast,
    toastMessage,
    toastType,
    setShowToast,
  };
}
