import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const fighterImages: Record<string, string> = {
  'Alexander Volkanovski': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/VOLKANOVSKI_ALEXANDER_BELT_01-31.png?itok=lcfyzhWz',
  'Diego Lopes': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-09/LOPES_DIEGO_L_09-13.png?itok=pU_xVI2t',
  'Dan Hooker': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/HOOKER_DAN_L_01-31.png?itok=NK8k997W',
  'Benoit Saint Denis': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-09/SAINT_DENIS_BENOIT_L_09-06.png?itok=TxG--kmt',
  'Rafael Fiziev': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/FIZIEV_RAFAEL_L_01-31.png?itok=W0UFLX51',
  'Mauricio Ruffy': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2024-11/RUFFY_MAURICIO_L_11-16.png?itok=IH1kvRDg',
  'Tai Tuivasa': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/TUIVASA_TAI_L_01-31.png?itok=PaOiGduf',
  'Tallison Teixeira': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-07/TEIXEIRA_TALLISON_R_07-12.png?itok=EzdRE6xy',
  'Quillan Salkilld': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/SALKILLD_QUILLAN_L_01-31.png?itok=Zc2ZSIVn',
  'Jamie Mullarkey': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-09/MULLARKEY_JAMIE_L_09-27.png?itok=kUd-JZe5',
  'Junior Tafa': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2026-01/TAFA_JUNIOR_L_01-31.png?itok=fk0TR_xa',
  'Billy Elekana': 'https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-10/ELEKANA_BILLY_L_11-01.png?itok=Y69TROfC',
};

async function updateImages() {
  console.log('Updating fighter images...\n');

  for (const [name, imageUrl] of Object.entries(fighterImages)) {
    const fighter = await prisma.fighter.findFirst({ where: { name } });
    if (!fighter) {
      console.log(`  ✗ Fighter not found: ${name}`);
      continue;
    }

    await prisma.fighter.update({
      where: { id: fighter.id },
      data: { imageUrl },
    });
    console.log(`  ✓ ${name}`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
  await pool.end();
}

updateImages().catch(console.error);
