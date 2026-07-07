import OpenAI from 'openai';
import type { AIAnalysisProvider, ModelAnalysisResult } from '../types';
import { parseAnalysisResponse } from '../prompt-builder';

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

export const openaiProvider: AIAnalysisProvider = {
  provider: 'openai',
  modelId: 'gpt-4o',

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  async analyze(prompt, fighterAName, fighterBName, isPickA, winProb): Promise<ModelAnalysisResult> {
    const start = Date.now();
    const openai = getClient();
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: this.modelId,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert MMA analyst. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const latencyMs = Date.now() - start;
    const text = response.choices[0]?.message?.content || '';
    const parsed = parseAnalysisResponse(text, fighterAName, fighterBName, isPickA, winProb);
    const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

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
