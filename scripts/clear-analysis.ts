import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.matchupAnalysis.deleteMany({});
  console.log('Deleted', result.count, 'cached analyses');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
