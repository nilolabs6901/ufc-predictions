// Prediction Service
// Transforms database models and generates predictions

import { prisma } from '../database/prisma';
import {
  predictFight,
  FighterData,
  FightContext,
  PredictionResult,
  Stance,
  FightingStyle,
  FightingApproach,
  CageSize,
  MODEL_VERSION,
} from '../prediction-engine';

/**
 * Transform database fighter to prediction engine format
 */
export function transformFighterData(dbFighter: DatabaseFighter): FighterData {
  const stats = dbFighter.stats || {
    slpm: 0,
    strAcc: 0,
    sapm: 0,
    strDef: 0,
    tdAvg: 0,
    tdAcc: 0,
    tdDef: 0,
    subAvg: 0,
  };

  // Build stance performance from database records
  const stancePerformance = {
    vsOrthodox: { wins: 0, losses: 0 },
    vsSouthpaw: { wins: 0, losses: 0 },
    vsSwitch: { wins: 0, losses: 0 },
  };

  for (const sp of dbFighter.stancePerformance || []) {
    const key = `vs${capitalize(sp.opponentStance)}` as keyof typeof stancePerformance;
    if (stancePerformance[key]) {
      stancePerformance[key] = { wins: sp.wins, losses: sp.losses };
    }
  }

  // Build style performance from database records
  const stylePerformance = {
    vsMMA: { wins: 0, losses: 0 },
    vsStriker: { wins: 0, losses: 0 },
    vsGrappler: { wins: 0, losses: 0 },
  };

  for (const sp of dbFighter.stylePerformance || []) {
    const key = `vs${sp.opponentStyle}` as keyof typeof stylePerformance;
    if (stylePerformance[key]) {
      stylePerformance[key] = { wins: sp.wins, losses: sp.losses };
    }
  }

  // Calculate age if date of birth is available
  let age: number | undefined;
  if (dbFighter.dateOfBirth) {
    const today = new Date();
    const birth = new Date(dbFighter.dateOfBirth);
    age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }

  return {
    id: dbFighter.id,
    name: dbFighter.name,
    stance: (dbFighter.stance as Stance) || 'orthodox',
    fightingStyle: (dbFighter.fightingStyle as FightingStyle) || 'MMA',
    fightingApproach: dbFighter.fightingApproach as FightingApproach | undefined,
    height: dbFighter.height || undefined,
    reach: dbFighter.reach || undefined,
    age,
    stats: {
      slpm: stats.slpm,
      strAcc: stats.strAcc,
      sapm: stats.sapm,
      strDef: stats.strDef,
      tdAvg: stats.tdAvg,
      tdAcc: stats.tdAcc,
      tdDef: stats.tdDef,
      subAvg: stats.subAvg,
    },
    history: {
      currentStreak: dbFighter.currentStreak,
      last5Record: dbFighter.last5Record,
      finishRateLast5: dbFighter.finishRateLast5,
      careerFinishRate: dbFighter.careerFinishRate,
      daysSinceLastFight: dbFighter.daysSinceLastFight,
      timesKOd: dbFighter.timesKOd,
      timesSubmitted: dbFighter.timesSubmitted,
      fiveRoundFights: dbFighter.fiveRoundFights,
      winsInLateRounds: dbFighter.winsInLateRounds,
    },
    stancePerformance,
    stylePerformance,
    currentRank: dbFighter.currentRank || undefined,
    isChampion: dbFighter.isChampion,
    naturalWeightClass: dbFighter.naturalWeightClass || undefined,
    hometown: dbFighter.hometown || undefined,
    trainingCamp: dbFighter.trainingCamp || undefined,
  };
}

/**
 * Get or generate prediction for a fight
 */
