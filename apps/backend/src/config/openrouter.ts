import { logger } from "../utils/logger";

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "openrouter/free";

if (!apiKey) {
  logger.warn(
    "OPENROUTER_API_KEY not set. AI processing will be unavailable."
  );
}

export const openrouterConfig = {
  apiKey,
  model,
  baseUrl: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://aaa-feedback.vercel.app",
    "X-Title": "AAA Feedback - Ayesha Ali Academy",
    "Content-Type": "application/json",
  },
} as const;

logger.debug(`OpenRouter configured with model: ${model}`);
