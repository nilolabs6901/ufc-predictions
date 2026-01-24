// UFC Prediction Engine - Public API

export { predictFight, MODEL_VERSION } from './calculator';

export type {
  FighterData,
  FighterStats,
  FighterHistory,
  FightContext,
  PredictionFactors,
  PredictionResult,
  Stance,
  FightingStyle,
  FightingApproach,
  CageSize,
  VenueInfo,
  StancePerformance,
  StylePerformance,
  StanceRecord,
  StyleRecord,
  DbFighter,
  DbFighterStats,
  DbStancePerformance,
  DbStylePerformance,
} from './types';

export {
  FACTOR_WEIGHTS,
  STYLE_MATCHUPS,
  STREAK_IMPACT,
  WEIGHT_CLASS_KO_MULTIPLIER,
  VENUE_ALTITUDES,
  RING_RUST_THRESHOLDS,
  CONFIDENCE_THRESHOLDS,
} from './config';
