// UFC Prediction Engine - Main Calculator
// Calculates fight outcome probabilities using research-backed factors

import {
  FighterData,
  FighterHistory,
  FighterStats,
  FightContext,
  PredictionFactors,
  PredictionResult,
  StancePerformance,
  StylePerformance,
  Stance,
  FightingStyle,
} from './types';

import {
  FACTOR_WEIGHTS,
  STYLE_MATCHUPS,
  STREAK_IMPACT,
  WEIGHT_CLASS_KO_MULTIPLIER,
  HIGH_ALTITUDE_LOCATIONS,
  RING_RUST_THRESHOLDS,
  RING_RUST_IMPACT,
  MODEL_VERSION,
} from './config';

/**
 * Main prediction function
 * Calculates win probabilities for a fight between two fighters
 */
export function predictFight(
  fighterA: FighterData,
  fighterB: FighterData,
  context: FightContext
): PredictionResult {
  // Calculate all individual factors
  const factors: PredictionFactors = {
    styleMatchup: calculateStyleMatchup(fighterA.fightingStyle, fighterB.fightingStyle),
    strikingAdvantage: calculateStrikingAdvantage(fighterA.stats, fighterB.stats),
    grapplingAdvantage: calculateGrapplingAdvantage(fighterA.stats, fighterB.stats),
    durability: calculateDurability(fighterA, fighterB),
    physicalAttributes: calculatePhysicalAttributes(fighterA, fighterB),
    historicalPerformance: calculateHistoricalDiff(fighterA.history, fighterB.history),
    experienceFactor: calculateExperienceFactor(fighterA, fighterB),
    stanceMatchup: calculateStanceMatchup(fighterA, fighterB),
    styleHistory: calculateStyleHistory(fighterA, fighterB),
    altitudeImpact: calculateAltitudeImpact(fighterA, fighterB, context.venue),
    travelFatigue: calculateTravelFatigue(fighterA, fighterB, context.venue),
    cageSizeImpact: calculateCageSizeImpact(fighterA, fighterB, context.cageSize),
    weightClassFactor: calculateWeightClassFactor(fighterA, fighterB, context.weightClass),
    championshipRounds: calculateChampionshipRounds(fighterA, fighterB, context.scheduledRounds === 5),
    marketSignal: calculateMarketSignal(context.fighterAOdds, context.fighterBOdds),
  };

  // Calculate base probability from weighted factors
  let fighterAProb = 0.5;
  for (const [factor, value] of Object.entries(factors)) {
    const weight = FACTOR_WEIGHTS[factor as keyof typeof FACTOR_WEIGHTS];
    fighterAProb += value * weight;
  }

  // Apply "upset potential" adjustment for close fights
  // When probability is close to 50%, boost the fighter with better career record
  // This reflects that experienced fighters often perform well in close matchups
  const distanceFrom50 = Math.abs(fighterAProb - 0.5);
  if (distanceFrom50 < 0.12) {
    // Close fight - give extra weight to experience/record in tight matchups
    const expBoost = factors.experienceFactor * 0.12;
    fighterAProb += expBoost;
  }

  // Clamp probability to reasonable bounds (5-95%)
  fighterAProb = Math.max(0.05, Math.min(0.95, fighterAProb));
  const fighterBProb = 1 - fighterAProb;

  // Calculate method probabilities
  const methods = calculateMethodProbabilities(
    fighterA,
    fighterB,
    fighterAProb,
    context.weightClass
  );

  // Calculate confidence score
  const confidence = calculateConfidence(fighterA, fighterB, factors);

  // Generate human-readable insights
  const insights = generateInsights(fighterA, fighterB, factors);

  return {
    fighterAWinProb: roundTo(fighterAProb, 3),
    fighterBWinProb: roundTo(fighterBProb, 3),
    ...methods,
    confidence: roundTo(confidence, 2),
    factors,
    insights,
  };
}

/**
 * Calculate style matchup advantage
 * Grapplers historically have advantage over pure strikers
 */
function calculateStyleMatchup(styleA: FightingStyle, styleB: FightingStyle): number {
  const key = `${styleA}-${styleB}`;
  const matchup = STYLE_MATCHUPS[key] || { advantage: 0.5 };
  // Convert from 0.4-0.6 range to -1 to 1 range
  return (matchup.advantage - 0.5) * 2;
}

