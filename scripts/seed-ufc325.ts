/**
 * UFC 325: Volkanovski vs Lopes 2 - Seed Script
 * January 31, 2026 - Qudos Bank Arena, Sydney, Australia
 *
 * Run with: npx tsx scripts/seed-ufc325.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getESPNImage = (espnId: string) =>
  `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${espnId}.png&w=350&h=254`;

const fighters = [
  // MAIN EVENT
  {
    espnId: '3949584',
    name: 'Alexander Volkanovski',
    nickname: 'The Great',
    imageUrl: getESPNImage('3949584'),
    nationality: 'Australia',
    weightClass: 'Featherweight',
    hometown: 'Wollongong, New South Wales, Australia',
    trainingCamp: 'City Kickboxing',
    stance: 'orthodox',
    height: 168, // 5'6"
    reach: 182, // 71.5"
    dateOfBirth: new Date('1988-09-29'),
    wins: 27,
    losses: 4,
    draws: 0,
    winByKO: 13,
    winByTKO: 0,
    winBySub: 3,
    winByDec: 11,
    fightingStyle: 'Striker',
    fightingApproach: 'volume',
    currentStreak: 2,
    last5Record: '3-2',
    finishRateLast5: 0.2,
    careerFinishRate: 0.59,
    daysSinceLastFight: 294, // UFC 314 was April 12, 2025
    timesKOd: 3,
    timesSubmitted: 0,
    fiveRoundFights: 10,
    winsInLateRounds: 5,
    titleFights: 8,
    titleWins: 4,
    currentRank: null,
    isChampion: true,
    naturalWeightClass: 'Featherweight',
    stats: {
      slpm: 6.15,
      strAcc: 56,
      sapm: 4.17,
      strDef: 58,
      tdAvg: 1.56,
      tdAcc: 37,
      tdDef: 73,
      subAvg: 0.2,
    },
  },
  {
    espnId: '4881999',
    name: 'Diego Lopes',
    nickname: null,
    imageUrl: getESPNImage('4881999'),
    nationality: 'Brazil',
    weightClass: 'Featherweight',
    hometown: 'Manaus, Amazonas, Brazil',
    trainingCamp: 'Fight Ready MMA',
    stance: 'orthodox',
    height: 180, // 5'11"
    reach: 184, // 72.5"
    dateOfBirth: new Date('1994-12-30'),
    wins: 27,
    losses: 7,
    draws: 0,
    winByKO: 6,
    winByTKO: 5,
    winBySub: 12,
    winByDec: 4,
    fightingStyle: 'MMA',
    fightingApproach: 'pressure',
    currentStreak: 1,
    last5Record: '4-1',
    finishRateLast5: 0.6,
    careerFinishRate: 0.85,
    daysSinceLastFight: 120,
    timesKOd: 2,
    timesSubmitted: 2,
    fiveRoundFights: 1,
    winsInLateRounds: 0,
    titleFights: 1,
    titleWins: 0,
    currentRank: 2,
    isChampion: false,
    naturalWeightClass: 'Featherweight',
    stats: {
      slpm: 5.12,
      strAcc: 48,
      sapm: 3.89,
      strDef: 55,
      tdAvg: 2.10,
      tdAcc: 42,
      tdDef: 68,
      subAvg: 1.8,
    },
  },
  // CO-MAIN EVENT
  {
    espnId: '3109135',
    name: 'Dan Hooker',
    nickname: 'The Hangman',
    imageUrl: getESPNImage('3109135'),
    nationality: 'New Zealand',
    weightClass: 'Lightweight',
    hometown: 'Auckland, New Zealand',
    trainingCamp: 'City Kickboxing',
    stance: 'orthodox',
    height: 183, // 6'0"
    reach: 192, // 75.5"
    dateOfBirth: new Date('1990-02-13'),
    wins: 24,
    losses: 13,
    draws: 0,
    winByKO: 8,
    winByTKO: 3,
    winBySub: 7,
    winByDec: 6,
    fightingStyle: 'Striker',
    fightingApproach: 'counter',
    currentStreak: -1,
    last5Record: '3-2',
    finishRateLast5: 0.2,
    careerFinishRate: 0.75,
    daysSinceLastFight: 70, // Nov 22, 2025
    timesKOd: 3,
    timesSubmitted: 4,
    fiveRoundFights: 3,
    winsInLateRounds: 1,
    titleFights: 0,
    titleWins: 0,
    currentRank: 6,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 3.95,
      strAcc: 43,
      sapm: 4.21,
      strDef: 52,
      tdAvg: 0.65,
      tdAcc: 38,
      tdDef: 68,
      subAvg: 0.7,
    },
  },
  {
    espnId: '4895362',
    name: 'Benoit Saint Denis',
    nickname: 'God of War',
    imageUrl: getESPNImage('4895362'),
    nationality: 'France',
    weightClass: 'Lightweight',
    hometown: 'Paris, France',
    trainingCamp: 'MMA Factory',
    stance: 'orthodox',
    height: 183, // 6'0"
    reach: 188, // 74"
    dateOfBirth: new Date('1995-12-18'),
    wins: 16,
    losses: 3,
    draws: 0,
    winByKO: 5,
    winByTKO: 0,
    winBySub: 11,
    winByDec: 0,
    fightingStyle: 'Grappler',
    fightingApproach: 'pressure',
    currentStreak: 3,
    last5Record: '4-1',
    finishRateLast5: 0.8,
    careerFinishRate: 1.0,
    daysSinceLastFight: 77, // Nov 15, 2025
    timesKOd: 2,
    timesSubmitted: 0,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: 8,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 4.89,
      strAcc: 49,
      sapm: 5.12,
      strDef: 42,
      tdAvg: 3.45,
      tdAcc: 52,
      tdDef: 55,
      subAvg: 2.1,
    },
  },
  // MAIN CARD
  {
    espnId: '4330416',
    name: 'Rafael Fiziev',
    nickname: 'Ataman',
    imageUrl: getESPNImage('4330416'),
    nationality: 'Azerbaijan',
    weightClass: 'Lightweight',
    hometown: 'Phuket, Thailand',
    trainingCamp: 'Tiger Muay Thai',
    stance: 'switch',
    height: 173, // 5'8"
    reach: 180, // 71"
    dateOfBirth: new Date('1993-01-01'),
    wins: 13,
    losses: 4,
    draws: 0,
    winByKO: 8,
    winByTKO: 2,
    winBySub: 1,
    winByDec: 2,
    fightingStyle: 'Striker',
    fightingApproach: 'volume',
    currentStreak: 1,
    last5Record: '3-2',
    finishRateLast5: 0.4,
    careerFinishRate: 0.85,
    daysSinceLastFight: 150,
    timesKOd: 2,
    timesSubmitted: 1,
    fiveRoundFights: 1,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: 9,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 4.77,
      strAcc: 52,
      sapm: 4.77,
      strDef: 50,
      tdAvg: 0.89,
      tdAcc: 72,
      tdDef: 90,
      subAvg: 0.9,
    },
  },
  {
    espnId: '5078899',
    name: 'Mauricio Ruffy',
    nickname: 'One Shot',
    imageUrl: getESPNImage('5078899'),
    nationality: 'Brazil',
    weightClass: 'Lightweight',
    hometown: 'Nova Friburgo, Brazil',
    trainingCamp: 'Nova Uniao',
    stance: 'orthodox',
    height: 180, // 5'11"
    reach: 190, // 75"
    dateOfBirth: new Date('1996-06-15'),
    wins: 12,
    losses: 2,
    draws: 0,
    winByKO: 8,
    winByTKO: 1,
    winBySub: 1,
    winByDec: 2,
    fightingStyle: 'Striker',
    fightingApproach: 'pressure',
    currentStreak: -1,
    last5Record: '3-2',
    finishRateLast5: 0.6,
    careerFinishRate: 0.83,
    daysSinceLastFight: 147, // Sept 6, 2025
    timesKOd: 0,
    timesSubmitted: 2,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: 15,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 3.84,
      strAcc: 57,
      sapm: 4.16,
      strDef: 60,
      tdAvg: 0.20,
      tdAcc: 15,
      tdDef: 84,
      subAvg: 0.6,
    },
  },
  {
    espnId: '4285662',
    name: 'Tai Tuivasa',
    nickname: 'Bam Bam',
    imageUrl: getESPNImage('4285662'),
    nationality: 'Australia',
    weightClass: 'Heavyweight',
    hometown: 'Sydney, New South Wales, Australia',
    trainingCamp: 'Freestyle Fighting Gym',
    stance: 'southpaw',
    height: 188, // 6'2"
    reach: 190, // 75"
    dateOfBirth: new Date('1993-03-16'),
    wins: 15,
    losses: 8,
    draws: 0,
    winByKO: 12,
    winByTKO: 1,
    winBySub: 0,
    winByDec: 2,
    fightingStyle: 'Striker',
    fightingApproach: 'pressure',
    currentStreak: -4,
    last5Record: '1-4',
    finishRateLast5: 0.2,
    careerFinishRate: 0.87,
    daysSinceLastFight: 120,
    timesKOd: 4,
    timesSubmitted: 2,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Heavyweight',
    stats: {
      slpm: 3.77,
      strAcc: 46,
      sapm: 5.18,
      strDef: 44,
      tdAvg: 0.70,
      tdAcc: 15,
      tdDef: 57,
      subAvg: 0.6,
    },
  },
  {
    espnId: '5201234',
    name: 'Tallison Teixeira',
    nickname: 'Xicao',
    imageUrl: getESPNImage('5201234'),
    nationality: 'Brazil',
    weightClass: 'Heavyweight',
    hometown: 'Sao Paulo, Brazil',
    trainingCamp: 'Chute Boxe',
    stance: 'orthodox',
    height: 201, // 6'7"
    reach: 211, // 83"
    dateOfBirth: new Date('1999-08-20'),
    wins: 8,
    losses: 1,
    draws: 0,
    winByKO: 5,
    winByTKO: 1,
    winBySub: 1,
    winByDec: 1,
    fightingStyle: 'Striker',
    fightingApproach: 'pressure',
    currentStreak: -1,
    last5Record: '4-1',
    finishRateLast5: 0.8,
    careerFinishRate: 0.88,
    daysSinceLastFight: 120,
    timesKOd: 1,
    timesSubmitted: 0,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Heavyweight',
    stats: {
      slpm: 12.83,
      strAcc: 59,
      sapm: 8.98,
      strDef: 56,
      tdAvg: 0.30,
      tdAcc: 15,
      tdDef: 15,
      subAvg: 0.9,
    },
  },
  {
    espnId: '5056789',
    name: 'Quillan Salkilld',
    nickname: null,
    imageUrl: getESPNImage('5056789'),
    nationality: 'Australia',
    weightClass: 'Lightweight',
    hometown: 'Gold Coast, Queensland, Australia',
    trainingCamp: 'Absolute MMA',
    stance: 'orthodox',
    height: 183, // 6'0"
    reach: 190, // 75"
    dateOfBirth: new Date('1999-05-10'),
    wins: 10,
    losses: 1,
    draws: 0,
    winByKO: 3,
    winByTKO: 1,
    winBySub: 3,
    winByDec: 3,
    fightingStyle: 'MMA',
    fightingApproach: 'pressure',
    currentStreak: 5,
    last5Record: '5-0',
    finishRateLast5: 0.6,
    careerFinishRate: 0.7,
    daysSinceLastFight: 90,
    timesKOd: 0,
    timesSubmitted: 1,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 5.49,
      strAcc: 57,
      sapm: 3.50,
      strDef: 43,
      tdAvg: 7.77,
      tdAcc: 34,
      tdDef: 85,
      subAvg: 0.5,
    },
  },
  {
    espnId: '4456789',
    name: 'Jamie Mullarkey',
    nickname: null,
    imageUrl: getESPNImage('4456789'),
    nationality: 'Australia',
    weightClass: 'Lightweight',
    hometown: 'Melbourne, Victoria, Australia',
    trainingCamp: 'Absolute MMA',
    stance: 'orthodox',
    height: 183, // 6'0"
    reach: 188, // 74"
    dateOfBirth: new Date('1994-09-15'),
    wins: 18,
    losses: 8,
    draws: 0,
    winByKO: 8,
    winByTKO: 2,
    winBySub: 3,
    winByDec: 5,
    fightingStyle: 'Striker',
    fightingApproach: 'pressure',
    currentStreak: 1,
    last5Record: '3-2',
    finishRateLast5: 0.4,
    careerFinishRate: 0.72,
    daysSinceLastFight: 120,
    timesKOd: 6,
    timesSubmitted: 0,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Lightweight',
    stats: {
      slpm: 4.20,
      strAcc: 46,
      sapm: 4.34,
      strDef: 54,
      tdAvg: 0.40,
      tdAcc: 29,
      tdDef: 78,
      subAvg: 0.1,
    },
  },
  // PRELIMS
  {
    espnId: '4678901',
    name: 'Junior Tafa',
    nickname: 'The Juggernaut',
    imageUrl: getESPNImage('4678901'),
    nationality: 'Australia',
    weightClass: 'Light Heavyweight',
    hometown: 'Sydney, New South Wales, Australia',
    trainingCamp: 'City Kickboxing',
    stance: 'orthodox',
    height: 190, // 6'3"
    reach: 190, // 75"
    dateOfBirth: new Date('1996-06-01'),
    wins: 6,
    losses: 4,
    draws: 0,
    winByKO: 3,
    winByTKO: 1,
    winBySub: 0,
    winByDec: 2,
    fightingStyle: 'Striker',
    fightingApproach: 'pressure',
    currentStreak: -1,
    last5Record: '2-3',
    finishRateLast5: 0.2,
    careerFinishRate: 0.67,
    daysSinceLastFight: 120,
    timesKOd: 2,
    timesSubmitted: 1,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Light Heavyweight',
    stats: {
      slpm: 3.19,
      strAcc: 51,
      sapm: 2.49,
      strDef: 51,
      tdAvg: 0.60,
      tdAcc: 15,
      tdDef: 69,
      subAvg: 0.3,
    },
  },
  {
    espnId: '5301234',
    name: 'Billy Elekana',
    nickname: 'Son of Susie',
    imageUrl: getESPNImage('5301234'),
    nationality: 'USA',
    weightClass: 'Light Heavyweight',
    hometown: 'Honolulu, Hawaii, USA',
    trainingCamp: 'Xtreme Couture',
    stance: 'southpaw',
    height: 190, // 6'3"
    reach: 196, // 77"
    dateOfBirth: new Date('1995-05-28'),
    wins: 9,
    losses: 2,
    draws: 0,
    winByKO: 3,
    winByTKO: 0,
    winBySub: 2,
    winByDec: 4,
    fightingStyle: 'MMA',
    fightingApproach: 'counter',
    currentStreak: 2,
    last5Record: '4-1',
    finishRateLast5: 0.4,
    careerFinishRate: 0.56,
    daysSinceLastFight: 120,
    timesKOd: 1,
    timesSubmitted: 0,
    fiveRoundFights: 0,
    winsInLateRounds: 0,
    titleFights: 0,
    titleWins: 0,
    currentRank: null,
    isChampion: false,
    naturalWeightClass: 'Light Heavyweight',
    stats: {
      slpm: 2.66,
      strAcc: 60,
      sapm: 3.28,
      strDef: 46,
      tdAvg: 0.55,
      tdAcc: 25,
      tdDef: 15,
      subAvg: 0.6,
    },
  },
];

async function seed() {
  console.log('🥊 Starting UFC 325 Seed...\n');

  // Check if UFC 325 already exists
  const existingEvent = await prisma.event.findFirst({
    where: { shortName: 'UFC 325' },
  });

  if (existingEvent) {
    console.log('⚠️  UFC 325 already exists. Deleting and re-creating...');
    // Delete fights (cascades to predictions and analysis)
    await prisma.fight.deleteMany({ where: { eventId: existingEvent.id } });
    await prisma.event.delete({ where: { id: existingEvent.id } });
  }

  // Create fighters (upsert to avoid duplicates)
  console.log('Creating/updating fighters...');
  for (const fighterData of fighters) {
    const { stats, espnId, ...fighter } = fighterData;

    const existing = await prisma.fighter.findFirst({
      where: { name: fighter.name },
      include: { stats: true },
    });

    if (existing) {
      // Update existing fighter
      await prisma.fighter.update({
        where: { id: existing.id },
        data: {
          ...fighter,
          ufcStatsId: existing.ufcStatsId, // Keep existing ID
        },
      });
      if (existing.stats) {
        await prisma.fighterStats.update({
          where: { id: existing.stats.id },
          data: stats,
        });
      } else {
        await prisma.fighterStats.create({
          data: { fighterId: existing.id, ...stats },
        });
      }
      console.log(`  ↻ Updated: ${fighter.name}`);
    } else {
      // Create new fighter
      await prisma.fighter.create({
        data: {
          ufcStatsId: espnId,
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

  // Get all fighters from DB
  const allFighters = await prisma.fighter.findMany();
  const getFighter = (name: string) => {
    const f = allFighters.find((f: typeof allFighters[0]) => f.name === name);
    if (!f) throw new Error(`Fighter not found: ${name}`);
    return f;
  };

  // Create UFC 325 event
  console.log('Creating UFC 325 event...');
  const event = await prisma.event.create({
    data: {
      ufcStatsId: 'ufc-325',
      name: 'UFC 325: Volkanovski vs Lopes 2',
      shortName: 'UFC 325',
      date: new Date('2026-02-01T06:00:00Z'), // 9pm ET Jan 31 = Feb 1 6am UTC (Sydney is +11)
      venue: 'Qudos Bank Arena',
      city: 'Sydney',
      state: 'New South Wales',
      country: 'Australia',
      altitude: 6, // Sea level
      timezone: 'Australia/Sydney',
      cageSize: 'standard',
      isCompleted: false,
      isPPV: true,
    },
  });
  console.log(`✓ Event created: ${event.name}\n`);

  // Create fights
  console.log('Creating fights...');
  const fightsData = [
    // MAIN CARD
    {
      fighterA: getFighter('Alexander Volkanovski'),
      fighterB: getFighter('Diego Lopes'),
      weightClass: 'Featherweight',
      isTitleFight: true,
      isMainEvent: true,
      scheduledRounds: 5,
      fightOrder: 13,
      cardSection: 'main',
      fighterAOdds: -148,
      fighterBOdds: +124,
    },
    {
      fighterA: getFighter('Dan Hooker'),
      fighterB: getFighter('Benoit Saint Denis'),
      weightClass: 'Lightweight',
      isTitleFight: false,
      isCoMain: true,
      scheduledRounds: 3,
      fightOrder: 12,
      cardSection: 'main',
      fighterAOdds: +250,
      fighterBOdds: -310,
    },
    {
      fighterA: getFighter('Rafael Fiziev'),
      fighterB: getFighter('Mauricio Ruffy'),
      weightClass: 'Lightweight',
      isTitleFight: false,
      scheduledRounds: 3,
      fightOrder: 11,
      cardSection: 'main',
      fighterAOdds: +105,
      fighterBOdds: -125,
    },
    {
      fighterA: getFighter('Tai Tuivasa'),
      fighterB: getFighter('Tallison Teixeira'),
      weightClass: 'Heavyweight',
      isTitleFight: false,
      scheduledRounds: 3,
      fightOrder: 10,
      cardSection: 'main',
      fighterAOdds: +250,
      fighterBOdds: -310,
    },
    {
      fighterA: getFighter('Quillan Salkilld'),
      fighterB: getFighter('Jamie Mullarkey'),
      weightClass: 'Lightweight',
      isTitleFight: false,
      scheduledRounds: 3,
      fightOrder: 9,
      cardSection: 'main',
      fighterAOdds: -950,
      fighterBOdds: +650,
    },
    // PRELIMS
    {
      fighterA: getFighter('Junior Tafa'),
      fighterB: getFighter('Billy Elekana'),
      weightClass: 'Light Heavyweight',
      isTitleFight: false,
      scheduledRounds: 3,
      fightOrder: 8,
      cardSection: 'prelims',
      fighterAOdds: +210,
      fighterBOdds: -250,
    },
  ];

  for (const fightData of fightsData) {
    await prisma.fight.create({
      data: {
        eventId: event.id,
        fighterAId: fightData.fighterA.id,
        fighterBId: fightData.fighterB.id,
        weightClass: fightData.weightClass,
        isTitleFight: fightData.isTitleFight || false,
        isMainEvent: fightData.isMainEvent || false,
        isCoMain: fightData.isCoMain || false,
        scheduledRounds: fightData.scheduledRounds,
        fightOrder: fightData.fightOrder,
        cardSection: fightData.cardSection,
        fighterAOdds: fightData.fighterAOdds,
        fighterBOdds: fightData.fighterBOdds,
      },
    });
    console.log(`  ✓ ${fightData.fighterA.name} vs ${fightData.fighterB.name} (${fightData.weightClass})`);
  }
  console.log('✓ Fights created.\n');

  console.log('🎉 UFC 325 seed completed successfully!');
  console.log('\n📅 Event: UFC 325: Volkanovski vs Lopes 2');
  console.log('📍 Venue: Qudos Bank Arena, Sydney, Australia');
  console.log('📆 Date: January 31, 2026');
  console.log('\n🥊 Main Card:');
  console.log('  • Alexander Volkanovski (c) vs Diego Lopes (Featherweight Title - Main Event)');
  console.log('  • Dan Hooker vs Benoit Saint Denis (Co-Main)');
  console.log('  • Rafael Fiziev vs Mauricio Ruffy');
  console.log('  • Tai Tuivasa vs Tallison Teixeira');
  console.log('  • Quillan Salkilld vs Jamie Mullarkey');
  console.log('\n🟡 Prelims:');
  console.log('  • Junior Tafa vs Billy Elekana');
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
