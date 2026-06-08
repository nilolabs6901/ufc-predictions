/**
 * UFC Freedom 250: Topuria vs Gaethje - Seed Script
 * June 14, 2026 - The White House, Washington, D.C.
 *
 * Mirrors the main card shown on the redesigned home page so that
 * "View Fight Card" (/events/ufc-freedom-250) renders end-to-end.
 *
 * Run with (uses the LIVE Railway database via injected env):
 *   railway run npx tsx scripts/seed-freedom250.ts
 *   railway run npx tsx scripts/generate-predictions.ts
 *
 * Or locally once Supabase is un-paused (.env.local DATABASE_URL):
 *   npx tsx scripts/seed-freedom250.ts && npx tsx scripts/generate-predictions.ts
 *
 * NOTE: Fighter stats below are hand-entered approximations for the
 * prediction demo (same approach as seed-ufc325.ts). Betting odds are
 * the real numbers scraped for the card. Verify before using for anything
 * other than a demo.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const EVENT_ID = 'ufc-freedom-250'; // must match the home-page link

const fighters = [
  // ── MAIN EVENT — Lightweight Title ──────────────────────────────────────
  {
    ufcStatsId: 'freedom250-topuria',
    name: 'Ilia Topuria',
    nickname: 'El Matador',
    imageUrl: null,
    nationality: 'Georgia/Spain',
    weightClass: 'Lightweight',
    hometown: 'Alicante, Spain',
    trainingCamp: 'Climent Club',
    stance: 'orthodox',
    height: 170,
    reach: 175,
    dateOfBirth: new Date('1997-01-21'),
    wins: 17, losses: 0, draws: 0,
    winByKO: 8, winByTKO: 4, winBySub: 3, winByDec: 2,
    fightingStyle: 'MMA', fightingApproach: 'pressure',
    currentStreak: 17, last5Record: '5-0', finishRateLast5: 0.8, careerFinishRate: 0.88,
    daysSinceLastFight: 210, timesKOd: 0, timesSubmitted: 0,
    fiveRoundFights: 2, winsInLateRounds: 1, titleFights: 3, titleWins: 3,
    currentRank: null, isChampion: true, naturalWeightClass: 'Lightweight',
    stats: { slpm: 5.85, strAcc: 51, sapm: 2.95, strDef: 60, tdAvg: 1.20, tdAcc: 45, tdDef: 80, subAvg: 1.1 },
  },
  {
    ufcStatsId: 'freedom250-gaethje',
    name: 'Justin Gaethje',
    nickname: 'The Highlight',
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Lightweight',
    hometown: 'Safford, Arizona, USA',
    trainingCamp: 'TriStar / Independent',
    stance: 'orthodox',
    height: 180, reach: 177,
    dateOfBirth: new Date('1988-11-14'),
    wins: 26, losses: 5, draws: 0,
    winByKO: 13, winByTKO: 6, winBySub: 0, winByDec: 7,
    fightingStyle: 'Striker', fightingApproach: 'pressure',
    currentStreak: 1, last5Record: '3-2', finishRateLast5: 0.4, careerFinishRate: 0.73,
    daysSinceLastFight: 300, timesKOd: 2, timesSubmitted: 2,
    fiveRoundFights: 5, winsInLateRounds: 2, titleFights: 3, titleWins: 0,
    currentRank: 1, isChampion: false, naturalWeightClass: 'Lightweight',
    stats: { slpm: 6.42, strAcc: 56, sapm: 6.85, strDef: 56, tdAvg: 0.30, tdAcc: 33, tdDef: 78, subAvg: 0.1 },
  },
  // ── CO-MAIN — Heavyweight Interim Title ─────────────────────────────────
  {
    ufcStatsId: 'freedom250-pereira',
    name: 'Alex Pereira',
    nickname: 'Poatan',
    imageUrl: null,
    nationality: 'Brazil',
    weightClass: 'Heavyweight',
    hometown: 'Sao Paulo, Brazil',
    trainingCamp: 'Teixeira MMA & Fitness',
    stance: 'orthodox',
    height: 193, reach: 200,
    dateOfBirth: new Date('1987-07-07'),
    wins: 13, losses: 3, draws: 0,
    winByKO: 9, winByTKO: 2, winBySub: 0, winByDec: 2,
    fightingStyle: 'Striker', fightingApproach: 'counter',
    currentStreak: 3, last5Record: '4-1', finishRateLast5: 0.8, careerFinishRate: 0.85,
    daysSinceLastFight: 130, timesKOd: 1, timesSubmitted: 0,
    fiveRoundFights: 4, winsInLateRounds: 2, titleFights: 6, titleWins: 4,
    currentRank: 1, isChampion: false, naturalWeightClass: 'Light Heavyweight', hasMovedUp: true,
    stats: { slpm: 4.95, strAcc: 60, sapm: 3.85, strDef: 58, tdAvg: 0.10, tdAcc: 20, tdDef: 70, subAvg: 0.0 },
  },
  {
    ufcStatsId: 'freedom250-gane',
    name: 'Ciryl Gane',
    nickname: 'Bon Gamin',
    imageUrl: null,
    nationality: 'France',
    weightClass: 'Heavyweight',
    hometown: 'Paris, France',
    trainingCamp: 'MMA Factory',
    stance: 'orthodox',
    height: 193, reach: 195,
    dateOfBirth: new Date('1990-04-12'),
    wins: 13, losses: 2, draws: 0,
    winByKO: 4, winByTKO: 4, winBySub: 3, winByDec: 2,
    fightingStyle: 'Striker', fightingApproach: 'volume',
    currentStreak: 2, last5Record: '3-2', finishRateLast5: 0.4, careerFinishRate: 0.69,
    daysSinceLastFight: 180, timesKOd: 0, timesSubmitted: 0,
    fiveRoundFights: 4, winsInLateRounds: 1, titleFights: 3, titleWins: 0,
    currentRank: 2, isChampion: false, naturalWeightClass: 'Heavyweight',
    stats: { slpm: 4.65, strAcc: 55, sapm: 2.90, strDef: 64, tdAvg: 0.40, tdAcc: 40, tdDef: 60, subAvg: 0.3 },
  },
  // ── Bantamweight ────────────────────────────────────────────────────────
  {
    ufcStatsId: 'freedom250-omalley',
    name: "Sean O'Malley",
    nickname: 'Suga',
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Bantamweight',
    hometown: 'Helena, Montana, USA',
    trainingCamp: 'MMA Lab',
    stance: 'switch',
    height: 180, reach: 183,
    dateOfBirth: new Date('1994-10-24'),
    wins: 18, losses: 2, draws: 0,
    winByKO: 8, winByTKO: 4, winBySub: 1, winByDec: 5,
    fightingStyle: 'Striker', fightingApproach: 'counter',
    currentStreak: 1, last5Record: '3-2', finishRateLast5: 0.4, careerFinishRate: 0.72,
    daysSinceLastFight: 240, timesKOd: 1, timesSubmitted: 0,
    fiveRoundFights: 3, winsInLateRounds: 1, titleFights: 3, titleWins: 1,
    currentRank: 3, isChampion: false, naturalWeightClass: 'Bantamweight',
    stats: { slpm: 5.95, strAcc: 60, sapm: 3.10, strDef: 64, tdAvg: 0.20, tdAcc: 25, tdDef: 72, subAvg: 0.2 },
  },
  {
    ufcStatsId: 'freedom250-zahabi',
    name: 'Aiemann Zahabi',
    nickname: null,
    imageUrl: null,
    nationality: 'Canada',
    weightClass: 'Bantamweight',
    hometown: 'Montreal, Quebec, Canada',
    trainingCamp: 'Tristar Gym',
    stance: 'orthodox',
    height: 170, reach: 173,
    dateOfBirth: new Date('1987-09-24'),
    wins: 13, losses: 2, draws: 0,
    winByKO: 3, winByTKO: 2, winBySub: 2, winByDec: 6,
    fightingStyle: 'MMA', fightingApproach: 'counter',
    currentStreak: 5, last5Record: '5-0', finishRateLast5: 0.4, careerFinishRate: 0.54,
    daysSinceLastFight: 160, timesKOd: 1, timesSubmitted: 0,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: 6, isChampion: false, naturalWeightClass: 'Bantamweight',
    stats: { slpm: 3.85, strAcc: 49, sapm: 2.75, strDef: 62, tdAvg: 1.10, tdAcc: 40, tdDef: 68, subAvg: 0.5 },
  },
  // ── Heavyweight ─────────────────────────────────────────────────────────
  {
    ufcStatsId: 'freedom250-hokit',
    name: 'Josh Hokit',
    nickname: null,
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Heavyweight',
    hometown: 'Clovis, California, USA',
    trainingCamp: 'Independent',
    stance: 'orthodox',
    height: 188, reach: 191,
    dateOfBirth: new Date('1996-11-18'),
    wins: 7, losses: 1, draws: 0,
    winByKO: 3, winByTKO: 3, winBySub: 0, winByDec: 1,
    fightingStyle: 'Grappler', fightingApproach: 'pressure',
    currentStreak: 3, last5Record: '4-1', finishRateLast5: 0.8, careerFinishRate: 0.86,
    daysSinceLastFight: 110, timesKOd: 0, timesSubmitted: 0,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: 5, isChampion: false, naturalWeightClass: 'Heavyweight',
    stats: { slpm: 4.20, strAcc: 50, sapm: 3.90, strDef: 50, tdAvg: 3.50, tdAcc: 48, tdDef: 60, subAvg: 0.4 },
  },
  {
    ufcStatsId: 'freedom250-lewis',
    name: 'Derrick Lewis',
    nickname: 'The Black Beast',
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Heavyweight',
    hometown: 'Houston, Texas, USA',
    trainingCamp: '4oz Fight Club',
    stance: 'orthodox',
    height: 188, reach: 200,
    dateOfBirth: new Date('1985-02-07'),
    wins: 28, losses: 12, draws: 0,
    winByKO: 16, winByTKO: 7, winBySub: 1, winByDec: 4,
    fightingStyle: 'Striker', fightingApproach: 'counter',
    currentStreak: 2, last5Record: '3-2', finishRateLast5: 0.6, careerFinishRate: 0.86,
    daysSinceLastFight: 150, timesKOd: 4, timesSubmitted: 3,
    fiveRoundFights: 2, winsInLateRounds: 1, titleFights: 1, titleWins: 0,
    currentRank: 9, isChampion: false, naturalWeightClass: 'Heavyweight',
    stats: { slpm: 2.55, strAcc: 46, sapm: 3.15, strDef: 50, tdAvg: 0.30, tdAcc: 30, tdDef: 50, subAvg: 0.2 },
  },
  // ── Lightweight ─────────────────────────────────────────────────────────
  {
    ufcStatsId: 'freedom250-ruffy',
    name: 'Mauricio Ruffy',
    nickname: 'One Shot',
    imageUrl: null,
    nationality: 'Brazil',
    weightClass: 'Lightweight',
    hometown: 'Nova Friburgo, Brazil',
    trainingCamp: 'Nova Uniao',
    stance: 'orthodox',
    height: 180, reach: 190,
    dateOfBirth: new Date('1996-06-15'),
    wins: 13, losses: 2, draws: 0,
    winByKO: 9, winByTKO: 1, winBySub: 1, winByDec: 2,
    fightingStyle: 'Striker', fightingApproach: 'pressure',
    currentStreak: 1, last5Record: '4-1', finishRateLast5: 0.6, careerFinishRate: 0.84,
    daysSinceLastFight: 120, timesKOd: 0, timesSubmitted: 2,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: 9, isChampion: false, naturalWeightClass: 'Lightweight',
    stats: { slpm: 3.84, strAcc: 57, sapm: 4.16, strDef: 60, tdAvg: 0.20, tdAcc: 15, tdDef: 84, subAvg: 0.6 },
  },
  {
    ufcStatsId: 'freedom250-chandler',
    name: 'Michael Chandler',
    nickname: 'Iron',
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Lightweight',
    hometown: 'High Ridge, Missouri, USA',
    trainingCamp: 'Sanford MMA / Kill Cliff FC',
    stance: 'orthodox',
    height: 178, reach: 173,
    dateOfBirth: new Date('1986-04-24'),
    wins: 23, losses: 9, draws: 0,
    winByKO: 7, winByTKO: 4, winBySub: 7, winByDec: 5,
    fightingStyle: 'MMA', fightingApproach: 'pressure',
    currentStreak: -1, last5Record: '1-4', finishRateLast5: 0.4, careerFinishRate: 0.78,
    daysSinceLastFight: 220, timesKOd: 3, timesSubmitted: 1,
    fiveRoundFights: 4, winsInLateRounds: 1, titleFights: 2, titleWins: 0,
    currentRank: 13, isChampion: false, naturalWeightClass: 'Lightweight',
    stats: { slpm: 4.05, strAcc: 43, sapm: 4.95, strDef: 52, tdAvg: 3.10, tdAcc: 42, tdDef: 58, subAvg: 0.9 },
  },
  // ── Middleweight ────────────────────────────────────────────────────────
  {
    ufcStatsId: 'freedom250-nickal',
    name: 'Bo Nickal',
    nickname: null,
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Middleweight',
    hometown: 'State College, Pennsylvania, USA',
    trainingCamp: 'American Top Team',
    stance: 'orthodox',
    height: 188, reach: 193,
    dateOfBirth: new Date('1996-01-26'),
    wins: 7, losses: 1, draws: 0,
    winByKO: 2, winByTKO: 2, winBySub: 3, winByDec: 0,
    fightingStyle: 'Grappler', fightingApproach: 'pressure',
    currentStreak: -1, last5Record: '4-1', finishRateLast5: 0.8, careerFinishRate: 1.0,
    daysSinceLastFight: 200, timesKOd: 0, timesSubmitted: 0,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: null, isChampion: false, naturalWeightClass: 'Middleweight',
    stats: { slpm: 3.10, strAcc: 52, sapm: 2.20, strDef: 55, tdAvg: 4.20, tdAcc: 55, tdDef: 70, subAvg: 1.6 },
  },
  {
    ufcStatsId: 'freedom250-daukaus',
    name: 'Kyle Daukaus',
    nickname: null,
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Middleweight',
    hometown: 'Philadelphia, Pennsylvania, USA',
    trainingCamp: 'Martinez BJJ',
    stance: 'orthodox',
    height: 188, reach: 193,
    dateOfBirth: new Date('1993-06-04'),
    wins: 13, losses: 5, draws: 1,
    winByKO: 1, winByTKO: 3, winBySub: 7, winByDec: 2,
    fightingStyle: 'Grappler', fightingApproach: 'pressure',
    currentStreak: 1, last5Record: '2-3', finishRateLast5: 0.4, careerFinishRate: 0.85,
    daysSinceLastFight: 170, timesKOd: 2, timesSubmitted: 0,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: null, isChampion: false, naturalWeightClass: 'Middleweight',
    stats: { slpm: 3.45, strAcc: 47, sapm: 3.60, strDef: 53, tdAvg: 2.80, tdAcc: 40, tdDef: 55, subAvg: 1.4 },
  },
  // ── Featherweight ───────────────────────────────────────────────────────
  {
    ufcStatsId: 'freedom250-lopes',
    name: 'Diego Lopes',
    nickname: null,
    imageUrl: null,
    nationality: 'Brazil',
    weightClass: 'Featherweight',
    hometown: 'Manaus, Amazonas, Brazil',
    trainingCamp: 'Fight Ready MMA',
    stance: 'orthodox',
    height: 180, reach: 184,
    dateOfBirth: new Date('1994-12-30'),
    wins: 27, losses: 7, draws: 0,
    winByKO: 6, winByTKO: 5, winBySub: 12, winByDec: 4,
    fightingStyle: 'MMA', fightingApproach: 'pressure',
    currentStreak: -1, last5Record: '4-1', finishRateLast5: 0.6, careerFinishRate: 0.85,
    daysSinceLastFight: 130, timesKOd: 2, timesSubmitted: 2,
    fiveRoundFights: 1, winsInLateRounds: 0, titleFights: 1, titleWins: 0,
    currentRank: 2, isChampion: false, naturalWeightClass: 'Featherweight',
    stats: { slpm: 5.12, strAcc: 48, sapm: 3.89, strDef: 55, tdAvg: 2.10, tdAcc: 42, tdDef: 68, subAvg: 1.8 },
  },
  {
    ufcStatsId: 'freedom250-garcia',
    name: 'Steve Garcia',
    nickname: 'Mean Machine',
    imageUrl: null,
    nationality: 'USA',
    weightClass: 'Featherweight',
    hometown: 'Albuquerque, New Mexico, USA',
    trainingCamp: 'Jackson Wink MMA',
    stance: 'orthodox',
    height: 178, reach: 183,
    dateOfBirth: new Date('1992-03-12'),
    wins: 18, losses: 5, draws: 0,
    winByKO: 8, winByTKO: 5, winBySub: 3, winByDec: 2,
    fightingStyle: 'Striker', fightingApproach: 'pressure',
    currentStreak: 6, last5Record: '5-0', finishRateLast5: 0.8, careerFinishRate: 0.89,
    daysSinceLastFight: 140, timesKOd: 1, timesSubmitted: 1,
    fiveRoundFights: 0, winsInLateRounds: 0, titleFights: 0, titleWins: 0,
    currentRank: 9, isChampion: false, naturalWeightClass: 'Featherweight',
    stats: { slpm: 5.40, strAcc: 52, sapm: 3.20, strDef: 58, tdAvg: 0.60, tdAcc: 35, tdDef: 70, subAvg: 0.7 },
  },
];

async function seed() {
  console.log('🥊 Starting UFC Freedom 250 Seed...\n');

  // Remove any existing Freedom 250 event (cascades to fights/predictions)
  const existing = await prisma.event.findFirst({
    where: { OR: [{ id: EVENT_ID }, { ufcStatsId: EVENT_ID }] },
  });
  if (existing) {
    console.log('⚠️  Freedom 250 already exists. Deleting and re-creating...');
    await prisma.fight.deleteMany({ where: { eventId: existing.id } });
    await prisma.event.delete({ where: { id: existing.id } });
  }

  // Upsert fighters by name (avoids duplicates with prior seeds)
  console.log('Creating/updating fighters...');
  for (const fighterData of fighters) {
    const { stats, ufcStatsId, ...fighter } = fighterData;

    const existingFighter = await prisma.fighter.findFirst({
      where: { name: fighter.name },
      include: { stats: true },
    });

    if (existingFighter) {
      await prisma.fighter.update({
        where: { id: existingFighter.id },
        data: { ...fighter, ufcStatsId: existingFighter.ufcStatsId },
      });
      if (existingFighter.stats) {
        await prisma.fighterStats.update({ where: { id: existingFighter.stats.id }, data: stats });
      } else {
        await prisma.fighterStats.create({ data: { fighterId: existingFighter.id, ...stats } });
      }
      console.log(`  ↻ Updated: ${fighter.name}`);
    } else {
      await prisma.fighter.create({
        data: {
          ufcStatsId,
          ...fighter,
          stats: { create: stats },
          stancePerformance: {
            create: [
              { opponentStance: 'orthodox', wins: Math.floor(fighter.wins * 0.7), losses: Math.floor(fighter.losses * 0.6) },
              { opponentStance: 'southpaw', wins: Math.floor(fighter.wins * 0.25), losses: Math.floor(fighter.losses * 0.3) },
              { opponentStance: 'switch', wins: Math.floor(fighter.wins * 0.05), losses: Math.floor(fighter.losses * 0.1) },
            ],
          },
          stylePerformance: {
            create: [
              { opponentStyle: 'MMA', wins: Math.floor(fighter.wins * 0.5), losses: Math.floor(fighter.losses * 0.4) },
              { opponentStyle: 'Striker', wins: Math.floor(fighter.wins * 0.3), losses: Math.floor(fighter.losses * 0.4) },
              { opponentStyle: 'Grappler', wins: Math.floor(fighter.wins * 0.2), losses: Math.floor(fighter.losses * 0.2) },
            ],
          },
        },
      });
      console.log(`  ✓ Created: ${fighter.name}`);
    }
  }
  console.log('✓ Fighters ready.\n');

  const allFighters = await prisma.fighter.findMany();
  const getFighter = (name: string) => {
    const f = allFighters.find((f: typeof allFighters[0]) => f.name === name);
    if (!f) throw new Error(`Fighter not found: ${name}`);
    return f;
  };

  // Create event with an explicit id so /events/ufc-freedom-250 resolves
  console.log('Creating UFC Freedom 250 event...');
  const event = await prisma.event.create({
    data: {
      id: EVENT_ID,
      ufcStatsId: EVENT_ID,
      name: 'UFC Freedom 250: Topuria vs Gaethje',
      shortName: 'UFC Freedom 250',
      date: new Date('2026-06-15T00:00:00Z'), // 8pm EDT Jun 14 = Jun 15 00:00 UTC
      venue: 'The White House',
      city: 'Washington',
      state: 'D.C.',
      country: 'USA',
      altitude: 7,
      timezone: 'America/New_York',
      cageSize: 'standard',
      isCompleted: false,
      isPPV: true,
    },
  });
  console.log(`✓ Event created: ${event.name}\n`);

  // Main card — fightOrder higher = later (main event last)
  console.log('Creating fights...');
  const fightsData = [
    { a: 'Ilia Topuria', b: 'Justin Gaethje', weightClass: 'Lightweight', isTitleFight: true, isMainEvent: true, rounds: 5, order: 7, oddsA: null, oddsB: null },
    { a: 'Alex Pereira', b: 'Ciryl Gane', weightClass: 'Heavyweight', isTitleFight: true, isInterimTitle: true, isCoMain: true, rounds: 5, order: 6, oddsA: -115, oddsB: -105 },
    { a: "Sean O'Malley", b: 'Aiemann Zahabi', weightClass: 'Bantamweight', rounds: 3, order: 5, oddsA: -360, oddsB: 280 },
    { a: 'Josh Hokit', b: 'Derrick Lewis', weightClass: 'Heavyweight', rounds: 3, order: 4, oddsA: -330, oddsB: 265 },
    { a: 'Mauricio Ruffy', b: 'Michael Chandler', weightClass: 'Lightweight', rounds: 3, order: 3, oddsA: -700, oddsB: 500 },
    { a: 'Bo Nickal', b: 'Kyle Daukaus', weightClass: 'Middleweight', rounds: 3, order: 2, oddsA: -300, oddsB: 240 },
    { a: 'Diego Lopes', b: 'Steve Garcia', weightClass: 'Featherweight', rounds: 3, order: 1, oddsA: -185, oddsB: 155 },
  ];

  for (const f of fightsData) {
    const fighterA = getFighter(f.a);
    const fighterB = getFighter(f.b);
    await prisma.fight.create({
      data: {
        eventId: event.id,
        fighterAId: fighterA.id,
        fighterBId: fighterB.id,
        weightClass: f.weightClass,
        isTitleFight: f.isTitleFight ?? false,
        isInterimTitle: f.isInterimTitle ?? false,
        isMainEvent: f.isMainEvent ?? false,
        isCoMain: f.isCoMain ?? false,
        scheduledRounds: f.rounds,
        fightOrder: f.order,
        cardSection: 'main',
        fighterAOdds: f.oddsA,
        fighterBOdds: f.oddsB,
      },
    });
    console.log(`  ✓ ${f.a} vs ${f.b} (${f.weightClass})`);
  }
  console.log('✓ Fights created.\n');

  console.log('🎉 UFC Freedom 250 seed completed successfully!');
  console.log('\n📅 Event: UFC Freedom 250: Topuria vs Gaethje');
  console.log('📍 Venue: The White House, Washington, D.C.');
  console.log('📆 Date: June 14, 2026');
  console.log('\n👉 Next: npx tsx scripts/generate-predictions.ts');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
