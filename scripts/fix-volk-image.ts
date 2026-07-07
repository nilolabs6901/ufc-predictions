import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
  const fighter = await prisma.fighter.findFirst({ where: { name: 'Alexander Volkanovski' } });
  if (!fighter) { console.log('Not found'); return; }

  await prisma.fighter.update({
    where: { id: fighter.id },
    data: { imageUrl: 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/VOLKANOVSKI_ALEXANDER_L_BELT_01-31.png?itok=b50S7DL1' },
  });
  console.log('✓ Updated Volkanovski image');
  await prisma.$disconnect();
  await pool.end();
}

fix().catch(console.error);
