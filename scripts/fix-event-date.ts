// Fix UFC 324 event date to the correct time
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // UFC 324 - Setting to today (January 25, 2026) main card at 10pm ET
  // 10pm ET on Jan 25, 2026 = Jan 26, 2026 03:00 UTC
  const event = await prisma.event.updateMany({
    where: {
      shortName: 'UFC 324',
    },
    data: {
      // Main card starts at 10pm ET tonight = 3am UTC tomorrow
      date: new Date('2026-01-26T03:00:00Z'),
    },
  });

  console.log(`Updated ${event.count} event(s)`);

  // Verify
  const updated = await prisma.event.findFirst({
    where: { shortName: 'UFC 324' },
  });

  if (updated) {
    console.log(`UFC 324 date is now: ${updated.date}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
