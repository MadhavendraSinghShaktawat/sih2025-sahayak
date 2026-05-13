export interface LLMProvider {
  name: string;
  generateContent(prompt: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface LLMConfig {
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

/**
 * OpenAI Chat Completions (JSON mode). Used when OPENAI_API_KEY is set.
 */
export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are an educational quiz generator. Follow the user instructions and return only valid JSON when JSON is requested.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenAI returned empty content");
    }
    return text;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    try {
      const response = await fetch(
        "https://api.openai.com/v1/models?limit=1",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - just verify API key is valid by checking models endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class OllamaProvider implements LLMProvider {
  name = "ollama";
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.model = model;
  }

  async generateContent(prompt: string): Promise<string> {
    // First, get the actual model name from Ollama
    const tagsResponse = await fetch(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!tagsResponse.ok) {
      throw new Error(`Ollama tags API error: ${tagsResponse.status} ${tagsResponse.statusText}`);
    }

    const tagsData = await tagsResponse.json();
    const availableModel = tagsData.models?.find((model: any) => 
      model.name === this.model || 
      model.name === `${this.model}:latest` ||
      model.name === `${this.model}:7b` ||
      model.name === `${this.model}:13b`
    );

    if (!availableModel) {
      throw new Error(`Model '${this.model}' not found in Ollama`);
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: availableModel.name, // Use the actual model name from Ollama
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
      const errorText = await response.text();
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data.response || "";
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if Ollama is running by trying to list models
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Ollama health check failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      // Check if our model is available (exact match or with :latest suffix)
      const hasOurModel = data.models?.some((model: any) => 
        model.name === this.model || 
        model.name === `${this.model}:latest` ||
        model.name === `${this.model}:7b` ||
        model.name === `${this.model}:13b`
      );
      const hasAnyModels = data.models && data.models.length > 0;
      
      if (hasOurModel) {
        return true;
      } else if (hasAnyModels) {
        console.warn(`Ollama is running but model '${this.model}' not found. Available models:`, 
          data.models?.map((m: any) => m.name));
        return false; // Model not available
      } else {
        console.warn("Ollama is running but no models found");
        return false;
      }
    } catch (error) {
      console.warn("Ollama availability check failed:", error);
      return false;
    }
  }
}

export class LLMService {
  private providers: LLMProvider[];
  private fallbackOrder: string[];

  constructor(config: LLMConfig) {
    this.providers = [];
    this.fallbackOrder = [];

    console.log("Initializing LLM Service with config:", {
      hasOpenAIKey: !!config.openaiApiKey,
      openaiModel: config.openaiModel,
      hasGeminiKey: !!config.geminiApiKey,
      ollamaUrl: config.ollamaUrl,
      ollamaModel: config.ollamaModel,
    });

    if (config.openaiApiKey) {
      const model = config.openaiModel || "gpt-3.5-turbo";
      const openaiProvider = new OpenAIProvider(config.openaiApiKey, model);
      this.providers.push(openaiProvider);
      this.fallbackOrder.push("openai");
      console.log("Added OpenAI provider:", model);
    }

    if (config.geminiApiKey) {
      const geminiProvider = new GeminiProvider(config.geminiApiKey);
      this.providers.push(geminiProvider);
      this.fallbackOrder.push("gemini");
      console.log("Added Gemini provider");
    }

    if (config.ollamaUrl && config.ollamaModel) {
      const ollamaProvider = new OllamaProvider(config.ollamaUrl, config.ollamaModel);
      this.providers.push(ollamaProvider);
      this.fallbackOrder.push("ollama");
      console.log("Added Ollama provider:", config.ollamaUrl, config.ollamaModel);
    }

    console.log("LLM Service initialized with providers:", this.fallbackOrder);
  }

  async generateContent(prompt: string): Promise<{ content: string; provider: string }> {
    console.log("Starting content generation with providers:", this.fallbackOrder);
    
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.find(p => p.name === providerName);
      if (!provider) {
        console.warn(`Provider ${providerName} not found in providers list`);
        continue;
      }

      try {
        console.log(`Checking availability of ${providerName}...`);
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.warn(`Provider ${providerName} is not available, trying next...`);
          continue;
        }

        console.log(`Using provider ${providerName} for content generation`);
        const content = await provider.generateContent(prompt);
        console.log(`Content generated successfully by ${providerName}`);
        return { content, provider: providerName };
      } catch (error) {
        console.warn(`Provider ${providerName} failed:`, error);
        continue;
      }
    }

    console.error("All LLM providers are unavailable");
    throw new Error("All LLM providers are unavailable");
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          available.push(provider.name);
        }
      } catch {
        // Provider not available
      }
    }

    return available;
  }
}

// Factory function to create LLM service with environment variables
export function createLLMService(): LLMService {
  const config: LLMConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    geminiApiKey: process.env.GEMINI_API_KEY,
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL || "tinyllama",
  };

  return new LLMService(config);
}
