// Monte Carlo Simulation Engine for UFC Fight Predictions
// Runs thousands of simulated fights to generate probability distributions

import { FighterData, FightContext } from './types';
import { WEIGHT_CLASS_KO_MULTIPLIER } from './config';

export interface SimulationResult {
  winner: 'A' | 'B' | 'draw';
  method: 'KO' | 'TKO' | 'SUB' | 'DEC';
  round: number;
  healthA: number;
  healthB: number;
  cardioA: number;
  cardioB: number;
}

export interface MonteCarloResult {
  iterations: number;
  fighterAWins: number;
  fighterBWins: number;
  draws: number;
  fighterAWinProb: number;
  fighterBWinProb: number;
  confidenceInterval95: { lower: number; upper: number };
  methodDistribution: {
    fighterAByKO: number;
    fighterAByTKO: number;
    fighterABySub: number;
    fighterAByDec: number;
    fighterBByKO: number;
    fighterBByTKO: number;
    fighterBBySub: number;
    fighterBByDec: number;
  };
  roundDistribution: number[];
  variance: number;
  standardDeviation: number;
}

// Configuration for simulation
const CONFIG = {
  ITERATIONS: 10000,
  BASE_HEALTH: 100,
  BASE_CARDIO: 100,
  HEALTH_DECAY_PER_ROUND: 5,
  CARDIO_DECAY_PER_ROUND: 8,
  KO_THRESHOLD: 15,
  TKO_THRESHOLD: 25,
  SUB_THRESHOLD: 20,
  ROUNDS_PER_MINUTE: 5,
};

/**
 * Run Monte Carlo simulation for a fight
 */
export function runMonteCarloSimulation(
  fighterA: FighterData,
  fighterB: FighterData,
  context: FightContext,
  baseWinProbA: number,
  iterations: number = CONFIG.ITERATIONS
): MonteCarloResult {
  const results: SimulationResult[] = [];
  const scheduledRounds = context.scheduledRounds || 3;
  const koMultiplier = WEIGHT_CLASS_KO_MULTIPLIER[context.weightClass] || 1.0;

  // Fighter attributes for simulation
  const fighterAStats = {
    strikingPower: calculateStrikingPower(fighterA, koMultiplier),
    submissionThreat: calculateSubmissionThreat(fighterA),
    cardioMultiplier: calculateCardioMultiplier(fighterA),
    defensiveAbility: calculateDefensiveAbility(fighterA),
    chinDurability: calculateChinDurability(fighterA),
    subDefense: calculateSubDefense(fighterA),
  };

  const fighterBStats = {
    strikingPower: calculateStrikingPower(fighterB, koMultiplier),
    submissionThreat: calculateSubmissionThreat(fighterB),
    cardioMultiplier: calculateCardioMultiplier(fighterB),
    defensiveAbility: calculateDefensiveAbility(fighterB),
    chinDurability: calculateChinDurability(fighterB),
    subDefense: calculateSubDefense(fighterB),
  };

  // Run simulations
  for (let i = 0; i < iterations; i++) {
    const result = simulateFight(
      fighterAStats,
      fighterBStats,
      baseWinProbA,
      scheduledRounds
    );
    results.push(result);
  }

  // Aggregate results
  return aggregateResults(results, iterations);
}

/**
 * Simulate a single fight
 */
