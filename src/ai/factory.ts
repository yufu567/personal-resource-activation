import { createMockAIProvider } from "./mock-provider";
import { createOpenAIProvider } from "./openai-provider";
import { createAnthropicProvider } from "./anthropic-provider";
import { getAIConfig, type AIConfig } from "./config";
import { loadSpec, type SpecContext } from "./spec-loader";
import type { AIProvider } from "./types";

let cachedSpec: SpecContext | null = null;

function getSpec(domain?: string): SpecContext {
  // Always reload in dev so spec edits take effect immediately
  if (process.env.NODE_ENV === "development") {
    return loadSpec(domain);
  }
  cachedSpec ??= loadSpec(domain);
  return cachedSpec;
}

export function createAIProvider(config?: AIConfig, domain?: string): AIProvider {
  const resolved = config ?? getAIConfig("demo-user");
  const spec = getSpec(domain);

  switch (resolved.provider) {
    case "openai": {
      if (!resolved.apiKey) throw new Error("OpenAI API key is required");
      return createOpenAIProvider(resolved.apiKey, spec, resolved.baseUrl, resolved.model);
    }
    case "anthropic": {
      if (!resolved.apiKey) throw new Error("Anthropic API key is required");
      return createAnthropicProvider(resolved.apiKey, spec, resolved.model ?? "claude-sonnet-4-20250514");
    }
    case "mock":
    default:
      return createMockAIProvider();
  }
}

export { getSpec, type SpecContext };
