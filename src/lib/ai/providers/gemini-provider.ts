import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisProvider, ModelAnalysisResult } from '../types';
import { parseAnalysisResponse } from '../prompt-builder';

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (client) return client;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

export const geminiProvider: AIAnalysisProvider = {
  provider: 'gemini',
  modelId: 'gemini-2.5-flash',

  isAvailable(): boolean {
    return !!process.env.GOOGLE_AI_API_KEY;
  },

  async analyze(prompt, fighterAName, fighterBName, isPickA, winProb): Promise<ModelAnalysisResult> {
    const start = Date.now();
    const genAI = getClient();
    if (!genAI) {
      throw new Error('Google AI API key not configured');
    }

    const model = genAI.getGenerativeModel({
      model: this.modelId,
      generationConfig: {
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const latencyMs = Date.now() - start;
    const text = result.response.text();
    const parsed = parseAnalysisResponse(text, fighterAName, fighterBName, isPickA, winProb);

    const usage = result.response.usageMetadata;
    const tokensUsed = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0);

    return {
      provider: this.provider,
      modelId: this.modelId,
      matchupSummary: parsed.matchupSummary,
      pickExplanation: parsed.pickExplanation,
      keyFactorNarrative: parsed.keyFactorNarrative,
      recommendedPick: parsed.recommendedPick,
      recommendedFighter: parsed.recommendedFighter,
      winProbability: parsed.winProbability,
      confidenceLevel: parsed.confidenceLevel,
      bettingInsight: parsed.bettingInsight,
      cautionFlags: [],
      tokensUsed,
      latencyMs,
    };
  },
};