/**
 * Calculate striking advantage
 * Combines offense (SLPM, accuracy) with defense (SAPM, defense %)
 * Modified to not over-penalize efficient counter-strikers
 */
function calculateStrikingAdvantage(statsA: FighterStats, statsB: FighterStats): number {
  // Offensive score: strikes per minute (reduced weight) + accuracy bonus (increased weight)
  // Counter-strikers often have lower volume but higher accuracy
  const offenseA = (statsA.slpm * 0.3) + (statsA.strAcc * 0.008);
  const offenseB = (statsB.slpm * 0.3) + (statsB.strAcc * 0.008);

  // Defensive score: low absorption + high defense percentage
  const defenseA = (100 - statsA.sapm * 8) * 0.01 + (statsA.strDef * 0.012);
  const defenseB = (100 - statsB.sapm * 8) * 0.01 + (statsB.strDef * 0.012);

  // Combined score (50% offense, 50% defense)
  const scoreA = offenseA * 0.5 + defenseA * 0.5;
  const scoreB = offenseB * 0.5 + defenseB * 0.5;

  // Normalize to -1 to 1 range (increased divisor to reduce extreme values)
  return clamp((scoreA - scoreB) / 1.5, -0.5, 0.5);
}

/**
 * Calculate grappling advantage
 * Combines takedowns, accuracy, defense, and submission attempts
 */
function calculateGrapplingAdvantage(statsA: FighterStats, statsB: FighterStats): number {
  // Offensive: takedowns + accuracy + submissions
  const offenseA = (statsA.tdAvg * 0.4) + (statsA.tdAcc * 0.01) + (statsA.subAvg * 0.3);
  const offenseB = (statsB.tdAvg * 0.4) + (statsB.tdAcc * 0.01) + (statsB.subAvg * 0.3);

  // Defensive: takedown defense percentage
  const defenseA = statsA.tdDef * 0.01;
  const defenseB = statsB.tdDef * 0.01;

  // Combined score
  const scoreA = offenseA * 0.6 + defenseA * 0.4;
  const scoreB = offenseB * 0.6 + defenseB * 0.4;

  return clamp((scoreA - scoreB) / 2, -1, 1);
}

/**
 * Calculate durability comparison
 * Based on times finished (KO'd or submitted) and strike absorption
 */
function calculateDurability(fighterA: FighterData, fighterB: FighterData): number {
  // Vulnerability score: higher is worse
  const vulnA =
    fighterA.history.timesKOd * 0.15 +
    fighterA.history.timesSubmitted * 0.10 +
    fighterA.stats.sapm * 0.05;

  const vulnB =
    fighterB.history.timesKOd * 0.15 +
    fighterB.history.timesSubmitted * 0.10 +
    fighterB.stats.sapm * 0.05;

  // Convert to advantage (less vulnerable = advantage)
  return clamp((1 - vulnA) - (1 - vulnB), -1, 1);
}

/**
 * Calculate physical attribute advantages
 * Reach and height matter, but less than skills
 */
function calculatePhysicalAttributes(fighterA: FighterData, fighterB: FighterData): number {
  let advantage = 0;

  // Reach advantage (normalized by typical variance of ~15-20cm)
  if (fighterA.reach && fighterB.reach) {
    advantage += ((fighterA.reach - fighterB.reach) / 20) * 0.5;
  }

  // Height advantage (less impactful than reach)
  if (fighterA.height && fighterB.height) {
    advantage += ((fighterA.height - fighterB.height) / 25) * 0.3;
  }

  return clamp(advantage, -1, 1);
}

/**
 * Calculate historical performance modifier
 * Includes streak, recent form, ring rust, and finish rate trends
 */
function calculateHistoricalDiff(histA: FighterHistory, histB: FighterHistory): number {
  const modA = calculateHistoricalModifier(histA);
  const modB = calculateHistoricalModifier(histB);
  return modA - modB;
}

