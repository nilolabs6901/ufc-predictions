import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUpsets() {
  const fights = await prisma.fight.findMany({
    where: {
      event: { name: { contains: 'UFC 324' } }
    },
    include: {
      fighterA: true,
      fighterB: true,
      predictions: { take: 1, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { fightOrder: 'desc' }
  });

  console.log('UFC 324 Fights - Checking for Upsets:\n');
  console.log('='.repeat(60));

  let upsetCount = 0;

  for (const fight of fights) {
    const pred = fight.predictions[0];
    const isPredA = pred?.predictedWinnerId === fight.fighterAId;
    const isPredB = pred?.predictedWinnerId === fight.fighterBId;

    const isUpsetA = isPredA && fight.fighterAOdds !== null && fight.fighterAOdds > 0;
    const isUpsetB = isPredB && fight.fighterBOdds !== null && fight.fighterBOdds > 0;
    const isUpset = isUpsetA || isUpsetB;

    if (isUpset) upsetCount++;

    const oddsA = fight.fighterAOdds !== null ? (fight.fighterAOdds > 0 ? `+${fight.fighterAOdds}` : `${fight.fighterAOdds}`) : 'N/A';
    const oddsB = fight.fighterBOdds !== null ? (fight.fighterBOdds > 0 ? `+${fight.fighterBOdds}` : `${fight.fighterBOdds}`) : 'N/A';

    console.log(`\n${fight.fighterA.name} (${oddsA}) vs ${fight.fighterB.name} (${oddsB})`);
    console.log(`  Predicted Winner: ${pred ? (isPredA ? fight.fighterA.name : fight.fighterB.name) : 'No prediction'}`);

    if (isUpset) {
      const upsetFighter = isUpsetA ? fight.fighterA.name : fight.fighterB.name;
      const upsetOdds = isUpsetA ? fight.fighterAOdds : fight.fighterBOdds;
      console.log(`  ⚠️  UPSET ALERT: ${upsetFighter} (+${upsetOdds})`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total Upset Alerts: ${upsetCount}`);

  await prisma.$disconnect();
}

checkUpsets().catch(console.error);
