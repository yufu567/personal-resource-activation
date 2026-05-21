import { z } from "zod";

export const aiConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "mock"]).default("mock"),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

// In-memory config store for MVP
const configs = new Map<string, AIConfig>();

export function getAIConfig(userId: string): AIConfig {
  return configs.get(userId) ?? { provider: "mock" };
}

export function setAIConfig(userId: string, config: AIConfig): void {
  configs.set(userId, aiConfigSchema.parse(config));
}
