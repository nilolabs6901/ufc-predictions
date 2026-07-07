import Anthropic from '@anthropic-ai/sdk';
import type { AIAnalysisProvider, ModelAnalysisResult } from '../types';
import { parseAnalysisResponse } from '../prompt-builder';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.UFC_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export const claudeProvider: AIAnalysisProvider = {
  provider: 'claude',
  modelId: 'claude-sonnet-4-20250514',

  isAvailable(): boolean {
    return !!(process.env.UFC_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY);
  },

  async analyze(prompt, fighterAName, fighterBName, isPickA, winProb): Promise<ModelAnalysisResult> {
    const start = Date.now();
    const anthropic = getClient();
    if (!anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await anthropic.messages.create({
      model: this.modelId,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - start;
    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const parsed = parseAnalysisResponse(content.text, fighterAName, fighterBName, isPickA, winProb);
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

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
