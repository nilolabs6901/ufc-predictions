import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function regeneratePredictions() {
  console.log('Deleting old predictions for UFC 324...');

  // Delete old predictions for UFC 324
  const deleted = await prisma.prediction.deleteMany({
    where: {
      fight: {
        event: { name: { contains: 'UFC 324' } }
      }
    }
  });

  console.log(`Deleted ${deleted.count} old predictions`);
  console.log('New predictions will be generated on next page load');

  await prisma.$disconnect();
  process.exit(0);
}

regeneratePredictions().catch(console.error);
