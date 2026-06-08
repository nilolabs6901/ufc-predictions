/**
 * Update fighter headshots for UFC Freedom 250 using ESPN's public search API.
 * ESPN returns a deterministic transparent headshot per athlete id.
 *
 * Run: DATABASE_URL=<public-url> npx tsx scripts/update-freedom250-images.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NAMES = [
  'Ilia Topuria', 'Justin Gaethje', 'Alex Pereira', 'Ciryl Gane',
  "Sean O'Malley", 'Aiemann Zahabi', 'Josh Hokit', 'Derrick Lewis',
  'Mauricio Ruffy', 'Michael Chandler', 'Bo Nickal', 'Kyle Daukaus',
  'Diego Lopes', 'Steve Garcia',
];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim();

async function findHeadshot(name: string): Promise<string | null> {
  const res = await fetch(`https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=10`);
  if (!res.ok) return null;
  const j: any = await res.json();
  const items: any[] = (j.results || []).flatMap((r: any) => r.contents || []);
  const wantLast = norm(name).split(' ').pop();
  // Prefer an MMA player whose last name matches and that has a headshot image
  const match = items.find(
    (c) =>
      c.sport === 'mma' &&
      c.type === 'player' &&
      c.image?.default &&
      norm(c.displayName || '').split(' ').pop() === wantLast
  );
  return match?.image?.default || null;
}

async function main() {
  console.log('Fetching ESPN headshots for Freedom 250 fighters...\n');
  let updated = 0;
  let missed = 0;

  for (const name of NAMES) {
    const url = await findHeadshot(name);
    const fighter = await prisma.fighter.findFirst({ where: { name } });
    if (!fighter) {
      console.log(`  ✗ DB fighter not found: ${name}`);
      continue;
    }
    if (!url) {
      console.log(`  ⚠ No ESPN headshot found: ${name} (keeping silhouette)`);
      missed++;
      continue;
    }
    await prisma.fighter.update({ where: { id: fighter.id }, data: { imageUrl: url } });
    console.log(`  ✓ ${name.padEnd(20)} -> ${url}`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${missed} without a headshot.`);
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
