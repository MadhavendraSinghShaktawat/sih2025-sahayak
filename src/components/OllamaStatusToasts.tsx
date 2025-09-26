"use client";

import BasicToast from "@/components/smoothui/ui/BasicToast";
import { useOllamaStatus } from "@/hooks/useOllamaStatus";

export function OllamaStatusToasts() {
  const { showToast, toastMessage, toastType, setShowToast } = useOllamaStatus();

  return (
    <>
      {showToast && (
        <BasicToast
          message={toastMessage}
          type={toastType}
          duration={5000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
