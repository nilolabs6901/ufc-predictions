/**
 * Matchup Analyzer - Main entry point for AI analysis
 * Now delegates to multi-model system when multiple providers are available
 */

import { runMultiModelAnalysis } from './multi-model-analyzer';
import type { MultiModelResult } from './types';

export interface FighterAnalysisData {
  name: string;
  nickname?: string;
  fightingStyle: string;
  fightingApproach?: string;
  stance: string;
  reach?: number;
  height?: number;
  stats: {
    slpm: number;
    strAcc: number;
    sapm: number;
    strDef: number;
    tdAvg: number;
    tdAcc: number;
    tdDef: number;
    subAvg: number;
  };
  history: {
    wins: number;
    losses: number;
    last5Record: string;
    currentStreak: number;
    careerFinishRate: number;
    timesKOd: number;
    timesSubmitted: number;
    daysSinceLastFight: number;
    fiveRoundFights: number;
  };
}

export interface PredictionData {
  fighterAWinProb: number;
  fighterBWinProb: number;
  confidence: number;
  factors: Record<string, number>;
  insights: string[];
}

export interface MatchupAnalysisInput {
  fighterA: FighterAnalysisData;
  fighterB: FighterAnalysisData;
  prediction: PredictionData;
  context: {
    weightClass: string;
    isTitleFight: boolean;
    scheduledRounds: number;
    isMainEvent: boolean;
    fighterAOdds?: number;
    fighterBOdds?: number;
  };
}

export interface FactorBreakdownItem {
  factor: string;
  displayName: string;
  fighterAValue: string;
  fighterBValue: string;
  impact: number;
  advantage: 'A' | 'B' | 'even';
  emoji: string;
}

export interface MatchupAnalysisOutput {
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string;
  recommendedPick: 'fighterA' | 'fighterB';
  recommendedFighter: string;
  winProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  factorBreakdown: FactorBreakdownItem[];
  bettingInsight?: string;
  cautionFlags: string[];
  tokensUsed: number;
  // Multi-model fields
  multiModel?: MultiModelResult;
}

/**
 * Generate matchup analysis using all available AI models
 */
export async function generateMatchupAnalysis(
  input: MatchupAnalysisInput
): Promise<MatchupAnalysisOutput> {
  const { fighterA, fighterB, prediction } = input;

  const isPickA = prediction.fighterAWinProb > 0.5;
  const winProb = isPickA ? prediction.fighterAWinProb : prediction.fighterBWinProb;

  // Build factor breakdown and caution flags (always computed from stats)
  const factorBreakdown = buildFactorBreakdown(fighterA, fighterB, prediction);
  const cautionFlags = buildCautionFlags(fighterA, fighterB, prediction);
  const confidenceLevel = prediction.confidence >= 0.65 ? 'high'
    : prediction.confidence >= 0.50 ? 'medium' : 'low';

  try {
    // Run multi-model analysis
    const multiResult = await runMultiModelAnalysis(
      fighterA, fighterB, prediction, input.context, factorBreakdown
    );

    const primary = multiResult.primaryAnalysis;

    return {
      matchupSummary: primary.matchupSummary,
      pickExplanation: primary.pickExplanation,
      keyFactorNarrative: primary.keyFactorNarrative,
      recommendedPick: primary.recommendedPick,
      recommendedFighter: primary.recommendedFighter,
      winProbability: primary.winProbability,
      confidenceLevel: primary.confidenceLevel,
      factorBreakdown,
      bettingInsight: primary.bettingInsight,
      cautionFlags,
      tokensUsed: multiResult.analyses.reduce((sum, a) => sum + a.tokensUsed, 0),
      multiModel: multiResult,
    };
  } catch {
    // No providers available — return statistical-only analysis
    const recommendedFighter = isPickA ? fighterA.name : fighterB.name;
    return {
      matchupSummary: `${fighterA.name} (${fighterA.fightingStyle}) faces ${fighterB.name} (${fighterB.fightingStyle}) in a ${input.context.weightClass} bout.${input.context.isTitleFight ? ' This is a title fight scheduled for ' + input.context.scheduledRounds + ' rounds.' : ''}`,
      pickExplanation: `Based on statistical analysis, ${recommendedFighter} is the predicted winner with a ${(winProb * 100).toFixed(1)}% probability. The model confidence is ${confidenceLevel}.`,
      keyFactorNarrative: prediction.insights[0] || undefined,
      recommendedPick: isPickA ? 'fighterA' : 'fighterB',
      recommendedFighter,
      winProbability: winProb,
      confidenceLevel,
      factorBreakdown,
      bettingInsight: 'AI-powered analysis requires at least one API key (ANTHROPIC, OPENAI, or GOOGLE_AI).',
      cautionFlags,
      tokensUsed: 0,
    };
  }
}

