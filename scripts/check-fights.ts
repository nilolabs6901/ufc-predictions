import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const event = await prisma.event.findFirst({
    where: { name: { contains: 'UFC 324' } },
    include: {
      fights: {
        include: { fighterA: true, fighterB: true, predictions: true },
        orderBy: { fightOrder: 'desc' }
      }
    }
  });

  console.log('UFC 324 Fights:\n');
  for (const f of event?.fights || []) {
    const pred = f.predictions[0];
    const oddsA = f.fighterAOdds !== null ? (f.fighterAOdds > 0 ? `+${f.fighterAOdds}` : `${f.fighterAOdds}`) : '';
    const oddsB = f.fighterBOdds !== null ? (f.fighterBOdds > 0 ? `+${f.fighterBOdds}` : `${f.fighterBOdds}`) : '';

    console.log(`${f.fightOrder}. ${f.fighterA.name} (${oddsA}) vs ${f.fighterB.name} (${oddsB})`);
    console.log(`   ${f.fighterA.name}: ${f.fighterA.wins}-${f.fighterA.losses}`);
    console.log(`   ${f.fighterB.name}: ${f.fighterB.wins}-${f.fighterB.losses}`);
    if (pred) {
      console.log(`   Prediction: ${Math.round(pred.fighterAWinProb*100)}% vs ${Math.round(pred.fighterBWinProb*100)}%`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
