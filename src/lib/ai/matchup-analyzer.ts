import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization - client is created on first use
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;

  // Try UFC_ANTHROPIC_KEY first (to avoid system env override), then fall back to ANTHROPIC_API_KEY
  const apiKey = process.env.UFC_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('No Anthropic API key found in environment');
    return null;
  }

  console.log('Initializing Anthropic client with API key');
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

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
}

export async function generateMatchupAnalysis(
  input: MatchupAnalysisInput
): Promise<MatchupAnalysisOutput> {
  const { fighterA, fighterB, prediction, context } = input;

  const isPickA = prediction.fighterAWinProb > 0.5;
  const recommendedFighter = isPickA ? fighterA.name : fighterB.name;
  const winProb = isPickA ? prediction.fighterAWinProb : prediction.fighterBWinProb;

  // Build factor breakdown from prediction factors
  const factorBreakdown = buildFactorBreakdown(fighterA, fighterB, prediction);

  // Determine confidence level
  const confidenceLevel = prediction.confidence >= 0.65 ? 'high'
    : prediction.confidence >= 0.50 ? 'medium' : 'low';

  // Build caution flags
  const cautionFlags = buildCautionFlags(fighterA, fighterB, prediction);

  // Get the Anthropic client (lazy initialization)
  const anthropic = getAnthropicClient();

  // If no API key, return a basic analysis without calling Claude
  if (!anthropic) {
    return {
      matchupSummary: `${fighterA.name} (${fighterA.fightingStyle}) faces ${fighterB.name} (${fighterB.fightingStyle}) in a ${context.weightClass} bout. ${context.isTitleFight ? 'This is a title fight scheduled for ' + context.scheduledRounds + ' rounds.' : ''}`,
      pickExplanation: `Based on statistical analysis, ${recommendedFighter} is the predicted winner with a ${(winProb * 100).toFixed(1)}% probability. The model confidence is ${confidenceLevel}.`,
      keyFactorNarrative: prediction.insights[0] || undefined,
      recommendedPick: isPickA ? 'fighterA' : 'fighterB',
      recommendedFighter,
      winProbability: winProb,
      confidenceLevel,
      factorBreakdown,
      bettingInsight: 'AI-powered betting insights require ANTHROPIC_API_KEY configuration.',
      cautionFlags,
      tokensUsed: 0,
    };
  }

  // Build the prompt for Claude
  const prompt = buildAnalysisPrompt(fighterA, fighterB, prediction, context, factorBreakdown);

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Parse the response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = parseAnalysisResponse(content.text);

  return {
    matchupSummary: parsed.matchupSummary,
    pickExplanation: parsed.pickExplanation,
    keyFactorNarrative: parsed.keyFactorNarrative,
    recommendedPick: isPickA ? 'fighterA' : 'fighterB',
    recommendedFighter,
    winProbability: winProb,
    confidenceLevel,
    factorBreakdown,
    bettingInsight: parsed.bettingInsight,
    cautionFlags,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

function buildAnalysisPrompt(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData,
  context: MatchupAnalysisInput['context'],
  factorBreakdown: FactorBreakdownItem[]
): string {
  const isPickA = prediction.fighterAWinProb > 0.5;
  const pick = isPickA ? fighterA : fighterB;
  const winProb = isPickA ? prediction.fighterAWinProb : prediction.fighterBWinProb;

  // Format the top factors
  const topFactors = factorBreakdown
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5)
    .map(f => `- ${f.displayName}: ${f.fighterAValue} vs ${f.fighterBValue} (${f.advantage === 'A' ? fighterA.name : f.advantage === 'B' ? fighterB.name : 'Even'} +${Math.abs(f.impact).toFixed(1)}%)`)
    .join('\n');

  return `You are an expert MMA analyst. Write analysis for this UFC fight.

## FIGHT INFO
${fighterA.name}${fighterA.nickname ? ` "${fighterA.nickname}"` : ''} vs ${fighterB.name}${fighterB.nickname ? ` "${fighterB.nickname}"` : ''}
Weight Class: ${context.weightClass}
${context.isTitleFight ? 'TITLE FIGHT - ' : ''}${context.scheduledRounds} Rounds
${context.isMainEvent ? 'Main Event' : ''}

## FIGHTER A: ${fighterA.name}
- Record: ${fighterA.history.wins}-${fighterA.history.losses}
- Style: ${fighterA.fightingStyle} (${fighterA.fightingApproach || 'balanced'})
- Stance: ${fighterA.stance}
- Reach: ${fighterA.reach || 'N/A'}cm
- Stats: ${fighterA.stats.slpm.toFixed(2)} SLpM, ${fighterA.stats.strAcc}% Str Acc, ${fighterA.stats.tdAvg.toFixed(2)} TD/15min, ${fighterA.stats.tdDef}% TD Def
- Recent: ${fighterA.history.last5Record}, ${fighterA.history.currentStreak > 0 ? '+' : ''}${fighterA.history.currentStreak} streak
- Finish rate: ${(fighterA.history.careerFinishRate * 100).toFixed(0)}%
- KO'd ${fighterA.history.timesKOd}x, Subbed ${fighterA.history.timesSubmitted}x
- Days since last fight: ${fighterA.history.daysSinceLastFight}

## FIGHTER B: ${fighterB.name}
- Record: ${fighterB.history.wins}-${fighterB.history.losses}
- Style: ${fighterB.fightingStyle} (${fighterB.fightingApproach || 'balanced'})
- Stance: ${fighterB.stance}
- Reach: ${fighterB.reach || 'N/A'}cm
- Stats: ${fighterB.stats.slpm.toFixed(2)} SLpM, ${fighterB.stats.strAcc}% Str Acc, ${fighterB.stats.tdAvg.toFixed(2)} TD/15min, ${fighterB.stats.tdDef}% TD Def
- Recent: ${fighterB.history.last5Record}, ${fighterB.history.currentStreak > 0 ? '+' : ''}${fighterB.history.currentStreak} streak
- Finish rate: ${(fighterB.history.careerFinishRate * 100).toFixed(0)}%
- KO'd ${fighterB.history.timesKOd}x, Subbed ${fighterB.history.timesSubmitted}x
- Days since last fight: ${fighterB.history.daysSinceLastFight}

## MODEL PREDICTION
Pick: ${pick.name} (${(winProb * 100).toFixed(1)}%)
Confidence: ${prediction.confidence >= 0.65 ? 'HIGH' : prediction.confidence >= 0.50 ? 'MEDIUM' : 'LOW'} (${(prediction.confidence * 100).toFixed(0)}%)

## TOP FACTORS
${topFactors}

## EXISTING INSIGHTS
${prediction.insights.join('\n')}

---

Write your analysis in the following JSON format:

{
  "matchupSummary": "2-3 sentences describing the matchup dynamics, styles, and what makes this fight interesting. Be specific about technique matchups.",
  "pickExplanation": "A paragraph (3-5 sentences) explaining why ${pick.name} is the pick. Reference specific stats and advantages. Be analytical, not promotional.",
  "keyFactorNarrative": "Optional 2-3 sentences diving deeper into the single most important factor.",
  "bettingInsight": "One sentence about betting value or angle, if any. Be honest if there's no edge."
}

Write like a knowledgeable analyst, not a hype man. Be specific with numbers. Acknowledge risks.`;
}

function parseAnalysisResponse(text: string): {
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string;
  bettingInsight?: string;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        matchupSummary: parsed.matchupSummary || '',
        pickExplanation: parsed.pickExplanation || '',
        keyFactorNarrative: parsed.keyFactorNarrative || undefined,
        bettingInsight: parsed.bettingInsight || undefined,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e);
  }

  // Fallback: return the raw text as summary
  return {
    matchupSummary: text.slice(0, 500),
    pickExplanation: 'Analysis generation encountered an issue. Please refer to the factor breakdown below.',
  };
}

