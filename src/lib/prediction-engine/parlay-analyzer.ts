// Parlay Analysis Engine
// Detects correlations between legs and calculates adjusted probabilities

export interface ParlayLegInput {
  fightId: string;
  fighterAName: string;
  fighterBName: string;
  selectionType: 'moneyline' | 'over' | 'under' | 'method';
  selection: string;
  odds: number;
  modelProb: number;
  impliedProb?: number;
  // Optional metadata for correlation detection
  trainingCamp?: string;
  style?: string;
  weightClass?: string;
}

export interface ParlayCorrelationData {
  leg1Index: number;
  leg2Index: number;
  correlationType: string;
  correlationValue: number;
  description: string;
}

export interface ParlayAnalysis {
  legs: ParlayLegInput[];
  naiveProbability: number;
  adjustedProbability: number;
  totalOdds: number;
  expectedValue: number;
  kellyStake: number;
  variance: number;
  sharpeRatio: number;
  correlations: ParlayCorrelationData[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

// Correlation thresholds
const CORRELATION_CONFIG = {
  SAME_CAMP: 0.15,       // Fighters from same camp
  SAME_STYLE: 0.05,      // Same fighting style
  SAME_CARD_POSITION: 0.03, // Main card vs prelim correlations
  OPPOSITE_OUTCOMES: -0.10, // Negative correlation for opposite bets
  SAME_FIGHT: 0.80,      // Multiple bets on same fight (highly correlated)
};

/**
 * Analyze a parlay bet
 */
export function analyzeParlay(legs: ParlayLegInput[]): ParlayAnalysis {
  if (legs.length < 2) {
    throw new Error('Parlay must have at least 2 legs');
  }

  // Detect correlations between legs
  const correlations = detectCorrelations(legs);

  // Calculate naive probability (assuming independence)
  const naiveProbability = legs.reduce((prob, leg) => prob * leg.modelProb, 1);

  // Calculate adjusted probability accounting for correlations
  const adjustedProbability = calculateAdjustedProbability(legs, correlations);

  // Calculate total parlay odds
  const totalOdds = calculateParlayOdds(legs);

  // Calculate expected value
  const impliedProbFromOdds = 1 / totalOdds;
  const expectedValue = (adjustedProbability * totalOdds) - 1;

  // Calculate Kelly stake
  const kellyStake = calculateKellyStake(adjustedProbability, totalOdds);

  // Calculate variance
  const variance = calculateParlayVariance(legs, correlations);

  // Calculate Sharpe ratio (risk-adjusted return)
  const sharpeRatio = expectedValue / Math.sqrt(variance);

  // Generate recommendations
  const recommendations = generateRecommendations(
    legs,
    correlations,
    expectedValue,
    adjustedProbability
  );

  // Determine risk level
  const riskLevel = determineRiskLevel(legs.length, adjustedProbability, variance);

  return {
    legs,
    naiveProbability: roundTo(naiveProbability, 6),
    adjustedProbability: roundTo(adjustedProbability, 6),
    totalOdds: roundTo(totalOdds, 4),
    expectedValue: roundTo(expectedValue, 4),
    kellyStake: roundTo(kellyStake, 4),
    variance: roundTo(variance, 6),
    sharpeRatio: roundTo(sharpeRatio, 4),
    correlations,
    recommendations,
    riskLevel,
  };
}

/**
 * Detect correlations between parlay legs
 */
export function detectCorrelations(legs: ParlayLegInput[]): ParlayCorrelationData[] {
  const correlations: ParlayCorrelationData[] = [];

  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const leg1 = legs[i];
      const leg2 = legs[j];

      // Check for same fight (multiple bets on same fight)
      if (leg1.fightId === leg2.fightId) {
        correlations.push({
          leg1Index: i,
          leg2Index: j,
          correlationType: 'same_fight',
          correlationValue: CORRELATION_CONFIG.SAME_FIGHT,
          description: `Multiple bets on ${leg1.fighterAName} vs ${leg1.fighterBName}`,
        });
        continue;
      }

      // Check for same training camp
      if (leg1.trainingCamp && leg2.trainingCamp && leg1.trainingCamp === leg2.trainingCamp) {
        correlations.push({
          leg1Index: i,
          leg2Index: j,
          correlationType: 'same_camp',
          correlationValue: CORRELATION_CONFIG.SAME_CAMP,
          description: `Both fighters train at ${leg1.trainingCamp}`,
        });
      }

      // Check for same fighting style picks
      if (leg1.style && leg2.style && leg1.style === leg2.style) {
        correlations.push({
          leg1Index: i,
          leg2Index: j,
          correlationType: 'same_style',
          correlationValue: CORRELATION_CONFIG.SAME_STYLE,
          description: `Both picks favor ${leg1.style} style`,
        });
      }

      // Check for same weight class
      if (leg1.weightClass && leg2.weightClass && leg1.weightClass === leg2.weightClass) {
        correlations.push({
          leg1Index: i,
          leg2Index: j,
          correlationType: 'same_weightclass',
          correlationValue: 0.02,
          description: `Both fights in ${leg1.weightClass}`,
        });
      }
    }
  }

  return correlations;
}

/**
 * Calculate adjusted probability accounting for correlations
 */
function calculateAdjustedProbability(
  legs: ParlayLegInput[],
  correlations: ParlayCorrelationData[]
): number {
  // Start with naive probability
  let probability = legs.reduce((prob, leg) => prob * leg.modelProb, 1);

  // Apply correlation adjustments
  for (const corr of correlations) {
    // Positive correlation means outcomes are more likely to happen together
    // This can either increase or decrease parlay probability depending on the correlation
    if (corr.correlationValue > 0) {
      // Same direction correlation - slightly increases parlay probability
      probability *= (1 + corr.correlationValue * 0.1);
    } else {
      // Negative correlation - decreases parlay probability
      probability *= (1 + corr.correlationValue * 0.1);
    }
  }

  // Clamp to valid probability range
  return Math.max(0.0001, Math.min(0.9999, probability));
}

