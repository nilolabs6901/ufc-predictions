import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearAnalysis() {
  console.log('Clearing AI Matchup Analysis cache for UFC 324...');

  const deleted = await prisma.matchupAnalysis.deleteMany({
    where: {
      fight: {
        event: { name: { contains: 'UFC 324' } }
      }
    }
  });

  console.log(`Deleted ${deleted.count} cached AI analyses`);
  console.log('New analyses will be generated on next modal open');

  await prisma.$disconnect();
}

clearAnalysis().catch(console.error);
