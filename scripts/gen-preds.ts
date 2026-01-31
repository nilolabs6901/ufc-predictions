import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { predictFight } from '../src/lib/prediction-engine';
import { MODEL_VERSION } from '../src/lib/prediction-engine/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generatePredictions() {
  console.log(`Generating predictions with model ${MODEL_VERSION}...\n`);

  // Get all fights for the latest upcoming event
  const eventName = process.argv[2] || 'UFC 325';
  const fights = await prisma.fight.findMany({
    where: {
      event: { name: { contains: eventName } },
      isCompleted: false,
    },
    include: {
      fighterA: { include: { stats: true } },
      fighterB: { include: { stats: true } },
      event: true
    }
  });

  console.log(`Found ${fights.length} fights\n`);

  let upsetCount = 0;

  for (const fight of fights) {
    // Build fighter data
    const fighterAData = {
      id: fight.fighterA.id,
      name: fight.fighterA.name,
      stance: (fight.fighterA.stance || 'orthodox') as 'orthodox' | 'southpaw' | 'switch',
      fightingStyle: (fight.fighterA.fightingStyle || 'MMA') as 'MMA' | 'Striker' | 'Grappler',
      height: fight.fighterA.height ?? undefined,
      reach: fight.fighterA.reach ?? undefined,
      stats: {
        slpm: fight.fighterA.stats?.slpm || 0,
        strAcc: fight.fighterA.stats?.strAcc || 0,
        sapm: fight.fighterA.stats?.sapm || 0,
        strDef: fight.fighterA.stats?.strDef || 0,
        tdAvg: fight.fighterA.stats?.tdAvg || 0,
        tdAcc: fight.fighterA.stats?.tdAcc || 0,
        tdDef: fight.fighterA.stats?.tdDef || 0,
        subAvg: fight.fighterA.stats?.subAvg || 0,
      },
      history: {
        currentStreak: fight.fighterA.currentStreak,
        last5Record: fight.fighterA.last5Record,
        finishRateLast5: fight.fighterA.finishRateLast5,
        careerFinishRate: fight.fighterA.careerFinishRate,
        daysSinceLastFight: fight.fighterA.daysSinceLastFight,
        timesKOd: fight.fighterA.timesKOd,
        timesSubmitted: fight.fighterA.timesSubmitted,
        fiveRoundFights: fight.fighterA.fiveRoundFights,
        winsInLateRounds: fight.fighterA.winsInLateRounds,
      },
      wins: fight.fighterA.wins,
      losses: fight.fighterA.losses,
      draws: fight.fighterA.draws,
      stancePerformance: { vsOrthodox: { wins: 0, losses: 0 }, vsSouthpaw: { wins: 0, losses: 0 }, vsSwitch: { wins: 0, losses: 0 } },
      stylePerformance: { vsMMA: { wins: 0, losses: 0 }, vsStriker: { wins: 0, losses: 0 }, vsGrappler: { wins: 0, losses: 0 } },
      isChampion: fight.fighterA.isChampion,
    };

    const fighterBData = {
      id: fight.fighterB.id,
      name: fight.fighterB.name,
      stance: (fight.fighterB.stance || 'orthodox') as 'orthodox' | 'southpaw' | 'switch',
      fightingStyle: (fight.fighterB.fightingStyle || 'MMA') as 'MMA' | 'Striker' | 'Grappler',
      height: fight.fighterB.height ?? undefined,
      reach: fight.fighterB.reach ?? undefined,
      stats: {
        slpm: fight.fighterB.stats?.slpm || 0,
        strAcc: fight.fighterB.stats?.strAcc || 0,
        sapm: fight.fighterB.stats?.sapm || 0,
        strDef: fight.fighterB.stats?.strDef || 0,
        tdAvg: fight.fighterB.stats?.tdAvg || 0,
        tdAcc: fight.fighterB.stats?.tdAcc || 0,
        tdDef: fight.fighterB.stats?.tdDef || 0,
        subAvg: fight.fighterB.stats?.subAvg || 0,
      },
      history: {
        currentStreak: fight.fighterB.currentStreak,
        last5Record: fight.fighterB.last5Record,
        finishRateLast5: fight.fighterB.finishRateLast5,
        careerFinishRate: fight.fighterB.careerFinishRate,
        daysSinceLastFight: fight.fighterB.daysSinceLastFight,
        timesKOd: fight.fighterB.timesKOd,
        timesSubmitted: fight.fighterB.timesSubmitted,
        fiveRoundFights: fight.fighterB.fiveRoundFights,
        winsInLateRounds: fight.fighterB.winsInLateRounds,
      },
      wins: fight.fighterB.wins,
      losses: fight.fighterB.losses,
      draws: fight.fighterB.draws,
      stancePerformance: { vsOrthodox: { wins: 0, losses: 0 }, vsSouthpaw: { wins: 0, losses: 0 }, vsSwitch: { wins: 0, losses: 0 } },
      stylePerformance: { vsMMA: { wins: 0, losses: 0 }, vsStriker: { wins: 0, losses: 0 }, vsGrappler: { wins: 0, losses: 0 } },
      isChampion: fight.fighterB.isChampion,
    };

    const context = {
      weightClass: fight.weightClass,
      isTitleFight: fight.isTitleFight,
      scheduledRounds: fight.scheduledRounds,
      fighterAOdds: fight.fighterAOdds ?? undefined,
      fighterBOdds: fight.fighterBOdds ?? undefined,
      cageSize: 'standard' as const,
    };

    // Generate prediction
    const prediction = predictFight(fighterAData, fighterBData, context);

    // Determine predicted winner
    const predictedWinnerId = prediction.fighterAWinProb > 0.5
      ? fight.fighterAId
      : fight.fighterBId;

    const isPredA = predictedWinnerId === fight.fighterAId;

    // Check for upset
    const isUpset = (isPredA && fight.fighterAOdds !== null && fight.fighterAOdds > 0) ||
                   (!isPredA && fight.fighterBOdds !== null && fight.fighterBOdds > 0);

    if (isUpset) upsetCount++;

    // Format odds
    const oddsA = fight.fighterAOdds !== null ? (fight.fighterAOdds > 0 ? `+${fight.fighterAOdds}` : `${fight.fighterAOdds}`) : 'N/A';
    const oddsB = fight.fighterBOdds !== null ? (fight.fighterBOdds > 0 ? `+${fight.fighterBOdds}` : `${fight.fighterBOdds}`) : 'N/A';

    console.log(`${fight.fighterA.name} (${oddsA}) vs ${fight.fighterB.name} (${oddsB})`);
    console.log(`  Win Probs: ${Math.round(prediction.fighterAWinProb * 100)}% / ${Math.round(prediction.fighterBWinProb * 100)}%`);
    console.log(`  Predicted: ${isPredA ? fight.fighterA.name : fight.fighterB.name}`);
    if (isUpset) {
      const upsetFighter = isPredA ? fight.fighterA.name : fight.fighterB.name;
      const upsetOdds = isPredA ? fight.fighterAOdds : fight.fighterBOdds;
      console.log(`  ⚠️  UPSET ALERT: ${upsetFighter} (+${upsetOdds})`);
    }
    console.log('');

    // Save prediction
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
      }
    });
  }

  console.log('='.repeat(60));
  console.log(`Total Upset Alerts: ${upsetCount}`);

  await prisma.$disconnect();
  process.exit(0);
}

generatePredictions().catch(console.error);