function simulateFight(
  statsA: ReturnType<typeof calculateStrikingPower> extends number ? {
    strikingPower: number;
    submissionThreat: number;
    cardioMultiplier: number;
    defensiveAbility: number;
    chinDurability: number;
    subDefense: number;
  } : never,
  statsB: typeof statsA,
  baseWinProbA: number,
  scheduledRounds: number
): SimulationResult {
  let healthA = CONFIG.BASE_HEALTH;
  let healthB = CONFIG.BASE_HEALTH;
  let cardioA = CONFIG.BASE_CARDIO;
  let cardioB = CONFIG.BASE_CARDIO;

  // Apply skill-based probability modifier
  const skillModifier = (baseWinProbA - 0.5) * 0.3;

  for (let round = 1; round <= scheduledRounds; round++) {
    // Simulate round exchanges (5 significant moments per round)
    for (let moment = 0; moment < CONFIG.ROUNDS_PER_MINUTE; moment++) {
      // Calculate effective skill levels (reduced by cardio loss)
      const effectiveA = (cardioA / 100) * (1 + skillModifier);
      const effectiveB = (cardioB / 100) * (1 - skillModifier);

      // Determine who lands significant offense this moment
      const roll = Math.random();
      const aThreshold = effectiveA / (effectiveA + effectiveB);

      if (roll < aThreshold) {
        // Fighter A lands offense
        const damage = calculateDamage(statsA.strikingPower, statsB.defensiveAbility);
        healthB -= damage * (100 / statsB.chinDurability);

        // Check for KO
        if (healthB <= CONFIG.KO_THRESHOLD && Math.random() < 0.4) {
          return { winner: 'A', method: 'KO', round, healthA, healthB, cardioA, cardioB };
        }

        // Check for TKO
        if (healthB <= CONFIG.TKO_THRESHOLD && Math.random() < 0.3) {
          return { winner: 'A', method: 'TKO', round, healthA, healthB, cardioA, cardioB };
        }

        // Check for submission attempt
        if (Math.random() < statsA.submissionThreat * 0.1) {
          if (Math.random() > statsB.subDefense * 0.01) {
            return { winner: 'A', method: 'SUB', round, healthA, healthB, cardioA, cardioB };
          }
        }
      } else {
        // Fighter B lands offense
        const damage = calculateDamage(statsB.strikingPower, statsA.defensiveAbility);
        healthA -= damage * (100 / statsA.chinDurability);

        // Check for KO
        if (healthA <= CONFIG.KO_THRESHOLD && Math.random() < 0.4) {
          return { winner: 'B', method: 'KO', round, healthA, healthB, cardioA, cardioB };
        }

        // Check for TKO
        if (healthA <= CONFIG.TKO_THRESHOLD && Math.random() < 0.3) {
          return { winner: 'B', method: 'TKO', round, healthA, healthB, cardioA, cardioB };
        }

        // Check for submission attempt
        if (Math.random() < statsB.submissionThreat * 0.1) {
          if (Math.random() > statsA.subDefense * 0.01) {
            return { winner: 'B', method: 'SUB', round, healthA, healthB, cardioA, cardioB };
          }
        }
      }
    }

    // End of round: apply cardio decay
    cardioA = Math.max(20, cardioA - CONFIG.CARDIO_DECAY_PER_ROUND / statsA.cardioMultiplier);
    cardioB = Math.max(20, cardioB - CONFIG.CARDIO_DECAY_PER_ROUND / statsB.cardioMultiplier);

    // Apply health recovery between rounds
    healthA = Math.min(CONFIG.BASE_HEALTH, healthA + 3);
    healthB = Math.min(CONFIG.BASE_HEALTH, healthB + 3);
  }

  // Fight goes to decision - judge based on damage dealt (health remaining)
  const totalDamageToB = CONFIG.BASE_HEALTH - healthB;
  const totalDamageToA = CONFIG.BASE_HEALTH - healthA;

  // Add some randomness to decision (judging variance)
  const aScore = totalDamageToB + (Math.random() * 10 - 5);
  const bScore = totalDamageToA + (Math.random() * 10 - 5);

  if (aScore > bScore) {
    return { winner: 'A', method: 'DEC', round: scheduledRounds, healthA, healthB, cardioA, cardioB };
  } else if (bScore > aScore) {
    return { winner: 'B', method: 'DEC', round: scheduledRounds, healthA, healthB, cardioA, cardioB };
  } else {
    return { winner: 'draw', method: 'DEC', round: scheduledRounds, healthA, healthB, cardioA, cardioB };
  }
}

/**
 * Aggregate simulation results
 */