function calculateHistoricalModifier(history: FighterHistory): number {
  let modifier = 0;

  // Streak impact (capped at +/- 5)
  const clampedStreak = Math.max(-5, Math.min(5, history.currentStreak));
  modifier += STREAK_IMPACT[clampedStreak.toString()] || 0;

  // Recent form (last 5 record)
  const [wins, losses] = history.last5Record.split('-').map(Number);
  const total = wins + losses;
  if (total > 0) {
    const recentWinRate = wins / total;
    modifier += (recentWinRate - 0.5) * 0.20; // +/- 10% for perfect/terrible recent record
  }

  // Finish rate trend (comparing recent to career)
  const trend = history.finishRateLast5 - history.careerFinishRate;
  if (trend < -0.3) modifier -= 0.05;      // Significant decline
  else if (trend < -0.15) modifier -= 0.03; // Moderate decline
  else if (trend > 0.15) modifier += 0.03;  // Improving
  else if (trend > 0.3) modifier += 0.05;   // Significant improvement

  // Ring rust calculation
  const days = history.daysSinceLastFight;
  if (days < RING_RUST_THRESHOLDS.OPTIMAL_MIN) {
    modifier += RING_RUST_IMPACT.TOO_QUICK;
  } else if (days <= RING_RUST_THRESHOLDS.OPTIMAL_MAX) {
    modifier += RING_RUST_IMPACT.OPTIMAL;
  } else if (days <= RING_RUST_THRESHOLDS.MODERATE_RUST) {
    modifier += RING_RUST_IMPACT.MODERATE;
  } else if (days <= RING_RUST_THRESHOLDS.SEVERE_RUST) {
    modifier += RING_RUST_IMPACT.RUST_MODERATE;
  } else if (days <= RING_RUST_THRESHOLDS.EXTREME_RUST) {
    modifier += RING_RUST_IMPACT.RUST_SEVERE;
  } else {
    modifier += RING_RUST_IMPACT.RUST_EXTREME;
  }

  return clamp(modifier, -0.25, 0.20);
}

/**
 * Calculate stance matchup advantage
 * Southpaws have inherent advantage vs orthodox (unfamiliarity)
 * Switch fighters have slight versatility advantage
 */
function calculateStanceMatchup(fighterA: FighterData, fighterB: FighterData): number {
  let modifier = 0;

  // Base stance dynamics
  if (fighterA.stance === 'orthodox' && fighterB.stance === 'southpaw') {
    modifier -= 0.03; // Southpaw advantage
  } else if (fighterA.stance === 'southpaw' && fighterB.stance === 'orthodox') {
    modifier += 0.03; // Southpaw advantage
  }

  // Switch stance advantage
  if (fighterA.stance === 'switch' && fighterB.stance !== 'switch') {
    modifier += 0.02;
  } else if (fighterB.stance === 'switch' && fighterA.stance !== 'switch') {
    modifier -= 0.02;
  }

  // Individual record vs opponent's stance
  const aRecord = getStanceRecord(fighterA.stancePerformance, fighterB.stance);
  const bRecord = getStanceRecord(fighterB.stancePerformance, fighterA.stance);

  const aWinRate = calculateWinRate(aRecord);
  const bWinRate = calculateWinRate(bRecord);

  modifier += ((aWinRate - 0.5) - (bWinRate - 0.5)) * 0.08;

  return clamp(modifier, -0.08, 0.08);
}

/**
 * Calculate style history advantage
 * Individual performance against opponent's fighting style
 */
function calculateStyleHistory(fighterA: FighterData, fighterB: FighterData): number {
  const aRecord = getStyleRecord(fighterA.stylePerformance, fighterB.fightingStyle);
  const bRecord = getStyleRecord(fighterB.stylePerformance, fighterA.fightingStyle);

  const aWinRate = calculateWinRate(aRecord);
  const bWinRate = calculateWinRate(bRecord);

  return clamp(((aWinRate - 0.5) - (bWinRate - 0.5)) * 0.15, -0.08, 0.08);
}

/**
 * Calculate altitude impact
 * High altitude (>1500m) significantly impacts cardio
 * Fighters from high altitude regions are acclimated
 */
function calculateAltitudeImpact(
  fighterA: FighterData,
  fighterB: FighterData,
  venue?: FightContext['venue']
): number {
  if (!venue || venue.altitude < 1500) return 0;

  const aAcclimated = isHighAltitude(fighterA.hometown) || isHighAltitude(fighterA.trainingCamp);
  const bAcclimated = isHighAltitude(fighterB.hometown) || isHighAltitude(fighterB.trainingCamp);

  if (aAcclimated && !bAcclimated) return 0.05;
  if (!aAcclimated && bAcclimated) return -0.05;
  return 0;
}

