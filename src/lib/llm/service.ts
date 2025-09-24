import {
  LLMProvider,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "./types";
import { GeminiProvider } from "./providers/gemini";

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string = "gemini";

  constructor() {
    this.registerProvider(new GeminiProvider());
  }

  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  setDefaultProvider(providerName: string): void {
    if (this.providers.has(providerName)) {
      this.defaultProvider = providerName;
    } else {
      throw new Error(`Provider ${providerName} not found`);
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.values())
      .filter((provider) => provider.isAvailable())
      .map((provider) => provider.name);
  }

  async generateQuiz(
    request: QuizGenerationRequest,
    providerName?: string
  ): Promise<QuizGenerationResponse> {
    const provider = providerName
      ? this.providers.get(providerName)
      : this.providers.get(this.defaultProvider);

    if (!provider) {
      return {
        success: false,
        error: `Provider ${providerName || this.defaultProvider} not found`,
        provider: providerName || this.defaultProvider,
      };
    }

    if (!provider.isAvailable()) {
      return {
        success: false,
        error: `Provider ${provider.name} is not available (missing API key)`,
        provider: provider.name,
      };
    }

    return await provider.generateQuiz(request);
  }

  // Utility method to get provider info
  getProviderInfo(providerName: string) {
    const provider = this.providers.get(providerName);
    return provider
      ? {
          name: provider.name,
          available: provider.isAvailable(),
        }
      : null;
  }
}

// Singleton instance
export const llmService = new LLMService();
