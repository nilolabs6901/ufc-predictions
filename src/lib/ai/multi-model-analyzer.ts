/**
 * Multi-model orchestrator
 * Discovers available AI providers, runs them in parallel, computes consensus
 */

import type { AIAnalysisProvider, ModelAnalysisResult, MultiModelResult } from './types';
import type { FighterAnalysisData, PredictionData, MatchupAnalysisInput, FactorBreakdownItem } from './matchup-analyzer';
import { buildAnalysisPrompt } from './prompt-builder';
import { computeConsensus } from './consensus';
import { claudeProvider } from './providers/claude-provider';
import { openaiProvider } from './providers/openai-provider';
import { geminiProvider } from './providers/gemini-provider';

const ALL_PROVIDERS: AIAnalysisProvider[] = [
  claudeProvider,
  openaiProvider,
  geminiProvider,
];

const TIMEOUT_MS = 30_000;

function getAvailableProviders(): AIAnalysisProvider[] {
  return ALL_PROVIDERS.filter(p => p.isAvailable());
}

export async function runMultiModelAnalysis(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData,
  context: MatchupAnalysisInput['context'],
  factorBreakdown: FactorBreakdownItem[]
): Promise<MultiModelResult> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error('No AI providers available. Configure at least one API key.');
  }

  const isPickA = prediction.fighterAWinProb > 0.5;
  const winProb = isPickA ? prediction.fighterAWinProb : prediction.fighterBWinProb;

  // Build the shared prompt (all models get the same one)
  const prompt = buildAnalysisPrompt(fighterA, fighterB, prediction, context, factorBreakdown);

  // Run all providers in parallel with timeout
  const results = await Promise.allSettled(
    providers.map(provider =>
      Promise.race([
        provider.analyze(prompt, fighterA.name, fighterB.name, isPickA, winProb),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${provider.provider} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        ),
      ])
    )
  );

  // Collect analyses, including errors
  const analyses: ModelAnalysisResult[] = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // Failed provider — create error entry
    const provider = providers[i];
    console.error(`[${provider.provider}] Analysis failed:`, result.reason);
    return {
      provider: provider.provider,
      modelId: provider.modelId,
      matchupSummary: '',
      pickExplanation: '',
      recommendedPick: (isPickA ? 'fighterA' : 'fighterB') as 'fighterA' | 'fighterB',
      recommendedFighter: isPickA ? fighterA.name : fighterB.name,
      winProbability: winProb,
      confidenceLevel: 'low' as const,
      cautionFlags: [],
      tokensUsed: 0,
      latencyMs: 0,
      error: result.reason?.message || 'Unknown error',
    };
  });

  // Compute consensus from successful analyses
  const consensus = computeConsensus(analyses);

  // Pick the best successful analysis as primary (prefer Claude, then OpenAI, then Gemini)
  const priority = ['claude', 'openai', 'gemini'];
  const successfulAnalyses = analyses.filter(a => !a.error);
  const primaryAnalysis = successfulAnalyses.length > 0
    ? successfulAnalyses.sort((a, b) => priority.indexOf(a.provider) - priority.indexOf(b.provider))[0]
    : analyses[0]; // fallback to first even if error

  return {
    analyses,
    consensus,
    primaryAnalysis,
  };
}
