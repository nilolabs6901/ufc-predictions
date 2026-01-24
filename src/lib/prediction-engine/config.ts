// UFC Prediction Engine - Configuration Constants
// Research-backed weights and matchup data

/**
 * Factor weights for prediction model
 * These weights are derived from analysis of UFC fight outcomes
 * and must sum to 1.0
 */
export const FACTOR_WEIGHTS = {
  styleMatchup: 0.12,           // Fighting style advantages (grappler vs striker, etc.)
  strikingAdvantage: 0.12,      // Offensive and defensive striking differentials
  grapplingAdvantage: 0.12,     // Takedown and submission differentials
  durability: 0.10,             // Chin/vulnerability to finishes
  historicalPerformance: 0.14,  // Streak, recent form, ring rust
  experienceFactor: 0.12,       // Win rate, total fights, quality of competition
  stanceMatchup: 0.04,          // Orthodox vs southpaw dynamics
  styleHistory: 0.06,           // Individual records vs style types
  altitudeImpact: 0.02,         // High altitude acclimation
  travelFatigue: 0.02,          // Home country advantage
  cageSizeImpact: 0.02,         // Small vs standard cage effects
  weightClassFactor: 0.02,      // Natural weight class considerations
  championshipRounds: 0.04,     // 5-round experience
  physicalAttributes: 0.02,     // Reach and height advantages
  marketSignal: 0.04,           // Betting market implied probability
} as const;

// Verify weights sum to 1.0
const weightSum = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.warn(`Factor weights sum to ${weightSum}, expected 1.0`);
}

/**
 * Style matchup matrix
 * Based on Sport Journal study and historical UFC data
 * Key insight: Grapplers have ~60% win rate vs pure strikers
 */
export const STYLE_MATCHUPS: Record<string, { advantage: number; variance: number }> = {
  'MMA-MMA': { advantage: 0.50, variance: 0.15 },
  'MMA-Striker': { advantage: 0.55, variance: 0.12 },
  'MMA-Grappler': { advantage: 0.52, variance: 0.10 },
  'Striker-MMA': { advantage: 0.45, variance: 0.12 },
  'Striker-Striker': { advantage: 0.50, variance: 0.20 },
  'Striker-Grappler': { advantage: 0.40, variance: 0.18 },
  'Grappler-MMA': { advantage: 0.48, variance: 0.10 },
  'Grappler-Striker': { advantage: 0.60, variance: 0.18 },
  'Grappler-Grappler': { advantage: 0.50, variance: 0.12 },
};

/**
 * Win streak impact on prediction
 * Research shows diminishing returns beyond 5 wins
 * and compounding negative effects from losing streaks
 */
export const STREAK_IMPACT: Record<string, number> = {
  '-5': -0.15,  // Major confidence/momentum loss
  '-4': -0.12,
  '-3': -0.09,
  '-2': -0.06,
  '-1': -0.03,
  '0': 0,
  '1': 0.02,
  '2': 0.04,
  '3': 0.06,
  '4': 0.08,
  '5': 0.10,   // Momentum and confidence boost
};

/**
 * Weight class KO rate multipliers
 * Heavier weight classes have significantly higher finish rates
 */
export const WEIGHT_CLASS_KO_MULTIPLIER: Record<string, number> = {
  'Strawweight': 0.85,
  "Women's Strawweight": 0.80,
  'Flyweight': 0.88,
  "Women's Flyweight": 0.82,
  'Bantamweight': 0.92,
  "Women's Bantamweight": 0.85,
  'Featherweight': 0.95,
  "Women's Featherweight": 0.88,
  'Lightweight': 1.0,
  'Welterweight': 1.05,
  'Middleweight': 1.10,
  'Light Heavyweight': 1.20,
  'Heavyweight': 1.30,
};

/**
 * Known venue altitudes (in meters)
 * High altitude (>1500m) significantly impacts cardio
 */
