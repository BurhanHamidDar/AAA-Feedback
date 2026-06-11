import { openrouterConfig } from "../../config/openrouter";
import { logger } from "../../utils/logger";
import {
  FeedbackCategory,
  FeedbackSentiment,
  FeedbackPriority,
} from "@aaa-feedback/shared";
import { supabase } from "../../config/supabase";
import { hasSystemSettingsTable } from "../../utils/schema";

export interface AIAnalysisResult {
  summary: string;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  priority: FeedbackPriority;
  modelUsed: string;
  processingTimeMs: number;
}

// Allowed values check
function isValidCategory(val: string): val is FeedbackCategory {
  return Object.values(FeedbackCategory).includes(val as FeedbackCategory);
}

function isValidSentiment(val: string): val is FeedbackSentiment {
  return Object.values(FeedbackSentiment).includes(val as FeedbackSentiment);
}

function isValidPriority(val: string): val is FeedbackPriority {
  return Object.values(FeedbackPriority).includes(val as FeedbackPriority);
}

/**
 * Fallback defaults when AI processing fails completely.
 */
function getFallbackDefaults(): AIAnalysisResult {
  return {
    summary: "AI summary unavailable.",
    category: FeedbackCategory.GENERAL,
    sentiment: FeedbackSentiment.NEUTRAL,
    priority: FeedbackPriority.MEDIUM,
    modelUsed: "None (Fallback Default)",
    processingTimeMs: 0,
  };
}

/**
 * Call a specific OpenRouter model with a structured JSON prompt and timeout.
 */
async function callModel(model: string, text: string, timeoutMs = 15000): Promise<Omit<AIAnalysisResult, "modelUsed" | "processingTimeMs">> {
  const apiKey = openrouterConfig.apiKey;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not set.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${openrouterConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...openrouterConfig.headers,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are the AI Assistant for AAA Feedback, the official feedback management platform of Ayesha Ali Academy.
Your task is to analyze feedback submitted by students, parents, and staff, summarize it, and classify it.

You must return a raw JSON object matching the following structure:
{
  "summary": "A concise, professional one-sentence summary in English, summarizing the main concern (max 120 characters). Do not include intro/outro words.",
  "category": "Academics" | "Transport" | "Infrastructure" | "Staff" | "Discipline" | "Administration" | "Facilities" | "Safety" | "General" | "Other",
  "sentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
  "priority": "Low" | "Medium" | "High" | "Critical"
}

Classification Rules:
- category:
  - "Academics": lessons, homework, exams, grades, teacher quality, curriculum, or school books.
  - "Transport": school bus, routes, pickup/drop times, driver behavior, transportation issues.
  - "Infrastructure": school building, classrooms, toilets, heating/cooling, labs, boundary walls, desks.
  - "Staff": behavior of non-teaching staff, administration staff, security guards, office clerks.
  - "Discipline": bullying, student behavior, rules enforcement, dress code, fighting, uniform.
  - "Administration": fee payment, admissions, calendar, school communications, principal decisions, circulars.
  - "Facilities": playground, sports equipment, canteen, library, computer room, drinking water.
  - "Safety": physical security, hazards, road crossing safety, internet safety, security threats.
  - "General": general suggestions, appreciation, generic remarks, or queries that don't fit complaints.
  - "Other": anything else that does not match the above.
- sentiment:
  - "Positive": appreciation, praise, happy feedback.
  - "Negative": complaints, issues, problems, worries.
  - "Neutral": standard queries, suggestions without strong emotion.
  - "Mixed": contains both positive praise and serious complaints/issues.
- priority:
  - "Critical": physical safety hazards, active bullying, child protection issues, major safety failures.
  - "High": serious teaching quality concerns, major bus delays (>30 mins), broken heating/cooling in extreme weather.
  - "Medium": standard complaints, suggestions, queries, standard feedback.
  - "Low": general remarks, appreciation, minor suggestions.

Response Format:
- Return ONLY valid JSON.
- Do NOT wrap in markdown code blocks like \`\`\`json.
- Do NOT include any additional comments or text outside the JSON object.
- Make sure keys and values are exactly as defined above (case-sensitive).`,
          },
          {
            role: "user",
            content: `Feedback raw text: "${text.replace(/"/g, '\\"')}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API responded with status ${response.status}: ${errorText}`);
    }

    const resBody = (await response.json()) as any;
    const content = resBody.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenRouter completion returned empty content");
    }

    logger.debug(`OpenRouter raw response content: ${content}`);

    // Parse the JSON output
    const parsed = JSON.parse(content);

    // Server-side validate types
    if (!parsed.summary || typeof parsed.summary !== "string") {
      throw new Error("AI output validation failed: invalid summary format");
    }

    const category = parsed.category;
    if (!isValidCategory(category)) {
      throw new Error(`AI output validation failed: invalid category "${category}"`);
    }

    const sentiment = parsed.sentiment;
    if (!isValidSentiment(sentiment)) {
      throw new Error(`AI output validation failed: invalid sentiment "${sentiment}"`);
    }

    const priority = parsed.priority;
    if (!isValidPriority(priority)) {
      throw new Error(`AI output validation failed: invalid priority "${priority}"`);
    }

    return {
      summary: parsed.summary.trim(),
      category,
      sentiment,
      priority,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Analyzes feedback text using OpenRouter with primary (Qwen) and fallback (DeepSeek) models.
 */
export async function analyzeFeedback(text: string): Promise<AIAnalysisResult> {
  let primaryModel = openrouterConfig.model || "openrouter/free";
  const fallbackModel = "openrouter/free";

  if (hasSystemSettingsTable) {
    try {
      const { data: modelSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "ai_model_preference")
        .maybeSingle();

      if (modelSetting?.value === "advanced") {
        primaryModel = "google/gemini-2.5-flash"; // Or another advanced model
      }
    } catch (err) {
      logger.warn("Could not retrieve ai_model_preference setting, using default.", err);
    }
  }
  
  const startTime = Date.now();

  // Try Primary Model
  try {
    logger.info(`AI Integration: Attempting analysis with primary model (${primaryModel})...`);
    const result = await callModel(primaryModel, text);
    const processingTimeMs = Date.now() - startTime;
    
    logger.info(`AI Success: Analyzed using ${primaryModel} in ${processingTimeMs}ms.`);
    return {
      ...result,
      modelUsed: primaryModel,
      processingTimeMs,
    };
  } catch (primaryError: any) {
    const errorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
    logger.warn(`AI Primary Failed (${primaryModel}): ${errorMsg}. Retrying with fallback model...`);

    // Try Fallback Model
    try {
      const fallbackStartTime = Date.now();
      logger.info(`AI Integration: Attempting analysis with fallback model (${fallbackModel})...`);
      const result = await callModel(fallbackModel, text);
      const processingTimeMs = Date.now() - startTime; // total time from start
      const fallbackTimeMs = Date.now() - fallbackStartTime;
      
      logger.info(`AI Success: Fallback analyzed using ${fallbackModel} in ${fallbackTimeMs}ms (Total: ${processingTimeMs}ms).`);
      return {
        ...result,
        modelUsed: fallbackModel,
        processingTimeMs,
      };
    } catch (fallbackError: any) {
      const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      logger.error(`AI Failure: Both primary and fallback models failed. Fallback error: ${fallbackErrorMsg}`);
      
      // Return safe defaults on total failure
      const totalTimeMs = Date.now() - startTime;
      const defaults = getFallbackDefaults();
      return {
        ...defaults,
        processingTimeMs: totalTimeMs,
      };
    }
  }
}
