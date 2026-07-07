/**
 * Shared prompt builder for all AI providers
 * Extracted from matchup-analyzer.ts so all models get identical prompts
 */

import type { FighterAnalysisData, PredictionData, MatchupAnalysisInput, FactorBreakdownItem } from './matchup-analyzer';

export function buildAnalysisPrompt(
  fighterA: FighterAnalysisData,
  fighterB: FighterAnalysisData,
  prediction: PredictionData,
  context: MatchupAnalysisInput['context'],
  factorBreakdown: FactorBreakdownItem[]
): string {
  const isPickA = prediction.fighterAWinProb > 0.5;
  const pick = isPickA ? fighterA : fighterB;
  const winProb = isPickA ? prediction.fighterAWinProb : prediction.fighterBWinProb;

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

You MUST form your OWN independent opinion. You may agree or disagree with the statistical model's pick.

Write your analysis in the following JSON format:

{
  "matchupSummary": "2-3 sentences describing the matchup dynamics, styles, and what makes this fight interesting. Be specific about technique matchups.",
  "pickExplanation": "A paragraph (3-5 sentences) explaining your pick and why. Reference specific stats and advantages. Be analytical, not promotional.",
  "keyFactorNarrative": "Optional 2-3 sentences diving deeper into the single most important factor.",
  "recommendedPick": "fighterA" or "fighterB",
  "recommendedFighter": "Name of the fighter you pick to win",
  "winProbability": 0.65,
  "confidenceLevel": "high" or "medium" or "low",
  "bettingInsight": "One sentence about betting value or angle, if any. Be honest if there's no edge."
}

Write like a knowledgeable analyst, not a hype man. Be specific with numbers. Acknowledge risks. Your pick DOES NOT have to match the model prediction — use your own judgment.`;
}

export function parseAnalysisResponse(
  text: string,
  fighterAName: string,
  fighterBName: string,
  isPickA: boolean,
  winProb: number
): {
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string;
  bettingInsight?: string;
  recommendedPick: 'fighterA' | 'fighterB';
  recommendedFighter: string;
  winProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
} {
  // Defaults based on statistical model
  const defaults = {
    recommendedPick: (isPickA ? 'fighterA' : 'fighterB') as 'fighterA' | 'fighterB',
    recommendedFighter: isPickA ? fighterAName : fighterBName,
    winProbability: winProb,
    confidenceLevel: 'medium' as 'high' | 'medium' | 'low',
  };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Parse AI's own pick
      let recommendedPick = defaults.recommendedPick;
      let recommendedFighter = defaults.recommendedFighter;
      let aiWinProb = defaults.winProbability;
      let aiConfidence = defaults.confidenceLevel;

      if (parsed.recommendedPick === 'fighterA' || parsed.recommendedPick === 'fighterB') {
        recommendedPick = parsed.recommendedPick;
        recommendedFighter = parsed.recommendedPick === 'fighterA' ? fighterAName : fighterBName;
      }
      if (parsed.recommendedFighter) {
        // If they specified a fighter name, use it to determine the pick
        if (parsed.recommendedFighter.toLowerCase().includes(fighterAName.split(' ').pop()!.toLowerCase())) {
          recommendedPick = 'fighterA';
          recommendedFighter = fighterAName;
        } else if (parsed.recommendedFighter.toLowerCase().includes(fighterBName.split(' ').pop()!.toLowerCase())) {
          recommendedPick = 'fighterB';
          recommendedFighter = fighterBName;
        }
      }
      if (typeof parsed.winProbability === 'number' && parsed.winProbability > 0 && parsed.winProbability <= 1) {
        aiWinProb = parsed.winProbability;
      }
      if (['high', 'medium', 'low'].includes(parsed.confidenceLevel)) {
        aiConfidence = parsed.confidenceLevel;
      }

      return {
        matchupSummary: parsed.matchupSummary || '',
        pickExplanation: parsed.pickExplanation || '',
        keyFactorNarrative: parsed.keyFactorNarrative || undefined,
        bettingInsight: parsed.bettingInsight || undefined,
        recommendedPick,
        recommendedFighter,
        winProbability: aiWinProb,
        confidenceLevel: aiConfidence,
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON:', e);
  }

  // Fallback
  return {
    matchupSummary: text.slice(0, 500),
    pickExplanation: 'Analysis generation encountered an issue. Please refer to the factor breakdown below.',
    ...defaults,
  };
}
