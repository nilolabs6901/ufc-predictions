// UFC Prediction Engine - Type Definitions

export type Stance = 'orthodox' | 'southpaw' | 'switch';
export type FightingStyle = 'MMA' | 'Striker' | 'Grappler';
export type FightingApproach = 'pressure' | 'counter' | 'volume' | 'point';
export type CageSize = 'standard' | 'small';

export interface FighterStats {
  slpm: number;      // Significant strikes landed per minute
  strAcc: number;    // Striking accuracy (0-100)
  sapm: number;      // Significant strikes absorbed per minute
  strDef: number;    // Striking defense (0-100)
  tdAvg: number;     // Takedowns average per 15 min
  tdAcc: number;     // Takedown accuracy (0-100)
  tdDef: number;     // Takedown defense (0-100)
  subAvg: number;    // Submission attempts per 15 min
}

export interface FighterHistory {
  currentStreak: number;      // Positive = wins, negative = losses
  last5Record: string;        // "4-1" format
  finishRateLast5: number;    // 0-1 percentage
  careerFinishRate: number;   // 0-1 percentage
  daysSinceLastFight: number;
  timesKOd: number;
  timesSubmitted: number;
  fiveRoundFights: number;
  winsInLateRounds: number;   // Rounds 4 & 5
}

export interface StanceRecord {
  wins: number;
  losses: number;
  draws?: number;
}

export interface StancePerformance {
  vsOrthodox: StanceRecord;
  vsSouthpaw: StanceRecord;
  vsSwitch: StanceRecord;
}

export interface StyleRecord {
  wins: number;
  losses: number;
  draws?: number;
}

export interface StylePerformance {
  vsMMA: StyleRecord;
  vsStriker: StyleRecord;
  vsGrappler: StyleRecord;
}

export interface FighterData {
  id: string;
  name: string;
  stance: Stance;
  fightingStyle: FightingStyle;
  fightingApproach?: FightingApproach;

  // Physical attributes (optional)
  height?: number;      // in cm
  reach?: number;       // in cm
  age?: number;

  // Win/Loss record
  wins?: number;
  losses?: number;
  draws?: number;

  // Career stats
  stats: FighterStats;
  history: FighterHistory;

  // Performance vs different opponents
  stancePerformance: StancePerformance;
  stylePerformance: StylePerformance;

  // Ranking info
  currentRank?: number;
  isChampion: boolean;

  // Location for environmental factors
  naturalWeightClass?: string;
  hometown?: string;
  trainingCamp?: string;
}

export interface VenueInfo {
  city: string;
  country: string;
  altitude: number;    // in meters
  timezone: string;
}

export interface FightContext {
  weightClass: string;
  isTitleFight: boolean;
  scheduledRounds: number;
  fighterAOdds?: number;   // American format: -150 or +200
  fighterBOdds?: number;
  venue?: VenueInfo;
  cageSize: CageSize;
}

export interface PredictionFactors {
  styleMatchup: number;          // -1 to 1, positive favors Fighter A
  strikingAdvantage: number;     // -1 to 1
  grapplingAdvantage: number;    // -1 to 1
  durability: number;            // -1 to 1
  physicalAttributes: number;    // -1 to 1
  historicalPerformance: number; // -1 to 1
  experienceFactor: number;      // -1 to 1, win rate and total fights
  stanceMatchup: number;         // -1 to 1
  styleHistory: number;          // -1 to 1
  altitudeImpact: number;        // -1 to 1
  travelFatigue: number;         // -1 to 1
  cageSizeImpact: number;        // -1 to 1
  weightClassFactor: number;     // -1 to 1
  championshipRounds: number;    // -1 to 1
  marketSignal: number;          // -1 to 1
}

export interface PredictionResult {
  // Win probabilities
  fighterAWinProb: number;       // 0-1
  fighterBWinProb: number;       // 0-1

  // Method probabilities for Fighter A
  fighterAByKO: number;
  fighterAByTKO: number;
  fighterABySub: number;
  fighterAByDec: number;

  // Method probabilities for Fighter B
  fighterBByKO: number;
  fighterBByTKO: number;
  fighterBBySub: number;
  fighterBByDec: number;

  // Meta
  confidence: number;            // 0-1
  factors: PredictionFactors;
  insights: string[];
}

// Database model interfaces for transformation
export interface DbFighter {
  id: string;
  name: string;
  stance: string;
  fightingStyle: string;
  fightingApproach?: string | null;
  height?: number | null;
  reach?: number | null;
  dateOfBirth?: Date | null;
  currentStreak: number;
  last5Record: string;
  finishRateLast5: number;
  careerFinishRate: number;
  daysSinceLastFight: number;
  timesKOd: number;
  timesSubmitted: number;
  fiveRoundFights: number;
  winsInLateRounds: number;
  currentRank?: number | null;
  isChampion: boolean;
  naturalWeightClass?: string | null;
  hometown?: string | null;
  trainingCamp?: string | null;
  stats?: DbFighterStats | null;
  stancePerformance: DbStancePerformance[];
  stylePerformance: DbStylePerformance[];
}

export interface DbFighterStats {
  slpm: number;
  strAcc: number;
  sapm: number;
  strDef: number;
  tdAvg: number;
  tdAcc: number;
  tdDef: number;
  subAvg: number;
}

export interface DbStancePerformance {
  opponentStance: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface DbStylePerformance {
  opponentStyle: string;
  wins: number;
  losses: number;
  draws: number;
}