/**
 * Calculate total parlay odds from American odds
 */
function calculateParlayOdds(legs: ParlayLegInput[]): number {
  let totalDecimalOdds = 1;

  for (const leg of legs) {
    // Convert American odds to decimal
    let decimalOdds: number;
    if (leg.odds < 0) {
      decimalOdds = 1 + (100 / Math.abs(leg.odds));
    } else {
      decimalOdds = 1 + (leg.odds / 100);
    }
    totalDecimalOdds *= decimalOdds;
  }

  return totalDecimalOdds;
}

/**
 * Calculate Kelly criterion stake
 */
function calculateKellyStake(probability: number, decimalOdds: number): number {
  // Kelly formula: (bp - q) / b
  // where b = decimal odds - 1, p = win probability, q = 1 - p
  const b = decimalOdds - 1;
  const p = probability;
  const q = 1 - p;

  const kelly = (b * p - q) / b;

  // Use fractional Kelly (quarter Kelly) for safer betting
  const fractionalKelly = kelly * 0.25;

  // Clamp to reasonable range
  return Math.max(0, Math.min(0.1, fractionalKelly));
}

/**
 * Calculate parlay variance
 */
function calculateParlayVariance(
  legs: ParlayLegInput[],
  correlations: ParlayCorrelationData[]
): number {
  // Base variance from individual leg variances
  let variance = 0;

  for (const leg of legs) {
    const p = leg.modelProb;
    variance += p * (1 - p);
  }

  // Add covariance from correlations
  for (const corr of correlations) {
    const p1 = legs[corr.leg1Index].modelProb;
    const p2 = legs[corr.leg2Index].modelProb;
    variance += 2 * corr.correlationValue * Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
  }

  return variance;
}

/**
 * Generate betting recommendations
 */
function generateRecommendations(
  legs: ParlayLegInput[],
  correlations: ParlayCorrelationData[],
  ev: number,
  adjProb: number
): string[] {
  const recs: string[] = [];

  // EV assessment
  if (ev > 0.5) {
    recs.push(`✅ Strong positive expected value (+${(ev * 100).toFixed(1)}%)`);
  } else if (ev > 0) {
    recs.push(`✅ Positive expected value (+${(ev * 100).toFixed(1)}%)`);
  } else if (ev > -0.1) {
    recs.push('⚠️ Slightly negative EV - consider removing weakest leg');
  } else {
    recs.push('❌ Negative expected value - not recommended');
  }

  // Leg count assessment
  if (legs.length > 5) {
    recs.push(`⚠️ ${legs.length} legs is risky - consider splitting into smaller parlays`);
  } else if (legs.length > 3) {
    recs.push(`📊 ${legs.length}-leg parlay - moderate complexity`);
  }

  // Probability assessment
  if (adjProb < 0.05) {
    recs.push(`⚠️ Very low probability (${(adjProb * 100).toFixed(1)}%) - lottery ticket`);
  } else if (adjProb < 0.15) {
    recs.push('📊 Low probability parlay - high risk/reward');
  } else if (adjProb > 0.4) {
    recs.push('📊 Higher probability parlay - moderate risk');
  }

  // Correlation warnings
  const sameFightCorrs = correlations.filter(c => c.correlationType === 'same_fight');
  if (sameFightCorrs.length > 0) {
    recs.push('⚠️ Multiple bets on same fight(s) - highly correlated');
  }

  const sameCampCorrs = correlations.filter(c => c.correlationType === 'same_camp');
  if (sameCampCorrs.length > 0) {
    recs.push(`📍 Camp correlation detected - ${sameCampCorrs[0].description}`);
  }

  // Edge assessment
  const totalEdge = legs.reduce((acc, leg) => {
    const impliedProb = leg.impliedProb ?? leg.modelProb;
    return acc + (leg.modelProb - impliedProb);
  }, 0);

  if (totalEdge > 0.15) {
    recs.push('🎯 Good cumulative edge over market odds');
  } else if (totalEdge < -0.1) {
    recs.push('⚠️ Negative edge against market - consider alternatives');
  }

  // Identify weakest leg
  const weakestLeg = legs.reduce((min, leg, idx) => {
    const impliedProb = leg.impliedProb ?? leg.modelProb;
    const edge = leg.modelProb - impliedProb;
    if (edge < min.edge) return { idx, edge, name: leg.selection };
    return min;
  }, { idx: -1, edge: 1, name: '' });

  if (weakestLeg.edge < -0.05) {
    recs.push(`💡 Consider removing leg ${weakestLeg.idx + 1} (${weakestLeg.name}) - negative edge`);
  }

  return recs;
}

/**
 * Determine risk level based on leg count and probability
 */
function determineRiskLevel(
  legCount: number,
  probability: number,
  variance: number
): 'low' | 'medium' | 'high' | 'extreme' {
  // Primary factor: number of legs (each leg multiplies risk)
  // Secondary factor: adjusted probability of winning

  // 2 legs with high probability = low risk
  // 2-3 legs with medium probability = medium risk
  // 4+ legs or low probability = high risk
  // 5+ legs with low probability = extreme risk

  if (legCount <= 2 && probability >= 0.30) {
    return 'low';
  }

  if (legCount <= 3 && probability >= 0.20) {
    return 'medium';
  }

  if (legCount <= 4 && probability >= 0.10) {
    return 'high';
  }

  // 5+ legs or very low probability
  return 'extreme';
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