/**
 * Calculate travel fatigue/home advantage
 * Fighting in home country provides slight advantage
 */
function calculateTravelFatigue(
  fighterA: FighterData,
  fighterB: FighterData,
  venue?: FightContext['venue']
): number {
  if (!venue) return 0;

  const aHome = fighterA.hometown?.toLowerCase().includes(venue.country.toLowerCase());
  const bHome = fighterB.hometown?.toLowerCase().includes(venue.country.toLowerCase());

  if (aHome && !bHome) return 0.03;
  if (!aHome && bHome) return -0.03;
  return 0;
}

/**
 * Calculate cage size impact
 * Small cage (25ft) favors grapplers and pressure fighters
 * Standard cage (30ft) favors counter-strikers
 */
function calculateCageSizeImpact(
  fighterA: FighterData,
  fighterB: FighterData,
  cageSize: string
): number {
  if (cageSize !== 'small') return 0;

  let modifier = 0;

  // Small cage favors grapplers
  if (fighterA.fightingStyle === 'Grappler') modifier += 0.03;
  if (fighterB.fightingStyle === 'Grappler') modifier -= 0.03;

  // Small cage favors pressure fighters
  if (fighterA.fightingApproach === 'pressure') modifier += 0.02;
  if (fighterB.fightingApproach === 'pressure') modifier -= 0.02;

  // Small cage hurts counter-strikers
  if (fighterA.fightingApproach === 'counter') modifier -= 0.02;
  if (fighterB.fightingApproach === 'counter') modifier += 0.02;

  return clamp(modifier, -0.05, 0.05);
}

/**
 * Calculate experience factor
 * Based on win rate, total fights, and quality of record
 * A fighter with a 20-3 record should be favored over 14-2
 */
function calculateExperienceFactor(
  fighterA: FighterData,
  fighterB: FighterData
): number {
  // Calculate win rates
  const aTotal = (fighterA.wins || 0) + (fighterA.losses || 0);
  const bTotal = (fighterB.wins || 0) + (fighterB.losses || 0);

  const aWinRate = aTotal > 0 ? (fighterA.wins || 0) / aTotal : 0.5;
  const bWinRate = bTotal > 0 ? (fighterB.wins || 0) / bTotal : 0.5;

  // Win rate advantage (capped)
  const winRateAdv = clamp((aWinRate - bWinRate) * 1.5, -0.3, 0.3);

  // Experience advantage (more fights = more seasoned, but diminishing returns)
  // 20+ fights is considered very experienced
  const aExpScore = Math.min(aTotal / 20, 1);
  const bExpScore = Math.min(bTotal / 20, 1);
  const expAdv = clamp((aExpScore - bExpScore) * 0.3, -0.15, 0.15);

  // Total wins advantage (absolute number of wins matters)
  const aWins = fighterA.wins || 0;
  const bWins = fighterB.wins || 0;
  const winsAdv = clamp((aWins - bWins) / 20, -0.2, 0.2);

  return clamp(winRateAdv + expAdv + winsAdv, -0.5, 0.5);
}

/**
 * Calculate weight class factor
 * Moving up/down in weight can be advantageous or disadvantageous
 */
function calculateWeightClassFactor(
  fighterA: FighterData,
  fighterB: FighterData,
  weightClass: string
): number {
  // Simplified: could be expanded with natural weight class data
  // For now, return neutral
  return 0;
}

/**
 * Calculate championship rounds experience
 * 5-round fight experience matters in title fights
 */
function calculateChampionshipRounds(
  fighterA: FighterData,
  fighterB: FighterData,
  isFiveRounds: boolean
): number {
  if (!isFiveRounds) return 0;

  const aExp = fighterA.history.fiveRoundFights;
  const bExp = fighterB.history.fiveRoundFights;

  let modifier = 0;

  // Significant experience gap
  if (aExp >= 5 && bExp < 2) modifier += 0.04;
  else if (bExp >= 5 && aExp < 2) modifier -= 0.04;
  // Moderate experience gap
  else if (aExp >= 3 && bExp === 0) modifier += 0.02;
  else if (bExp >= 3 && aExp === 0) modifier -= 0.02;

  return clamp(modifier, -0.06, 0.06);
}

/**
 * Calculate market signal
 * Betting odds provide valuable market wisdom
 */
