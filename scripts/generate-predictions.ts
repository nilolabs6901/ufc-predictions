// Generate predictions for all fights in upcoming events
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  predictFight,
  FighterData,
  FightContext,
  Stance,
  FightingStyle,
  FightingApproach,
  CageSize,
  MODEL_VERSION,
} from '../src/lib/prediction-engine';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function transformFighterData(dbFighter: any): FighterData {
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

async function main() {
  console.log('Generating predictions for all fights...\n');

  // Get all fights without predictions
  const fights = await prisma.fight.findMany({
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
      predictions: true,
    },
  });

  console.log(`Found ${fights.length} fights total`);

  for (const fight of fights) {
    // Check if prediction already exists
    if (fight.predictions.length > 0) {
      console.log(`  Skipping ${fight.fighterA.name} vs ${fight.fighterB.name} - prediction exists`);
      continue;
    }

    // Transform fighters
    const fighterAData = transformFighterData(fight.fighterA);
    const fighterBData = transformFighterData(fight.fighterB);

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
    await prisma.prediction.create({
      data: {
        fightId: fight.id,
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
    });

    const winner = prediction.fighterAWinProb > 0.5 ? fight.fighterA.name : fight.fighterB.name;
    const winProb = Math.max(prediction.fighterAWinProb, prediction.fighterBWinProb) * 100;
    console.log(`  Generated: ${fight.fighterA.name} vs ${fight.fighterB.name} -> ${winner} (${winProb.toFixed(1)}%)`);
  }

  console.log('\nPredictions generated successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
