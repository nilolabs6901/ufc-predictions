import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const events = await prisma.event.findMany({
    select: { name: true, isCompleted: true, date: true },
    orderBy: { date: 'desc' },
  });
  console.log('All events:');
  events.forEach((e: any) => console.log(`  ${e.name} | completed: ${e.isCompleted} | date: ${e.date}`));

  console.log(`\nCurrent time: ${new Date().toISOString()}`);

  const upcoming = await prisma.event.findMany({
    where: { date: { gte: new Date() }, isCompleted: false },
    select: { name: true, date: true },
  });
  console.log('\nUpcoming (filtered):');
  upcoming.forEach((e: any) => console.log(`  ${e.name} | date: ${e.date}`));

  await prisma.$disconnect();
  await pool.end();
}
check();
