// GET /api/fighters/[id] - Get full fighter profile
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { fighterImage } from '@/lib/fighter-images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fighter = await prisma.fighter.findUnique({
      where: { id },
      include: {
        stats: true,
        stancePerformance: true,
        stylePerformance: true,
        fightHistory: {
          orderBy: { eventDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!fighter) {
      return NextResponse.json(
        { error: 'Fighter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fighter: {
        id: fighter.id,
        name: fighter.name,
        nickname: fighter.nickname,
        imageUrl: fighterImage(fighter.name, fighter.imageUrl),
        nationality: fighter.nationality,
        weightClass: fighter.weightClass,
        hometown: fighter.hometown,
        trainingCamp: fighter.trainingCamp,

        // Physical
        stance: fighter.stance,
        height: fighter.height,
        reach: fighter.reach,
        legReach: fighter.legReach,
        dateOfBirth: fighter.dateOfBirth,

        // Record
        record: `${fighter.wins}-${fighter.losses}${fighter.draws > 0 ? `-${fighter.draws}` : ''}`,
        wins: fighter.wins,
        losses: fighter.losses,
        draws: fighter.draws,
        noContests: fighter.noContests,
        winByKO: fighter.winByKO,
        winByTKO: fighter.winByTKO,
        winBySub: fighter.winBySub,
        winByDec: fighter.winByDec,

        // Style
        fightingStyle: fighter.fightingStyle,
        fightingApproach: fighter.fightingApproach,

        // Performance metrics
        currentStreak: fighter.currentStreak,
        last5Record: fighter.last5Record,
        finishRateLast5: fighter.finishRateLast5,
        careerFinishRate: fighter.careerFinishRate,
        daysSinceLastFight: fighter.daysSinceLastFight,
        timesKOd: fighter.timesKOd,
        timesSubmitted: fighter.timesSubmitted,
        avgFightTimeSeconds: fighter.avgFightTimeSeconds,

        // Championship
        fiveRoundFights: fighter.fiveRoundFights,
        winsInLateRounds: fighter.winsInLateRounds,
        titleFights: fighter.titleFights,
        titleWins: fighter.titleWins,

        // Ranking
        currentRank: fighter.currentRank,
        peakRank: fighter.peakRank,
        isChampion: fighter.isChampion,

        // Detailed stats
        stats: fighter.stats ? {
          slpm: fighter.stats.slpm,
          strAcc: fighter.stats.strAcc,
          sapm: fighter.stats.sapm,
          strDef: fighter.stats.strDef,
          tdAvg: fighter.stats.tdAvg,
          tdAcc: fighter.stats.tdAcc,
          tdDef: fighter.stats.tdDef,
          subAvg: fighter.stats.subAvg,
        } : null,

        // Performance breakdowns
        stancePerformance: fighter.stancePerformance.map((sp: typeof fighter.stancePerformance[0]) => ({
          opponentStance: sp.opponentStance,
          wins: sp.wins,
          losses: sp.losses,
          draws: sp.draws,
        })),

        stylePerformance: fighter.stylePerformance.map((sp: typeof fighter.stylePerformance[0]) => ({
          opponentStyle: sp.opponentStyle,
          wins: sp.wins,
          losses: sp.losses,
          draws: sp.draws,
        })),

        // Recent fight history
        recentFights: fighter.fightHistory.map((fh: typeof fighter.fightHistory[0]) => ({
          eventDate: fh.eventDate,
          eventName: fh.eventName,
          opponent: fh.opponent,
          outcome: fh.outcome,
          method: fh.method,
          methodDetail: fh.methodDetail,
          round: fh.round,
          time: fh.time,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching fighter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fighter' },
      { status: 500 }
    );
  }
}
