import { prisma } from '../database/prisma';
import {
  scrapeAllFighters,
  scrapeFighter,
  scrapeFighterHistory,
  scrapeUpcomingEvents,
  scrapeEventDetails,
  classifyFightingStyle,
  type ScrapedFighter,
} from './ufc-stats';
import { syncOddsToDatabase } from './odds-api';

// =============================================
// SYNC LOG HELPERS
// =============================================

async function createSyncLog(syncType: string) {
  return prisma.syncLog.create({
    data: {
      syncType,
      status: 'started',
    },
  });
}

async function completeSyncLog(id: string, itemsProcessed: number, errors: number, errorMessages: string[] = []) {
  return prisma.syncLog.update({
    where: { id },
    data: {
      status: errors > 0 ? 'completed_with_errors' : 'completed',
      itemsProcessed,
      errors,
      errorMessages,
      completedAt: new Date(),
    },
  });
}

async function failSyncLog(id: string, errorMessage: string) {
  return prisma.syncLog.update({
    where: { id },
    data: {
      status: 'failed',
      errorMessages: [errorMessage],
      completedAt: new Date(),
    },
  });
}

// =============================================
// FULL FIGHTER SYNC
// =============================================

export async function syncAllFighters(): Promise<{ synced: number; errors: number }> {
  console.log('Starting full fighter sync...');
  const syncLog = await createSyncLog('fighters');

  try {
    const fighterIds = await scrapeAllFighters();
    console.log(`Found ${fighterIds.length} fighters to sync`);

    let synced = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const ufcStatsId of fighterIds) {
      try {
        const data = await scrapeFighter(ufcStatsId);
        if (!data) {
          errors++;
          continue;
        }

        await upsertFighter(data);
        synced++;

        if (synced % 50 === 0) {
          console.log(`Synced ${synced}/${fighterIds.length} fighters...`);
        }
      } catch (error) {
        const msg = `Error syncing fighter ${ufcStatsId}: ${error}`;
        console.error(msg);
        errorMessages.push(msg);
        errors++;
      }
    }

    await completeSyncLog(syncLog.id, synced, errors, errorMessages.slice(0, 10));
    console.log(`Fighter sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    await failSyncLog(syncLog.id, String(error));
    throw error;
  }
}

async function upsertFighter(data: ScrapedFighter) {
  // Classify fighting style based on stats
  const fightingStyle = classifyFightingStyle(data);

  // Calculate derived stats
  const timesKOd = data.lossByKO + data.lossByTKO;
  const timesSubmitted = data.lossBySub;
  const careerFinishRate = data.record.wins > 0
    ? (data.winByKO + data.winByTKO + data.winBySub) / data.record.wins
    : 0;

  // Upsert fighter
  const fighter = await prisma.fighter.upsert({
    where: { ufcStatsId: data.ufcStatsId },
    update: {
      name: data.name,
      nickname: data.nickname,
      height: data.height,
      reach: data.reach,
      stance: data.stance || 'orthodox',
      dateOfBirth: data.dateOfBirth,
      wins: data.record.wins,
      losses: data.record.losses,
      draws: data.record.draws,
      noContests: data.record.nc,
      winByKO: data.winByKO,
      winByTKO: data.winByTKO,
      winBySub: data.winBySub,
      winByDec: data.winByDec,
      fightingStyle,
      timesKOd,
      timesSubmitted,
      careerFinishRate,
      updatedAt: new Date(),
    },
    create: {
      ufcStatsId: data.ufcStatsId,
      name: data.name,
      nickname: data.nickname,
      height: data.height,
      reach: data.reach,
      stance: data.stance || 'orthodox',
      dateOfBirth: data.dateOfBirth,
      wins: data.record.wins,
      losses: data.record.losses,
      draws: data.record.draws,
      noContests: data.record.nc,
      winByKO: data.winByKO,
      winByTKO: data.winByTKO,
      winBySub: data.winBySub,
      winByDec: data.winByDec,
      fightingStyle,
      timesKOd,
      timesSubmitted,
      careerFinishRate,
    },
  });

  // Upsert fighter stats
  await prisma.fighterStats.upsert({
    where: { fighterId: fighter.id },
    update: {
      slpm: data.slpm,
      strAcc: data.strAcc,
      sapm: data.sapm,
      strDef: data.strDef,
      tdAvg: data.tdAvg,
      tdAcc: data.tdAcc,
      tdDef: data.tdDef,
      subAvg: data.subAvg,
    },
    create: {
      fighterId: fighter.id,
      slpm: data.slpm,
      strAcc: data.strAcc,
      sapm: data.sapm,
      strDef: data.strDef,
      tdAvg: data.tdAvg,
      tdAcc: data.tdAcc,
      tdDef: data.tdDef,
      subAvg: data.subAvg,
    },
  });

  return fighter;
}

// =============================================
// SYNC SPECIFIC FIGHTERS (by name)
// =============================================

export async function syncFighterByName(name: string): Promise<boolean> {
  console.log(`Searching for fighter: ${name}`);

  // Search for fighter on UFCStats
  const fighterIds = await scrapeAllFighters();

  // Simple name matching
  const nameLower = name.toLowerCase();
  const matchingIds: string[] = [];

  for (const id of fighterIds.slice(0, 100)) { // Limit search
    const data = await scrapeFighter(id);
    if (data && data.name.toLowerCase().includes(nameLower)) {
      matchingIds.push(id);
      console.log(`Found match: ${data.name}`);
    }
  }

  if (matchingIds.length === 0) {
    console.log('No matching fighters found');
    return false;
  }

  // Sync matching fighters
  for (const id of matchingIds) {
    const data = await scrapeFighter(id);
    if (data) {
      await upsertFighter(data);
      console.log(`Synced: ${data.name}`);
    }
  }

  return true;
}

// =============================================
// SYNC UPCOMING EVENTS
// =============================================

export async function syncUpcomingEvents(): Promise<{ events: number; fights: number; errors: number }> {
  console.log('Syncing upcoming events...');
  const syncLog = await createSyncLog('events');

  try {
    const events = await scrapeUpcomingEvents();
    let eventCount = 0;
    let fightCount = 0;
    let errors = 0;

    for (const eventData of events) {
      try {
        // Get fight details
        const fights = await scrapeEventDetails(eventData.ufcStatsId);

        // Parse location
        const locationParts = eventData.location.split(',').map(s => s.trim());
        const city = locationParts[0] || '';
        const country = locationParts[locationParts.length - 1] || '';

        // Determine event type
        const isPPV = eventData.name.includes('UFC ') && !eventData.name.includes('Fight Night');
        const isFightNight = eventData.name.includes('Fight Night');

        // Upsert event
        const event = await prisma.event.upsert({
          where: { ufcStatsId: eventData.ufcStatsId },
          update: {
            name: eventData.name,
            date: eventData.date,
            city,
            country,
            isPPV,
            isFightNight,
          },
          create: {
            ufcStatsId: eventData.ufcStatsId,
            name: eventData.name,
            date: eventData.date,
            city,
            country,
            isPPV,
            isFightNight,
          },
        });

        eventCount++;

        // Sync fights
        for (let i = 0; i < fights.length; i++) {
          const fightData = fights[i];

          // Find or create fighters
          let fighterA = await prisma.fighter.findUnique({
            where: { ufcStatsId: fightData.fighterAId },
          });
          let fighterB = await prisma.fighter.findUnique({
            where: { ufcStatsId: fightData.fighterBId },
          });

          // If fighters don't exist, scrape them
          if (!fighterA) {
            const scraped = await scrapeFighter(fightData.fighterAId);
            if (scraped) {
              fighterA = await upsertFighter(scraped);
            }
          }
          if (!fighterB) {
            const scraped = await scrapeFighter(fightData.fighterBId);
            if (scraped) {
              fighterB = await upsertFighter(scraped);
            }
          }

          if (!fighterA || !fighterB) {
            console.log(`Skipping fight: ${fightData.fighterAName} vs ${fightData.fighterBName} - fighters not found`);
            continue;
          }

          // Generate unique fight ID
          const fightId = `${event.id}-${fighterA.id}-${fighterB.id}`;

          await prisma.fight.upsert({
            where: { id: fightId },
            update: {
              weightClass: fightData.weightClass || 'Unknown',
              isTitleFight: fightData.isTitleFight,
              isMainEvent: i === 0,
              fightOrder: fights.length - i,
              scheduledRounds: fightData.isTitleFight || i === 0 ? 5 : 3,
            },
            create: {
              id: fightId,
              eventId: event.id,
              fighterAId: fighterA.id,
              fighterBId: fighterB.id,
              weightClass: fightData.weightClass || 'Unknown',
              isTitleFight: fightData.isTitleFight,
              isMainEvent: i === 0,
              fightOrder: fights.length - i,
              scheduledRounds: fightData.isTitleFight || i === 0 ? 5 : 3,
            },
          });

          fightCount++;
        }

        console.log(`Synced event: ${eventData.name} with ${fights.length} fights`);
      } catch (error) {
        console.error(`Error syncing event ${eventData.name}:`, error);
        errors++;
      }
    }

    await completeSyncLog(syncLog.id, eventCount, errors);
    return { events: eventCount, fights: fightCount, errors };
  } catch (error) {
    await failSyncLog(syncLog.id, String(error));
    throw error;
  }
}

// =============================================
// CALCULATE DERIVED STATS
// =============================================

export async function calculateDerivedStats(): Promise<void> {
  console.log('Calculating derived stats for all fighters...');

  const fighters = await prisma.fighter.findMany({
    include: { fightHistory: true },
  });

  for (const fighter of fighters) {
    const history = fighter.fightHistory.sort(
      (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );

    if (history.length === 0) continue;

    // Last 5 record
    const last5 = history.slice(0, 5);
    const wins = last5.filter(f => f.outcome === 'win').length;
    const losses = last5.filter(f => f.outcome === 'loss').length;
    const last5Record = `${wins}-${losses}`;

    // Current streak
    let currentStreak = 0;
    for (const fight of history) {
      if (fight.outcome === 'win') {
        if (currentStreak >= 0) currentStreak++;
        else break;
      } else if (fight.outcome === 'loss') {
        if (currentStreak <= 0) currentStreak--;
        else break;
      }
    }

    // Finish rate last 5
    const finishesLast5 = last5.filter(f =>
      f.outcome === 'win' && f.didFinish
    ).length;
    const winsLast5 = last5.filter(f => f.outcome === 'win').length;
    const finishRateLast5 = winsLast5 > 0 ? finishesLast5 / winsLast5 : 0;

    // Days since last fight
    const daysSinceLastFight = history.length > 0
      ? Math.floor((Date.now() - new Date(history[0].eventDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 5 round experience
    const fiveRoundFights = history.filter(f => f.scheduledRounds === 5).length;
    const winsInLateRounds = history.filter(f =>
      f.outcome === 'win' && f.round >= 4
    ).length;

    await prisma.fighter.update({
      where: { id: fighter.id },
      data: {
        last5Record,
        currentStreak,
        finishRateLast5,
        daysSinceLastFight,
        fiveRoundFights,
        winsInLateRounds,
      },
    });
  }

  console.log('Derived stats calculation complete');
}

// =============================================
// SYNC FIGHT HISTORY FOR A FIGHTER
// =============================================

export async function syncFighterHistory(ufcStatsId: string): Promise<number> {
  const fighter = await prisma.fighter.findUnique({
    where: { ufcStatsId },
  });

  if (!fighter) {
    console.log(`Fighter not found: ${ufcStatsId}`);
    return 0;
  }

  const history = await scrapeFighterHistory(ufcStatsId);
  let synced = 0;

  for (const fight of history) {
    try {
      // Check if already exists
      const existing = await prisma.fightHistory.findFirst({
        where: {
          fighterId: fighter.id,
          eventDate: fight.eventDate,
          opponent: fight.opponent,
        },
      });

      if (existing) continue;

      // Determine if fighter was finished or finished opponent
      const method = fight.method.toUpperCase();
      const didFinish = fight.outcome === 'win' && (
        method.includes('KO') || method.includes('TKO') || method.includes('SUB')
      );
      const wasFinished = fight.outcome === 'loss' && (
        method.includes('KO') || method.includes('TKO') || method.includes('SUB')
      );

      await prisma.fightHistory.create({
        data: {
          fighterId: fighter.id,
          eventDate: fight.eventDate,
          eventName: fight.eventName,
          opponent: fight.opponent,
          opponentId: fight.opponentId,
          outcome: fight.outcome,
          method: fight.method,
          methodDetail: fight.methodDetail,
          round: fight.round,
          time: fight.time,
          scheduledRounds: fight.scheduledRounds,
          didFinish,
          wasFinished,
          sigStrikesLanded: fight.sigStrikesLanded,
          sigStrikesAttempted: fight.sigStrikesAttempted,
          takedownsLanded: fight.takedownsLanded,
          takedownsAttempted: fight.takedownsAttempted,
          submissionAttempts: fight.submissionAttempts,
        },
      });

      synced++;
    } catch (error) {
      console.error(`Error syncing fight history entry:`, error);
    }
  }

  console.log(`Synced ${synced} fights for ${fighter.name}`);
  return synced;
}

// =============================================
// MASTER SYNC FUNCTIONS
// =============================================

export async function runFullSync(): Promise<void> {
  console.log('========================================');
  console.log('Starting full data sync...');
  console.log('========================================');

  const startTime = Date.now();

  // 1. Sync all fighters (this takes a while)
  await syncAllFighters();

  // 2. Sync upcoming events
  await syncUpcomingEvents();

  // 3. Calculate derived stats
  await calculateDerivedStats();

  // 4. Sync live odds
  await syncOddsToDatabase();

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log('========================================');
  console.log(`Full sync complete in ${duration} seconds`);
  console.log('========================================');
}

export async function runQuickSync(): Promise<{
  events: { events: number; fights: number; errors: number };
  odds: { updated: number; errors: number };
}> {
  console.log('Running quick sync (events + odds)...');

  const events = await syncUpcomingEvents();
  const odds = await syncOddsToDatabase();

  console.log('Quick sync complete');
  return { events, odds };
}

// =============================================
// GET SYNC STATUS
// =============================================

export async function getSyncStatus() {
  const [fighterCount, eventCount, fightCount, lastOddsUpdate, lastSync] = await Promise.all([
    prisma.fighter.count(),
    prisma.event.count(),
    prisma.fight.count(),
    prisma.oddsHistory.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
    prisma.syncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  return {
    fighters: fighterCount,
    events: eventCount,
    fights: fightCount,
    lastOddsUpdate: lastOddsUpdate?.timestamp || null,
    lastSync: lastSync || null,
  };
}