function aggregateResults(results: SimulationResult[], iterations: number): MonteCarloResult {
  let fighterAWins = 0;
  let fighterBWins = 0;
  let draws = 0;

  const methodCounts = {
    fighterAByKO: 0,
    fighterAByTKO: 0,
    fighterABySub: 0,
    fighterAByDec: 0,
    fighterBByKO: 0,
    fighterBByTKO: 0,
    fighterBBySub: 0,
    fighterBByDec: 0,
  };

  const roundDistribution = [0, 0, 0, 0, 0, 0]; // Rounds 1-5 + decision

  for (const result of results) {
    if (result.winner === 'A') {
      fighterAWins++;
      if (result.method === 'KO') methodCounts.fighterAByKO++;
      else if (result.method === 'TKO') methodCounts.fighterAByTKO++;
      else if (result.method === 'SUB') methodCounts.fighterABySub++;
      else methodCounts.fighterAByDec++;
    } else if (result.winner === 'B') {
      fighterBWins++;
      if (result.method === 'KO') methodCounts.fighterBByKO++;
      else if (result.method === 'TKO') methodCounts.fighterBByTKO++;
      else if (result.method === 'SUB') methodCounts.fighterBBySub++;
      else methodCounts.fighterBByDec++;
    } else {
      draws++;
    }

    // Track round distribution for finishes
    if (result.method !== 'DEC') {
      roundDistribution[result.round - 1]++;
    } else {
      roundDistribution[5]++; // Decision goes to index 5
    }
  }

  const fighterAWinProb = fighterAWins / iterations;
  const fighterBWinProb = fighterBWins / iterations;

  // Calculate 95% confidence interval using Wilson score interval
  const ci = wilsonConfidenceInterval(fighterAWins, iterations, 0.95);

  // Calculate variance and standard deviation
  const variance = fighterAWinProb * (1 - fighterAWinProb);
  const standardDeviation = Math.sqrt(variance);

  return {
    iterations,
    fighterAWins,
    fighterBWins,
    draws,
    fighterAWinProb: roundTo(fighterAWinProb, 4),
    fighterBWinProb: roundTo(fighterBWinProb, 4),
    confidenceInterval95: {
      lower: roundTo(ci.lower, 4),
      upper: roundTo(ci.upper, 4),
    },
    methodDistribution: {
      fighterAByKO: roundTo(methodCounts.fighterAByKO / iterations, 4),
      fighterAByTKO: roundTo(methodCounts.fighterAByTKO / iterations, 4),
      fighterABySub: roundTo(methodCounts.fighterABySub / iterations, 4),
      fighterAByDec: roundTo(methodCounts.fighterAByDec / iterations, 4),
      fighterBByKO: roundTo(methodCounts.fighterBByKO / iterations, 4),
      fighterBByTKO: roundTo(methodCounts.fighterBByTKO / iterations, 4),
      fighterBBySub: roundTo(methodCounts.fighterBBySub / iterations, 4),
      fighterBByDec: roundTo(methodCounts.fighterBByDec / iterations, 4),
    },
    roundDistribution: roundDistribution.map(r => roundTo(r / iterations, 4)),
    variance: roundTo(variance, 6),
    standardDeviation: roundTo(standardDeviation, 4),
  };
}

// ==================== Fighter Stat Calculations ====================

function calculateStrikingPower(fighter: FighterData, koMultiplier: number): number {
  const base = fighter.stats.slpm * 0.4 + (fighter.stats.strAcc / 100) * 0.6;
  return base * koMultiplier * (1 + fighter.history.careerFinishRate * 0.3);
}

function calculateSubmissionThreat(fighter: FighterData): number {
  return fighter.stats.subAvg * 2 + fighter.stats.tdAvg * 0.3;
}

function calculateCardioMultiplier(fighter: FighterData): number {
  // More 5-round experience = better cardio
  const expBonus = Math.min(0.3, fighter.history.fiveRoundFights * 0.05);
  // Higher SAPM means more exchanges = needs more cardio
  const workRatePenalty = fighter.stats.sapm * 0.02;
  return 1 + expBonus - workRatePenalty;
}

function calculateDefensiveAbility(fighter: FighterData): number {
  return (fighter.stats.strDef + fighter.stats.tdDef) / 2;
}

function calculateChinDurability(fighter: FighterData): number {
  // Base durability reduces with KO losses
  const base = 100;
  const koVulnerability = fighter.history.timesKOd * 8;
  return Math.max(50, base - koVulnerability);
}

function calculateSubDefense(fighter: FighterData): number {
  return fighter.stats.tdDef * 0.5 + (100 - fighter.history.timesSubmitted * 10);
}

function calculateDamage(strikingPower: number, defenseAbility: number): number {
  // Random damage with skill influence
  const baseDamage = 3 + Math.random() * 5;
  const skillMultiplier = strikingPower / (defenseAbility + 30);
  return baseDamage * skillMultiplier;
}

// ==================== Statistical Helpers ====================

/**
 * Wilson score interval for confidence bounds
 */
function wilsonConfidenceInterval(
  successes: number,
  total: number,
  confidence: number
): { lower: number; upper: number } {
  if (total === 0) return { lower: 0, upper: 1 };

  const p = successes / total;
  const z = getZScore(confidence);
  const z2 = z * z;
  const n = total;

  const denominator = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);

  return {
    lower: Math.max(0, (center - spread) / denominator),
    upper: Math.min(1, (center + spread) / denominator),
  };
}

/**
 * Get Z-score for confidence level
 */
function getZScore(confidence: number): number {
  // Common z-scores
  if (confidence >= 0.99) return 2.576;
  if (confidence >= 0.95) return 1.96;
  if (confidence >= 0.90) return 1.645;
  return 1.96; // Default to 95%
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

export { CONFIG as MONTE_CARLO_CONFIG };