export const VENUE_ALTITUDES: Record<string, number> = {
  // High altitude venues
  'Mexico City': 2240,
  'Denver': 1609,
  'Salt Lake City': 1288,

  // Moderate altitude
  'São Paulo': 760,
  'Las Vegas': 610,
  'Riyadh': 612,

  // Sea level
  'Abu Dhabi': 5,
  'Singapore': 15,
  'London': 11,
  'Sydney': 58,
  'New York': 10,
  'Los Angeles': 71,
  'Toronto': 76,
  'Paris': 35,
  'Miami': 2,
  'Jacksonville': 12,
  'Houston': 15,
  'Boston': 6,
  'Chicago': 181,
  'Atlanta': 320,
  'Dallas': 131,
};

/**
 * Ring rust thresholds (in days)
 */
export const RING_RUST_THRESHOLDS = {
  OPTIMAL_MIN: 60,      // 2 months minimum between fights
  OPTIMAL_MAX: 240,     // 8 months maximum before rust sets in
  MODERATE_RUST: 365,   // 12 months - noticeable decline
  SEVERE_RUST: 540,     // 18 months - significant concern
  EXTREME_RUST: 730,    // 24 months - major disadvantage
} as const;

/**
 * Ring rust impact modifiers
 */
export const RING_RUST_IMPACT = {
  TOO_QUICK: -0.02,     // Less than 2 months recovery
  OPTIMAL: 0.03,        // Sweet spot
  MODERATE: 0,          // 8-12 months - neutral
  RUST_MODERATE: -0.04, // 12-18 months
  RUST_SEVERE: -0.06,   // 18-24 months
  RUST_EXTREME: -0.08,  // 24+ months
} as const;

/**
 * High altitude locations for acclimation detection
 */
export const HIGH_ALTITUDE_LOCATIONS = [
  'Mexico',
  'Denver',
  'Colorado',
  'Salt Lake',
  'Utah',
  'Albuquerque',
  'New Mexico',
  'Colombia',
  'Bolivia',
  'Peru',
  'Ecuador',
  'Ethiopia',
  'Kenya',
];

/**
 * Model version for tracking predictions
 */
export const MODEL_VERSION = '2.3.0';

/**
 * Confidence thresholds for categorization
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.70,    // >70% - high confidence prediction
  MEDIUM: 0.55,  // 55-70% - medium confidence
  LOW: 0.55,     // <55% - low confidence (close to coin flip)
} as const;

/**
 * Referee tendency database
 * Based on historical UFC refereeing patterns
 */
export const REFEREE_DATA: Record<string, {
  avgStandUpsPerFight: number;
  earlyStoppageRate: number;
  lateStoppageRate: number;
  favorsGrapplers: boolean;
  favorsStrikers: boolean;
  totalFights: number;
}> = {
  'Herb Dean': {
    avgStandUpsPerFight: 1.2,
    earlyStoppageRate: 0.05,
    lateStoppageRate: 0.12,
    favorsGrapplers: false,
    favorsStrikers: false,
    totalFights: 800,
  },
  'Marc Goddard': {
    avgStandUpsPerFight: 1.8,
    earlyStoppageRate: 0.08,
    lateStoppageRate: 0.05,
    favorsGrapplers: false,
    favorsStrikers: true,
    totalFights: 500,
  },
  'Jason Herzog': {
    avgStandUpsPerFight: 0.9,
    earlyStoppageRate: 0.06,
    lateStoppageRate: 0.08,
    favorsGrapplers: true,
    favorsStrikers: false,
    totalFights: 400,
  },
  'Dan Miragliotta': {
    avgStandUpsPerFight: 1.5,
    earlyStoppageRate: 0.04,
    lateStoppageRate: 0.15,
    favorsGrapplers: false,
    favorsStrikers: false,
    totalFights: 450,
  },
  'Keith Peterson': {
    avgStandUpsPerFight: 2.1,
    earlyStoppageRate: 0.07,
    lateStoppageRate: 0.06,
    favorsGrapplers: false,
    favorsStrikers: true,
    totalFights: 350,
  },
  'Mike Beltran': {
    avgStandUpsPerFight: 1.3,
    earlyStoppageRate: 0.05,
    lateStoppageRate: 0.10,
    favorsGrapplers: false,
    favorsStrikers: false,
    totalFights: 300,
  },
  'Chris Tognoni': {
    avgStandUpsPerFight: 1.6,
    earlyStoppageRate: 0.06,
    lateStoppageRate: 0.07,
    favorsGrapplers: false,
    favorsStrikers: false,
    totalFights: 250,
  },
  'Mark Smith': {
    avgStandUpsPerFight: 1.4,
    earlyStoppageRate: 0.05,
    lateStoppageRate: 0.09,
    favorsGrapplers: false,
    favorsStrikers: false,
    totalFights: 200,
  },
};

