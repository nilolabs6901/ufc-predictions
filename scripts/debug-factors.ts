import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { predictFight } from '../src/lib/prediction-engine';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
  // Get Arnold Allen vs Jean Silva fight
  const fight = await prisma.fight.findFirst({
    where: {
      fighterA: { name: { contains: 'Allen' } },
      fighterB: { name: { contains: 'Jean' } }
    },
    include: {
      fighterA: { include: { stats: true } },
      fighterB: { include: { stats: true } },
      event: true
    }
  });

  if (!fight) {
    console.log('Fight not found');
    return;
  }

  console.log('=== Arnold Allen vs Jean Silva ===\n');
  console.log(`Allen: ${fight.fighterA.wins}-${fight.fighterA.losses} (${fight.fighterAOdds})`);
  console.log(`Silva: ${fight.fighterB.wins}-${fight.fighterB.losses} (${fight.fighterBOdds})`);
  console.log('');

  // Build fighter data
  const fighterAData = {
    id: fight.fighterA.id,
    name: fight.fighterA.name,
    stance: (fight.fighterA.stance || 'orthodox') as 'orthodox' | 'southpaw' | 'switch',
    fightingStyle: (fight.fighterA.fightingStyle || 'MMA') as 'MMA' | 'Striker' | 'Grappler',
    height: fight.fighterA.height ?? undefined,
    reach: fight.fighterA.reach ?? undefined,
    wins: fight.fighterA.wins,
    losses: fight.fighterA.losses,
    draws: fight.fighterA.draws,
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
    wins: fight.fighterB.wins,
    losses: fight.fighterB.losses,
    draws: fight.fighterB.draws,
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
    stancePerformance: { vsOrthodox: { wins: 0, losses: 0 }, vsSouthpaw: { wins: 0, losses: 0 }, vsSwitch: { wins: 0, losses: 0 } },
    stylePerformance: { vsMMA: { wins: 0, losses: 0 }, vsStriker: { wins: 0, losses: 0 }, vsGrappler: { wins: 0, losses: 0 } },
    isChampion: fight.fighterB.isChampion,
  };

  console.log('Fighter A Stats:', fighterAData.stats);
  console.log('Fighter B Stats:', fighterBData.stats);
  console.log('');
  console.log('Fighter A Style:', fighterAData.fightingStyle);
  console.log('Fighter B Style:', fighterBData.fightingStyle);
  console.log('');

  const context = {
    weightClass: fight.weightClass,
    isTitleFight: fight.isTitleFight,
    scheduledRounds: fight.scheduledRounds,
    fighterAOdds: fight.fighterAOdds ?? undefined,
    fighterBOdds: fight.fighterBOdds ?? undefined,
    cageSize: 'standard' as const,
  };

  const prediction = predictFight(fighterAData, fighterBData, context);

  console.log('=== Factor Breakdown ===');
  for (const [key, value] of Object.entries(prediction.factors)) {
    const sign = value > 0 ? '+' : '';
    console.log(`${key}: ${sign}${value.toFixed(3)}`);
  }

  console.log('\n=== Result ===');
  console.log(`Allen: ${Math.round(prediction.fighterAWinProb * 100)}%`);
  console.log(`Silva: ${Math.round(prediction.fighterBWinProb * 100)}%`);

  await prisma.$disconnect();
}

debug().catch(console.error);
