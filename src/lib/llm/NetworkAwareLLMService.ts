"use client";

import { createLLMService, LLMService } from "./LLMService";

// Client-side LLM service that respects network status
export class NetworkAwareLLMService {
  private llmService: LLMService;
  private isOnline: boolean;

  constructor() {
    this.llmService = createLLMService();
    this.isOnline = navigator.onLine;
    
    // Listen for network changes
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async generateContent(prompt: string): Promise<{ content: string; provider: string }> {
    if (this.isOnline) {
      // Try Gemini first when online
      try {
        return await this.llmService.generateContent(prompt);
      } catch (error) {
        console.warn("Online provider failed, falling back to local:", error);
        // Fall back to Ollama even when online if Gemini fails
        return await this.generateWithOllama(prompt);
      }
    } else {
      // Use Ollama when offline
      return await this.generateWithOllama(prompt);
    }
  }

  private async generateWithOllama(prompt: string): Promise<{ content: string; provider: string }> {
    try {
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
      const ollamaModel = process.env.NEXT_PUBLIC_OLLAMA_MODEL || "tinyllama";
      
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_k: 40,
            top_p: 0.95,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { content: data.response || "", provider: "ollama" };
    } catch (error) {
      throw new Error(`Local LLM unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isOllamaAvailable(): Promise<boolean> {
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
        return false;
      }

      const data = await response.json();
      return data.models?.some((model: any) => model.name === ollamaModel) || false;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let networkAwareLLMService: NetworkAwareLLMService | null = null;

export function getNetworkAwareLLMService(): NetworkAwareLLMService {
  if (!networkAwareLLMService) {
    networkAwareLLMService = new NetworkAwareLLMService();
  }
  return networkAwareLLMService;
}