/**
 * Judge tendency database
 * Based on historical judging patterns
 */
export const JUDGE_DATA: Record<string, {
  favorsPressure: boolean;
  favorsVolume: boolean;
  favorsDamage: boolean;
  favorsGrappling: boolean;
  homeFighterBias: number;
  splitDecisionRate: number;
}> = {
  "Sal D'Amato": {
    favorsPressure: true,
    favorsVolume: false,
    favorsDamage: true,
    favorsGrappling: false,
    homeFighterBias: 0.02,
    splitDecisionRate: 0.18,
  },
  'Chris Lee': {
    favorsPressure: false,
    favorsVolume: true,
    favorsDamage: false,
    favorsGrappling: false,
    homeFighterBias: 0.03,
    splitDecisionRate: 0.22,
  },
  'Derek Cleary': {
    favorsPressure: false,
    favorsVolume: false,
    favorsDamage: true,
    favorsGrappling: true,
    homeFighterBias: 0.01,
    splitDecisionRate: 0.15,
  },
  'Junichiro Kamijo': {
    favorsPressure: true,
    favorsVolume: true,
    favorsDamage: false,
    favorsGrappling: false,
    homeFighterBias: 0.0,
    splitDecisionRate: 0.12,
  },
  'Mike Bell': {
    favorsPressure: false,
    favorsVolume: true,
    favorsDamage: false,
    favorsGrappling: true,
    homeFighterBias: 0.02,
    splitDecisionRate: 0.20,
  },
};

/**
 * Referee impact on fight outcomes
 */
export const REFEREE_IMPACT = {
  STAND_UP_PENALTY_GRAPPLER: -0.03,  // Quick stand-ups hurt grapplers
  STAND_UP_BONUS_STRIKER: 0.02,       // Quick stand-ups help strikers
  LATE_STOPPAGE_RISK: -0.02,          // Bad chin fighters disadvantaged
  EARLY_STOPPAGE_BENEFIT: 0.02,       // Good chin fighters benefit
} as const;

/**
 * Injury severity impact multipliers
 */
export const INJURY_SEVERITY_IMPACT: Record<string, number> = {
  'minor': -0.02,
  'moderate': -0.05,
  'major': -0.10,
  'career_threatening': -0.20,
};

/**
 * Injury type multipliers by fighting style
 * Knee injuries hurt grapplers more, hand injuries hurt strikers more
 */
export const INJURY_TYPE_MULTIPLIERS: Record<string, Record<string, number>> = {
  'knee': { 'Grappler': 1.5, 'Wrestler': 1.5, 'MMA': 1.2, 'Striker': 1.0 },
  'shoulder': { 'Grappler': 1.3, 'Wrestler': 1.4, 'MMA': 1.1, 'Striker': 1.0 },
  'hand': { 'Striker': 1.5, 'MMA': 1.2, 'Grappler': 0.8, 'Wrestler': 0.8 },
  'back': { 'Grappler': 1.3, 'Wrestler': 1.3, 'MMA': 1.2, 'Striker': 1.1 },
  'leg': { 'Striker': 1.3, 'MMA': 1.2, 'Grappler': 1.1, 'Wrestler': 1.1 },
};

/**
 * Training camp quality impact
 */
export const CAMP_IMPACT = {
  SHORT_NOTICE: -0.05,      // Less than 4 weeks notice
  SHORT_CAMP: -0.03,        // 4-6 weeks (abbreviated camp)
  NORMAL_CAMP: 0,           // 8-12 weeks
  LONG_CAMP: 0.01,          // 12+ weeks
  CAMP_CHANGE: -0.04,       // Recently changed camps
  WEIGHT_ISSUES: -0.04,     // Reported weight cut problems
  PERSONAL_ISSUES: -0.03,   // Public personal problems
  LOW_CONFIDENCE: -0.02,    // Reported low confidence
  HIGH_CONFIDENCE: 0.01,    // Reported high confidence
} as const;
