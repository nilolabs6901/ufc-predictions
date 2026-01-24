import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
  const fight = await prisma.fight.findFirst({
    where: {
      fighterA: { name: { contains: 'Allen' } },
      fighterB: { name: { contains: 'Jean' } }
    },
    include: {
      fighterA: true,
      fighterB: true,
    }
  });

  if (!fight) return;

  console.log('=== Allen History ===');
  console.log('currentStreak:', fight.fighterA.currentStreak);
  console.log('last5Record:', fight.fighterA.last5Record);
  console.log('daysSinceLastFight:', fight.fighterA.daysSinceLastFight);
  console.log('finishRateLast5:', fight.fighterA.finishRateLast5);
  console.log('careerFinishRate:', fight.fighterA.careerFinishRate);

  console.log('\n=== Silva History ===');
  console.log('currentStreak:', fight.fighterB.currentStreak);
  console.log('last5Record:', fight.fighterB.last5Record);
  console.log('daysSinceLastFight:', fight.fighterB.daysSinceLastFight);
  console.log('finishRateLast5:', fight.fighterB.finishRateLast5);
  console.log('careerFinishRate:', fight.fighterB.careerFinishRate);

  await prisma.$disconnect();
}

debug().catch(console.error);
