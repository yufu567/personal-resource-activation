export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "web" | "user-resource" | "ai-knowledge";
  confidence: "high" | "medium" | "low";
}