export async function getPrediction(fightId: string): Promise<PredictionWithFighters | null> {
  // First, check for cached prediction
  const existingPrediction = await prisma.prediction.findFirst({
    where: {
      fightId,
      modelVersion: MODEL_VERSION,
    },
    include: {
      fight: {
        include: {
          fighterA: {
            include: {
              stats: true,
              stancePerformance: true,
              stylePerformance: true,
            },
          },
          fighterB: {
            include: {
              stats: true,
              stancePerformance: true,
              stylePerformance: true,
            },
          },
          event: true,
        },
      },
    },
  });

  if (existingPrediction) {
    return formatPredictionResponse(existingPrediction);
  }

  // Generate new prediction
  const fight = await prisma.fight.findUnique({
    where: { id: fightId },
    include: {
      fighterA: {
        include: {
          stats: true,
          stancePerformance: true,
          stylePerformance: true,
        },
      },
      fighterB: {
        include: {
          stats: true,
          stancePerformance: true,
          stylePerformance: true,
        },
      },
      event: true,
    },
  });

  if (!fight) return null;

  // Transform fighters to prediction engine format
  const fighterAData = transformFighterData(fight.fighterA as unknown as DatabaseFighter);
  const fighterBData = transformFighterData(fight.fighterB as unknown as DatabaseFighter);

  // Build fight context
  const context: FightContext = {
    weightClass: fight.weightClass,
    isTitleFight: fight.isTitleFight,
    scheduledRounds: fight.scheduledRounds,
    fighterAOdds: fight.fighterAOdds || undefined,
    fighterBOdds: fight.fighterBOdds || undefined,
    venue: fight.event ? {
      city: fight.event.city || 'Unknown',
      country: fight.event.country || 'Unknown',
      altitude: fight.event.altitude,
      timezone: fight.event.timezone || 'UTC',
    } : undefined,
    cageSize: (fight.event?.cageSize as CageSize) || 'standard',
  };

  // Generate prediction
  const prediction = predictFight(fighterAData, fighterBData, context);

  // Determine predicted winner
  const predictedWinnerId = prediction.fighterAWinProb > 0.5
    ? fight.fighterAId
    : fight.fighterBId;

  // Save to database
  const savedPrediction = await prisma.prediction.create({
    data: {
      fightId,
      predictedWinnerId,
      fighterAWinProb: prediction.fighterAWinProb,
      fighterBWinProb: prediction.fighterBWinProb,
      fighterAByKO: prediction.fighterAByKO,
      fighterAByTKO: prediction.fighterAByTKO,
      fighterABySub: prediction.fighterABySub,
      fighterAByDec: prediction.fighterAByDec,
      fighterBByKO: prediction.fighterBByKO,
      fighterBByTKO: prediction.fighterBByTKO,
      fighterBBySub: prediction.fighterBBySub,
      fighterBByDec: prediction.fighterBByDec,
      confidence: prediction.confidence,
      modelVersion: MODEL_VERSION,
      factors: prediction.factors as object,
      insights: prediction.insights,
    },
    include: {
      fight: {
        include: {
          fighterA: {
            include: {
              stats: true,
              stancePerformance: true,
              stylePerformance: true,
            },
          },
          fighterB: {
            include: {
              stats: true,
              stancePerformance: true,
              stylePerformance: true,
            },
          },
          event: true,
        },
      },
    },
  });

  return formatPredictionResponse(savedPrediction);
}

/**
 * Generate predictions for all fights in an event
 */
export async function generateEventPredictions(eventId: string): Promise<PredictionWithFighters[]> {
  const fights = await prisma.fight.findMany({
    where: { eventId },
    select: { id: true },
    orderBy: { fightOrder: 'desc' },
  });

  const predictions: PredictionWithFighters[] = [];

  for (const fight of fights) {
    const prediction = await getPrediction(fight.id);
    if (prediction) {
      predictions.push(prediction);
    }
  }

  return predictions;
}

// ==================== Helper Types ====================

interface DatabaseFighter {
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
  stats?: {
    slpm: number;
    strAcc: number;
    sapm: number;
    strDef: number;
    tdAvg: number;
    tdAcc: number;
    tdDef: number;
    subAvg: number;
  } | null;
  stancePerformance: Array<{
    opponentStance: string;
    wins: number;
    losses: number;
  }>;
  stylePerformance: Array<{
    opponentStyle: string;
    wins: number;
    losses: number;
  }>;
}