function buildFactorBreakdown(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData
): FactorBreakdownItem[] {
  const factors = prediction.factors;
  const breakdown: FactorBreakdownItem[] = [];

  // Striking
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

  // Grappling
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

  // Durability
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

  // Physical attributes
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

  // Historical/Momentum
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

  // Style matchup
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

  // Championship rounds experience
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

  // Market signal
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

function buildCautionFlags(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData
): string[] {
  const flags: string[] = [];

  const pick = prediction.fighterAWinProb > 0.5 ? fighterA : fighterB;
  const opponent = prediction.fighterAWinProb > 0.5 ? fighterB : fighterA;

  // Close fight
  const diff = Math.abs(prediction.fighterAWinProb - 0.5);
  if (diff < 0.1) {
    flags.push('Close matchup - consider smaller stake');
  }

  // Pick has durability issues
  if (pick.history.timesKOd >= 2) {
    flags.push(`${pick.name} has been KO'd ${pick.history.timesKOd}x - knockout risk`);
  }

  // Ring rust on the pick
  if (pick.history.daysSinceLastFight > 365) {
    flags.push(`${pick.name} hasn't fought in ${Math.floor(pick.history.daysSinceLastFight / 30)} months`);
  }

  // Opponent is dangerous finisher
  if (opponent.history.careerFinishRate > 0.7) {
    flags.push(`${opponent.name} finishes ${(opponent.history.careerFinishRate * 100).toFixed(0)}% of wins`);
  }

  // Pick on losing streak
  if (pick.history.currentStreak < 0) {
    flags.push(`${pick.name} on ${Math.abs(pick.history.currentStreak)}-fight skid`);
  }

  return flags;
}