export function buildFactorBreakdown(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData
): FactorBreakdownItem[] {
  const factors = prediction.factors;
  const breakdown: FactorBreakdownItem[] = [];

  const strikingFactor = factors.strikingAdvantage || 0;
  breakdown.push({
    factor: 'strikingAdvantage',
    displayName: 'Striking',
    fighterAValue: `${fighterA.stats.slpm.toFixed(2)} SLpM, ${fighterA.stats.strAcc}% acc`,
    fighterBValue: `${fighterB.stats.slpm.toFixed(2)} SLpM, ${fighterB.stats.strAcc}% acc`,
    impact: strikingFactor * 100,
    advantage: strikingFactor > 0.02 ? 'A' : strikingFactor < -0.02 ? 'B' : 'even',
    emoji: '🥊',
  });

  const grapplingFactor = factors.grapplingAdvantage || 0;
  breakdown.push({
    factor: 'grapplingAdvantage',
    displayName: 'Grappling',
    fighterAValue: `${fighterA.stats.tdAvg.toFixed(2)} TD, ${fighterA.stats.tdDef}% def`,
    fighterBValue: `${fighterB.stats.tdAvg.toFixed(2)} TD, ${fighterB.stats.tdDef}% def`,
    impact: grapplingFactor * 100,
    advantage: grapplingFactor > 0.02 ? 'A' : grapplingFactor < -0.02 ? 'B' : 'even',
    emoji: '🤼',
  });

  const durabilityFactor = factors.durability || 0;
  breakdown.push({
    factor: 'durability',
    displayName: 'Chin/Durability',
    fighterAValue: `${fighterA.history.timesKOd} KOs absorbed`,
    fighterBValue: `${fighterB.history.timesKOd} KOs absorbed`,
    impact: durabilityFactor * 100,
    advantage: durabilityFactor > 0.02 ? 'A' : durabilityFactor < -0.02 ? 'B' : 'even',
    emoji: '🛡️',
  });

  const physicalFactor = factors.physicalAttributes || 0;
  if (fighterA.reach && fighterB.reach) {
    breakdown.push({
      factor: 'physicalAttributes',
      displayName: 'Reach',
      fighterAValue: `${fighterA.reach}cm`,
      fighterBValue: `${fighterB.reach}cm`,
      impact: physicalFactor * 100,
      advantage: physicalFactor > 0.02 ? 'A' : physicalFactor < -0.02 ? 'B' : 'even',
      emoji: '📏',
    });
  }

  const historyFactor = factors.historicalPerformance || 0;
  breakdown.push({
    factor: 'historicalPerformance',
    displayName: 'Momentum',
    fighterAValue: `${fighterA.history.last5Record}, ${fighterA.history.currentStreak > 0 ? '+' : ''}${fighterA.history.currentStreak} streak`,
    fighterBValue: `${fighterB.history.last5Record}, ${fighterB.history.currentStreak > 0 ? '+' : ''}${fighterB.history.currentStreak} streak`,
    impact: historyFactor * 100,
    advantage: historyFactor > 0.02 ? 'A' : historyFactor < -0.02 ? 'B' : 'even',
    emoji: '📈',
  });

  const styleFactor = factors.styleMatchup || 0;
  breakdown.push({
    factor: 'styleMatchup',
    displayName: 'Style Matchup',
    fighterAValue: fighterA.fightingStyle,
    fighterBValue: fighterB.fightingStyle,
    impact: styleFactor * 100,
    advantage: styleFactor > 0.02 ? 'A' : styleFactor < -0.02 ? 'B' : 'even',
    emoji: '🎯',
  });

  const champFactor = factors.championshipRounds || 0;
  if (champFactor !== 0) {
    breakdown.push({
      factor: 'championshipRounds',
      displayName: 'Championship Rd Exp',
      fighterAValue: `${fighterA.history.fiveRoundFights} fights`,
      fighterBValue: `${fighterB.history.fiveRoundFights} fights`,
      impact: champFactor * 100,
      advantage: champFactor > 0.02 ? 'A' : champFactor < -0.02 ? 'B' : 'even',
      emoji: '🏆',
    });
  }

  const marketFactor = factors.marketSignal || 0;
  if (marketFactor !== 0) {
    breakdown.push({
      factor: 'marketSignal',
      displayName: 'Market Odds',
      fighterAValue: marketFactor > 0 ? 'Favorite' : 'Underdog',
      fighterBValue: marketFactor < 0 ? 'Favorite' : 'Underdog',
      impact: marketFactor * 100,
      advantage: marketFactor > 0.02 ? 'A' : marketFactor < -0.02 ? 'B' : 'even',
      emoji: '💰',
    });
  }

  return breakdown.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

export function buildCautionFlags(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData
): string[] {
  const flags: string[] = [];

  const pick = prediction.fighterAWinProb > 0.5 ? fighterA : fighterB;
  const opponent = prediction.fighterAWinProb > 0.5 ? fighterB : fighterA;

  const diff = Math.abs(prediction.fighterAWinProb - 0.5);
  if (diff < 0.1) {
    flags.push('Close matchup - consider smaller stake');
  }

  if (pick.history.timesKOd >= 2) {
    flags.push(`${pick.name} has been KO'd ${pick.history.timesKOd}x - knockout risk`);
  }

  if (pick.history.daysSinceLastFight > 365) {
    flags.push(`${pick.name} hasn't fought in ${Math.floor(pick.history.daysSinceLastFight / 30)} months`);
  }

  if (opponent.history.careerFinishRate > 0.7) {
    flags.push(`${opponent.name} finishes ${(opponent.history.careerFinishRate * 100).toFixed(0)}% of wins`);
  }

  if (pick.history.currentStreak < 0) {
    flags.push(`${pick.name} on ${Math.abs(pick.history.currentStreak)}-fight skid`);
  }

  return flags;
}