export interface PredictionWithFighters {
  id: string;
  fightId: string;
  fighterAWinProb: number;
  fighterBWinProb: number;
  fighterAByKO: number;
  fighterAByTKO: number;
  fighterABySub: number;
  fighterAByDec: number;
  fighterBByKO: number;
  fighterBByTKO: number;
  fighterBBySub: number;
  fighterBByDec: number;
  confidence: number;
  modelVersion: string;
  factors: object;
  insights: string[];
  predictedWinner: {
    id: string;
    name: string;
  };
  fight: {
    id: string;
    weightClass: string;
    isTitleFight: boolean;
    scheduledRounds: number;
    fighterAOdds: number | null;
    fighterBOdds: number | null;
    fighterA: FighterSummary;
    fighterB: FighterSummary;
    event: {
      id: string;
      name: string;
      date: Date;
      venue: string | null;
      city: string | null;
      country: string | null;
    };
  };
}

interface FighterSummary {
  id: string;
  name: string;
  nickname: string | null;
  imageUrl: string | null;
  nationality: string | null;
  stance: string;
  fightingStyle: string;
  wins: number;
  losses: number;
  draws: number;
  currentRank: number | null;
  isChampion: boolean;
}

function formatPredictionResponse(dbPrediction: any): PredictionWithFighters {
  return {
    id: dbPrediction.id,
    fightId: dbPrediction.fightId,
    fighterAWinProb: dbPrediction.fighterAWinProb,
    fighterBWinProb: dbPrediction.fighterBWinProb,
    fighterAByKO: dbPrediction.fighterAByKO,
    fighterAByTKO: dbPrediction.fighterAByTKO,
    fighterABySub: dbPrediction.fighterABySub,
    fighterAByDec: dbPrediction.fighterAByDec,
    fighterBByKO: dbPrediction.fighterBByKO,
    fighterBByTKO: dbPrediction.fighterBByTKO,
    fighterBBySub: dbPrediction.fighterBBySub,
    fighterBByDec: dbPrediction.fighterBByDec,
    confidence: dbPrediction.confidence,
    modelVersion: dbPrediction.modelVersion,
    factors: dbPrediction.factors,
    insights: dbPrediction.insights,
    predictedWinner: {
      id: dbPrediction.predictedWinnerId,
      name: dbPrediction.fight.fighterA.id === dbPrediction.predictedWinnerId
        ? dbPrediction.fight.fighterA.name
        : dbPrediction.fight.fighterB.name,
    },
    fight: {
      id: dbPrediction.fight.id,
      weightClass: dbPrediction.fight.weightClass,
      isTitleFight: dbPrediction.fight.isTitleFight,
      scheduledRounds: dbPrediction.fight.scheduledRounds,
      fighterAOdds: dbPrediction.fight.fighterAOdds,
      fighterBOdds: dbPrediction.fight.fighterBOdds,
      fighterA: {
        id: dbPrediction.fight.fighterA.id,
        name: dbPrediction.fight.fighterA.name,
        nickname: dbPrediction.fight.fighterA.nickname,
        imageUrl: dbPrediction.fight.fighterA.imageUrl,
        nationality: dbPrediction.fight.fighterA.nationality,
        stance: dbPrediction.fight.fighterA.stance,
        fightingStyle: dbPrediction.fight.fighterA.fightingStyle,
        wins: dbPrediction.fight.fighterA.wins,
        losses: dbPrediction.fight.fighterA.losses,
        draws: dbPrediction.fight.fighterA.draws,
        currentRank: dbPrediction.fight.fighterA.currentRank,
        isChampion: dbPrediction.fight.fighterA.isChampion,
      },
      fighterB: {
        id: dbPrediction.fight.fighterB.id,
        name: dbPrediction.fight.fighterB.name,
        nickname: dbPrediction.fight.fighterB.nickname,
        imageUrl: dbPrediction.fight.fighterB.imageUrl,
        nationality: dbPrediction.fight.fighterB.nationality,
        stance: dbPrediction.fight.fighterB.stance,
        fightingStyle: dbPrediction.fight.fighterB.fightingStyle,
        wins: dbPrediction.fight.fighterB.wins,
        losses: dbPrediction.fight.fighterB.losses,
        draws: dbPrediction.fight.fighterB.draws,
        currentRank: dbPrediction.fight.fighterB.currentRank,
        isChampion: dbPrediction.fight.fighterB.isChampion,
      },
      event: {
        id: dbPrediction.fight.event.id,
        name: dbPrediction.fight.event.name,
        date: dbPrediction.fight.event.date,
        venue: dbPrediction.fight.event.venue,
        city: dbPrediction.fight.event.city,
        country: dbPrediction.fight.event.country,
      },
    },
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
