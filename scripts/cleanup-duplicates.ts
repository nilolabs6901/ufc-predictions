import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  console.log('Cleaning up duplicate data...\n');

  // Find duplicate events (UFC 324 appears twice)
  const events = await prisma.event.findMany({
    where: { name: { contains: 'UFC 324' } },
    include: { fights: { include: { fighterA: true, fighterB: true } } }
  });

  console.log(`Found ${events.length} UFC 324 events:`);
  for (const e of events) {
    console.log(`  - ${e.id}: "${e.name}" with ${e.fights.length} fights`);
  }

  // Keep the event with more complete data (has fighterA.imageUrl)
  // Delete the other one
  const eventToKeep = events.find(e =>
    e.fights.some(f => f.fighterA.imageUrl !== null)
  );

  const eventsToDelete = events.filter(e => e.id !== eventToKeep?.id);

  if (eventsToDelete.length > 0) {
    console.log(`\nDeleting ${eventsToDelete.length} duplicate event(s)...`);

    for (const e of eventsToDelete) {
      // Delete predictions first
      await prisma.prediction.deleteMany({
        where: { fight: { eventId: e.id } }
      });

      // Delete fights
      await prisma.fight.deleteMany({
        where: { eventId: e.id }
      });

      // Delete event
      await prisma.event.delete({
        where: { id: e.id }
      });

      console.log(`  Deleted event: ${e.name} (${e.id})`);
    }
  }

  // Fix duplicate fighters
  console.log('\n=== Checking duplicate fighters ===');

  // Umar Nurmagomedov - keep 18-0 (correct record as of Jan 2026)
  const umars = await prisma.fighter.findMany({
    where: { name: { contains: 'Umar Nurmagomedov' } }
  });

  console.log(`Found ${umars.length} Umar records`);

  // Keep the one with correct record (18-0)
  const correctUmar = umars.find(u => u.wins === 18 && u.losses === 0);
  const wrongUmars = umars.filter(u => u.id !== correctUmar?.id);

  for (const u of wrongUmars) {
    console.log(`  Deleting wrong Umar: ${u.wins}-${u.losses}`);

    // Update any fights referencing this fighter to point to correct one
    if (correctUmar) {
      await prisma.fight.updateMany({
        where: { fighterAId: u.id },
        data: { fighterAId: correctUmar.id }
      });
      await prisma.fight.updateMany({
        where: { fighterBId: u.id },
        data: { fighterBId: correctUmar.id }
      });
    }

    // Delete fighter stats
    await prisma.fighterStats.deleteMany({
      where: { fighterId: u.id }
    });

    // Delete fighter
    await prisma.fighter.delete({
      where: { id: u.id }
    });
  }

  // Similarly check other fighters that might be duplicated
  const fighterNames = ['Justin Gaethje', 'Paddy Pimblett', 'Sean O\'Malley', 'Song Yadong',
                        'Rose Namajunas', 'Natalia Silva', 'Derrick Lewis', 'Arnold Allen', 'Jean Silva'];

  for (const name of fighterNames) {
    const fighters = await prisma.fighter.findMany({
      where: { name: { contains: name.split(' ')[1] || name } }
    });

    const exactMatches = fighters.filter(f => f.name === name);
    if (exactMatches.length > 1) {
      console.log(`\nFound ${exactMatches.length} "${name}" records - merging...`);

      // Keep the one with imageUrl or most data
      const toKeep = exactMatches.find(f => f.imageUrl !== null) || exactMatches[0];
      const toDelete = exactMatches.filter(f => f.id !== toKeep.id);

      for (const f of toDelete) {
        // Update fights
        await prisma.fight.updateMany({
          where: { fighterAId: f.id },
          data: { fighterAId: toKeep.id }
        });
        await prisma.fight.updateMany({
          where: { fighterBId: f.id },
          data: { fighterBId: toKeep.id }
        });

        // Delete stats
        await prisma.fighterStats.deleteMany({
          where: { fighterId: f.id }
        });

        // Delete fighter
        await prisma.fighter.delete({
          where: { id: f.id }
        });

        console.log(`  Deleted duplicate: ${f.name}`);
      }
    }
  }

  console.log('\nCleanup complete!');

  // Verify
  const finalEvents = await prisma.event.findMany({
    where: { name: { contains: 'UFC 324' } },
    include: { fights: true }
  });
  console.log(`\nFinal state: ${finalEvents.length} UFC 324 event(s) with ${finalEvents[0]?.fights.length || 0} fights`);

  await prisma.$disconnect();
}

cleanup().catch(console.error);