function calculateMarketSignal(oddsA?: number, oddsB?: number): number {
  if (!oddsA || !oddsB) return 0;

  // Convert American odds to implied probability
  const impliedA = oddsA < 0
    ? Math.abs(oddsA) / (Math.abs(oddsA) + 100)
    : 100 / (oddsA + 100);

  const impliedB = oddsB < 0
    ? Math.abs(oddsB) / (Math.abs(oddsB) + 100)
    : 100 / (oddsB + 100);

  // Remove vig by normalizing
  const fairProbA = impliedA / (impliedA + impliedB);

  // Convert to -1 to 1 range centered at 0.5
  return (fairProbA - 0.5) * 2;
}

/**
 * Calculate method probabilities
 * Based on finish rates, opponent vulnerabilities, and weight class
 */
function calculateMethodProbabilities(
  fighterA: FighterData,
  fighterB: FighterData,
  aWinProb: number,
  weightClass: string
): {
  fighterAByKO: number;
  fighterAByTKO: number;
  fighterABySub: number;
  fighterAByDec: number;
  fighterBByKO: number;
  fighterBByTKO: number;
  fighterBBySub: number;
  fighterBByDec: number;
} {
  const bWinProb = 1 - aWinProb;
  const koMultiplier = WEIGHT_CLASS_KO_MULTIPLIER[weightClass] || 1.0;

  // Fighter A method probabilities
  const aFinishRate = fighterA.history.careerFinishRate;
  const aKOTendency = 0.6; // Assuming 60% of finishes are KO/TKO
  const aSubTendency = 0.4; // Assuming 40% of finishes are submissions

  // Adjust for opponent vulnerabilities
  const aKORate = aFinishRate * aKOTendency * (1 + fighterB.history.timesKOd * 0.1) * koMultiplier;
  const aSubRate = aFinishRate * aSubTendency * (1 + fighterB.history.timesSubmitted * 0.1);

  // Fighter B method probabilities
  const bFinishRate = fighterB.history.careerFinishRate;
  const bKORate = bFinishRate * 0.6 * (1 + fighterA.history.timesKOd * 0.1) * koMultiplier;
  const bSubRate = bFinishRate * 0.4 * (1 + fighterA.history.timesSubmitted * 0.1);

  // Calculate final method probabilities
  const fighterAByKO = Math.max(0, roundTo(aWinProb * aKORate * 0.5, 3));
  const fighterAByTKO = Math.max(0, roundTo(aWinProb * aKORate * 0.5, 3));
  const fighterABySub = Math.max(0, roundTo(aWinProb * aSubRate, 3));
  const fighterAByDec = Math.max(0, roundTo(aWinProb - fighterAByKO - fighterAByTKO - fighterABySub, 3));

  const fighterBByKO = Math.max(0, roundTo(bWinProb * bKORate * 0.5, 3));
  const fighterBByTKO = Math.max(0, roundTo(bWinProb * bKORate * 0.5, 3));
  const fighterBBySub = Math.max(0, roundTo(bWinProb * bSubRate, 3));
  const fighterBByDec = Math.max(0, roundTo(bWinProb - fighterBByKO - fighterBByTKO - fighterBBySub, 3));

  return {
    fighterAByKO,
    fighterAByTKO,
    fighterABySub,
    fighterAByDec,
    fighterBByKO,
    fighterBByTKO,
    fighterBBySub,
    fighterBByDec,
  };
}

/**
 * Calculate prediction confidence
 * Based on data quality and factor alignment
 */
function calculateConfidence(
  fighterA: FighterData,
  fighterB: FighterData,
  factors: PredictionFactors
): number {
  let confidence = 0.7; // Base confidence

  // Check factor alignment
  const factorValues = Object.values(factors);
  const positiveFactors = factorValues.filter(v => v > 0.1).length;
  const negativeFactors = factorValues.filter(v => v < -0.1).length;

  // High alignment (most factors point same direction)
  if (positiveFactors >= 8 || negativeFactors >= 8) {
    confidence += 0.1;
  }

  // Mixed signals (many contradicting factors)
  if (positiveFactors >= 4 && negativeFactors >= 4) {
    confidence -= 0.15;
  }

  // Experience-based adjustments
  const totalFightsA = fighterA.history.currentStreak !== 0 ? 10 : 5; // Proxy for experience
  const totalFightsB = fighterB.history.currentStreak !== 0 ? 10 : 5;

  if (totalFightsA < 5 || totalFightsB < 5) {
    confidence -= 0.1; // Less data = less confidence
  }

  return clamp(confidence, 0.3, 0.95);
}

