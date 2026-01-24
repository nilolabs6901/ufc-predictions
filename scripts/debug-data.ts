import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
  // Check Arnold Allen vs Jean Silva predictions
  console.log('=== Arnold Allen fights ===');
  const allenFights = await prisma.fight.findMany({
    where: {
      OR: [
        { fighterA: { name: { contains: 'Allen' } } },
        { fighterB: { name: { contains: 'Allen' } } }
      ]
    },
    include: {
      fighterA: true,
      fighterB: true,
      predictions: { orderBy: { createdAt: 'desc' } }
    }
  });

  for (const f of allenFights) {
    console.log(`\nFight: ${f.fighterA.name} vs ${f.fighterB.name}`);
    console.log(`Predictions count: ${f.predictions.length}`);
    for (const p of f.predictions) {
      const winner = p.fighterAWinProb > 0.5 ? f.fighterA.name : f.fighterB.name;
      console.log(`  Model ${p.modelVersion}: A=${Math.round(p.fighterAWinProb*100)}% B=${Math.round(p.fighterBWinProb*100)}% -> ${winner}`);
    }
  }

  // Check Umar
  console.log('\n=== Umar Nurmagomedov ===');
  const umars = await prisma.fighter.findMany({
    where: { name: { contains: 'Umar' } }
  });
  for (const u of umars) {
    console.log(`${u.name}: ${u.wins}-${u.losses}-${u.draws}`);
  }

  await prisma.$disconnect();
}

debug().catch(console.error);
