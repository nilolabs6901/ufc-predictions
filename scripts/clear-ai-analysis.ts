import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const eventName = process.argv[2] || 'UFC 325';

async function clearAnalysis() {
  console.log(`Clearing AI analysis cache for ${eventName}...`);

  // Clear individual model analyses
  const deletedModels = await prisma.modelAnalysis.deleteMany({
    where: {
      fight: {
        event: { name: { contains: eventName } }
      }
    }
  });
  console.log(`Deleted ${deletedModels.count} individual model analyses`);

  // Clear main matchup analyses
  const deleted = await prisma.matchupAnalysis.deleteMany({
    where: {
      fight: {
        event: { name: { contains: eventName } }
      }
    }
  });
  console.log(`Deleted ${deleted.count} cached matchup analyses`);

  console.log('New multi-model analyses will be generated on next fight modal open');

  await prisma.$disconnect();
}

clearAnalysis().catch(console.error);
