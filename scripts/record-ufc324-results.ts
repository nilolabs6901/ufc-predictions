/**
 * Record UFC 324 Results
 * Updates fight results and prediction accuracy for UFC 324: Gaethje vs Pimblett
 * January 24, 2026 - T-Mobile Arena, Las Vegas
 *
 * Run with: npx tsx scripts/record-ufc324-results.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// UFC 324 Results
const results = [
  {
    fighterAName: 'Justin Gaethje',
    fighterBName: 'Paddy Pimblett',
    winnerName: 'Justin Gaethje',
    method: 'DEC',
    methodDetail: 'Unanimous Decision',
    round: 5,
    time: '5:00',
  },
  {
    fighterAName: "Sean O'Malley",
    fighterBName: 'Song Yadong',
    winnerName: "Sean O'Malley",
    method: 'DEC',
    methodDetail: 'Unanimous Decision',
    round: 3,
    time: '5:00',
  },
  {
    fighterAName: 'Umar Nurmagomedov',
    fighterBName: 'Deiveson Figueiredo',
    winnerName: 'Umar Nurmagomedov',
    method: 'DEC',
    methodDetail: 'Unanimous Decision',
    round: 3,
    time: '5:00',
  },
  {
    fighterAName: 'Rose Namajunas',
    fighterBName: 'Natalia Silva',
    winnerName: 'Natalia Silva',
    method: 'DEC',
    methodDetail: 'Unanimous Decision',
    round: 3,
    time: '5:00',
  },
  {
    fighterAName: 'Derrick Lewis',
    fighterBName: 'Waldo Cortes-Acosta',
    winnerName: 'Waldo Cortes-Acosta',
    method: 'TKO',
    methodDetail: 'Punches',
    round: 2,
    time: '3:14',
  },
  {
    fighterAName: 'Arnold Allen',
    fighterBName: 'Jean Silva',
    winnerName: 'Jean Silva',
    method: 'DEC',
    methodDetail: 'Unanimous Decision',
    round: 3,
    time: '5:00',
  },
];

async function recordResults() {
  console.log('📝 Recording UFC 324 Results...\n');

  // Find the UFC 324 event
  const event = await prisma.event.findFirst({
    where: { shortName: 'UFC 324' },
    include: {
      fights: {
        include: {
          fighterA: true,
          fighterB: true,
          predictions: true,
        },
      },
    },
  });

  if (!event) {
    console.error('❌ UFC 324 event not found in database!');
    return;
  }

  console.log(`Found event: ${event.name} (${event.fights.length} fights)\n`);

  let correctPredictions = 0;
  let totalPredictions = 0;

  for (const result of results) {
    // Find the matching fight
    const fight = event.fights.find(
      (f) =>
        (f.fighterA.name === result.fighterAName && f.fighterB.name === result.fighterBName) ||
        (f.fighterA.name === result.fighterBName && f.fighterB.name === result.fighterAName)
    );

    if (!fight) {
      console.log(`⚠️  Fight not found: ${result.fighterAName} vs ${result.fighterBName}`);
      continue;
    }

    // Determine winner ID
    const winnerId =
      fight.fighterA.name === result.winnerName
        ? fight.fighterAId
        : fight.fighterB.name === result.winnerName
        ? fight.fighterBId
        : null;

    if (!winnerId) {
      console.log(`⚠️  Winner not found: ${result.winnerName}`);
      continue;
    }

    // Check prediction accuracy
    const prediction = fight.predictions[0];
    let predictionCorrect: boolean | null = null;

    if (prediction) {
      predictionCorrect = prediction.predictedWinnerId === winnerId;
      totalPredictions++;
      if (predictionCorrect) correctPredictions++;

      // Update prediction wasCorrect
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { wasCorrect: predictionCorrect },
      });
    }

    // Update fight with result
    await prisma.fight.update({
      where: { id: fight.id },
      data: {
        winnerId,
        method: result.method,
        methodDetail: result.methodDetail,
        round: result.round,
        time: result.time,
        isCompleted: true,
        predictionCorrect,
      },
    });

    const predStatus = prediction
      ? predictionCorrect
        ? '✅'
        : '❌'
      : '⚪';

    console.log(
      `${predStatus} ${result.fighterAName} vs ${result.fighterBName} → ${result.winnerName} (${result.method} R${result.round} ${result.time})`
    );
  }

  // Mark event as completed
  await prisma.event.update({
    where: { id: event.id },
    data: { isCompleted: true },
  });

  console.log(`\n📊 Prediction Accuracy: ${correctPredictions}/${totalPredictions} (${totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0}%)`);
  console.log('✅ UFC 324 results recorded successfully!');
}

recordResults()
  .catch((e) => {
    console.error('Failed to record results:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
