import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  // Get fights with predictions
  const fights = await prisma.fight.findMany({
    where: {
      event: { name: { contains: 'UFC 324' } },
      predictions: { some: {} }
    },
    include: {
      fighterA: true,
      fighterB: true,
      predictions: { take: 1, orderBy: { createdAt: 'desc' } }
    }
  });

  console.log('Fights WITH predictions:\n');
  for (const f of fights) {
    const p = f.predictions[0];
    const predA = p.predictedWinnerId === f.fighterAId;
    const predB = p.predictedWinnerId === f.fighterBId;

    // Check for upset
    const isUpsetA = predA && f.fighterAOdds !== null && f.fighterAOdds > 0;
    const isUpsetB = predB && f.fighterBOdds !== null && f.fighterBOdds > 0;

    console.log(`${f.fighterA.name} vs ${f.fighterB.name}`);
    console.log(`  Odds: ${f.fighterAOdds} / ${f.fighterBOdds}`);
    console.log(`  Predicted: ${predA ? f.fighterA.name : f.fighterB.name}`);
    console.log(`  Win probs: ${Math.round(p.fighterAWinProb*100)}% / ${Math.round(p.fighterBWinProb*100)}%`);
    console.log(`  UPSET: ${isUpsetA || isUpsetB ? 'YES' : 'No'}`);
    console.log('');
  }

  await prisma.$disconnect();
  process.exit(0);
}

check().catch(console.error);
