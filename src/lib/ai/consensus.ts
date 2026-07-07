/**
 * Consensus computation for multi-model AI analysis
 * Determines unanimous/majority/split agreement across model picks
 */

import type { ModelAnalysisResult, ConsensusResult } from './types';

export function computeConsensus(analyses: ModelAnalysisResult[]): ConsensusResult {
  const successful = analyses.filter(a => !a.error);
  const total = analyses.length;

  if (successful.length === 0) {
    return {
      consensusType: 'split',
      modelsAgree: 0,
      modelsTotal: total,
      avgWinProbability: 0,
      modelBreakdown: analyses.map(a => ({
        provider: a.provider,
        modelId: a.modelId,
        pick: a.recommendedPick,
        fighter: a.recommendedFighter,
        confidenceLevel: a.confidenceLevel,
        winProbability: a.winProbability,
        error: a.error,
      })),
    };
  }

  // Count picks for each side
  const picksA = successful.filter(a => a.recommendedPick === 'fighterA');
  const picksB = successful.filter(a => a.recommendedPick === 'fighterB');

  const majorityPick = picksA.length >= picksB.length ? 'fighterA' : 'fighterB';
  const majorityAnalyses = majorityPick === 'fighterA' ? picksA : picksB;
  const modelsAgree = majorityAnalyses.length;

  // Determine consensus type
  let consensusType: 'unanimous' | 'majority' | 'split';
  if (modelsAgree === successful.length) {
    consensusType = 'unanimous';
  } else if (modelsAgree > successful.length / 2) {
    consensusType = 'majority';
  } else {
    consensusType = 'split';
  }

  // Average win probability across agreeing models
  const avgWinProbability = majorityAnalyses.length > 0
    ? majorityAnalyses.reduce((sum, a) => sum + a.winProbability, 0) / majorityAnalyses.length
    : 0;

  return {
    consensusType,
    modelsAgree,
    modelsTotal: successful.length,
    avgWinProbability,
    consensusPick: majorityPick,
    consensusFighter: majorityAnalyses[0]?.recommendedFighter,
    modelBreakdown: analyses.map(a => ({
      provider: a.provider,
      modelId: a.modelId,
      pick: a.recommendedPick,
      fighter: a.recommendedFighter,
      confidenceLevel: a.confidenceLevel,
      winProbability: a.winProbability,
      error: a.error,
    })),
  };
}