/**
 * Generate human-readable insights about the matchup
 */
function generateInsights(
  fighterA: FighterData,
  fighterB: FighterData,
  factors: PredictionFactors
): string[] {
  const insights: string[] = [];

  // Streak insights
  if (fighterA.history.currentStreak <= -3) {
    insights.push(`${fighterA.name} on ${Math.abs(fighterA.history.currentStreak)}-fight losing streak`);
  } else if (fighterA.history.currentStreak >= 3) {
    insights.push(`${fighterA.name} on ${fighterA.history.currentStreak}-fight winning streak`);
  }

  if (fighterB.history.currentStreak <= -3) {
    insights.push(`${fighterB.name} on ${Math.abs(fighterB.history.currentStreak)}-fight losing streak`);
  } else if (fighterB.history.currentStreak >= 3) {
    insights.push(`${fighterB.name} on ${fighterB.history.currentStreak}-fight winning streak`);
  }

  // Style matchup insights
  if (factors.styleMatchup > 0.15) {
    insights.push(`Style matchup favors ${fighterA.name}`);
  } else if (factors.styleMatchup < -0.15) {
    insights.push(`Style matchup favors ${fighterB.name}`);
  }

  // Striking advantage
  if (factors.strikingAdvantage > 0.2) {
    insights.push(`${fighterA.name} has significant striking advantage`);
  } else if (factors.strikingAdvantage < -0.2) {
    insights.push(`${fighterB.name} has significant striking advantage`);
  }

  // Grappling advantage
  if (factors.grapplingAdvantage > 0.2) {
    insights.push(`${fighterA.name} has grappling advantage`);
  } else if (factors.grapplingAdvantage < -0.2) {
    insights.push(`${fighterB.name} has grappling advantage`);
  }

  // Durability concerns
  if (fighterA.history.timesKOd >= 3) {
    insights.push(`${fighterA.name} has chin concerns (KO'd ${fighterA.history.timesKOd}x)`);
  }
  if (fighterB.history.timesKOd >= 3) {
    insights.push(`${fighterB.name} has chin concerns (KO'd ${fighterB.history.timesKOd}x)`);
  }

  // Ring rust
  if (fighterA.history.daysSinceLastFight > 365) {
    const months = Math.floor(fighterA.history.daysSinceLastFight / 30);
    insights.push(`${fighterA.name} ring rust concern (${months} months off)`);
  }
  if (fighterB.history.daysSinceLastFight > 365) {
    const months = Math.floor(fighterB.history.daysSinceLastFight / 30);
    insights.push(`${fighterB.name} ring rust concern (${months} months off)`);
  }

  // Championship rounds
  if (factors.championshipRounds > 0.03) {
    insights.push(`${fighterA.name} has 5-round experience advantage`);
  } else if (factors.championshipRounds < -0.03) {
    insights.push(`${fighterB.name} has 5-round experience advantage`);
  }

  // Limit to top 6 insights
  return insights.slice(0, 6);
}

// ==================== Helper Functions ====================

function getStanceRecord(
  perf: StancePerformance,
  stance: Stance
): { wins: number; losses: number } {
  switch (stance) {
    case 'orthodox': return perf.vsOrthodox;
    case 'southpaw': return perf.vsSouthpaw;
    case 'switch': return perf.vsSwitch;
    default: return { wins: 0, losses: 0 };
  }
}

function getStyleRecord(
  perf: StylePerformance,
  style: FightingStyle
): { wins: number; losses: number } {
  switch (style) {
    case 'MMA': return perf.vsMMA;
    case 'Striker': return perf.vsStriker;
    case 'Grappler': return perf.vsGrappler;
    default: return { wins: 0, losses: 0 };
  }
}

function calculateWinRate(record: { wins: number; losses: number }): number {
  const total = record.wins + record.losses;
  return total === 0 ? 0.5 : record.wins / total;
}

function isHighAltitude(location?: string): boolean {
  if (!location) return false;
  return HIGH_ALTITUDE_LOCATIONS.some(
    h => location.toLowerCase().includes(h.toLowerCase())
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

export { MODEL_VERSION };
