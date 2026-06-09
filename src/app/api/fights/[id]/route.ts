// GET /api/fights/[id] - Get detailed fight info with fighter stats
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { fighterImage } from '@/lib/fighter-images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fight = await prisma.fight.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true,
            city: true,
            country: true,
          },
        },
        fighterA: {
          include: {
            stats: true,
          },
        },
        fighterB: {
          include: {
            stats: true,
          },
        },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    const prediction = fight.predictions[0] || null;

    return NextResponse.json({
      fight: {
        id: fight.id,
        weightClass: fight.weightClass,
        isTitleFight: fight.isTitleFight,
        isMainEvent: fight.isMainEvent,
        isCoMain: fight.isCoMain,
        scheduledRounds: fight.scheduledRounds,
        fighterAOdds: fight.fighterAOdds,
        fighterBOdds: fight.fighterBOdds,
        event: fight.event,
        fighterA: {
          id: fight.fighterA.id,
          name: fight.fighterA.name,
          nickname: fight.fighterA.nickname,
          imageUrl: fighterImage(fight.fighterA.name, fight.fighterA.imageUrl),
          nationality: fight.fighterA.nationality,
          stance: fight.fighterA.stance,
          height: fight.fighterA.height,
          reach: fight.fighterA.reach,
          fightingStyle: fight.fighterA.fightingStyle,
          trainingCamp: fight.fighterA.trainingCamp,
          wins: fight.fighterA.wins,
          losses: fight.fighterA.losses,
          draws: fight.fighterA.draws,
          winByKO: fight.fighterA.winByKO,
          winByTKO: fight.fighterA.winByTKO,
          winBySub: fight.fighterA.winBySub,
          winByDec: fight.fighterA.winByDec,
          currentStreak: fight.fighterA.currentStreak,
          currentRank: fight.fighterA.currentRank,
          isChampion: fight.fighterA.isChampion,
          timesKOd: fight.fighterA.timesKOd,
          timesSubmitted: fight.fighterA.timesSubmitted,
          stats: fight.fighterA.stats,
        },
        fighterB: {
          id: fight.fighterB.id,
          name: fight.fighterB.name,
          nickname: fight.fighterB.nickname,
          imageUrl: fighterImage(fight.fighterB.name, fight.fighterB.imageUrl),
          nationality: fight.fighterB.nationality,
          stance: fight.fighterB.stance,
          height: fight.fighterB.height,
          reach: fight.fighterB.reach,
          fightingStyle: fight.fighterB.fightingStyle,
          trainingCamp: fight.fighterB.trainingCamp,
          wins: fight.fighterB.wins,
          losses: fight.fighterB.losses,
          draws: fight.fighterB.draws,
          winByKO: fight.fighterB.winByKO,
          winByTKO: fight.fighterB.winByTKO,
          winBySub: fight.fighterB.winBySub,
          winByDec: fight.fighterB.winByDec,
          currentStreak: fight.fighterB.currentStreak,
          currentRank: fight.fighterB.currentRank,
          isChampion: fight.fighterB.isChampion,
          timesKOd: fight.fighterB.timesKOd,
          timesSubmitted: fight.fighterB.timesSubmitted,
          stats: fight.fighterB.stats,
        },
        prediction: prediction
          ? {
              fighterAWinProb: prediction.fighterAWinProb,
              fighterBWinProb: prediction.fighterBWinProb,
              fighterAByKO: prediction.fighterAByKO,
              fighterAByTKO: prediction.fighterAByTKO,
              fighterABySub: prediction.fighterABySub,
              fighterAByDec: prediction.fighterAByDec,
              fighterBByKO: prediction.fighterBByKO,
              fighterBByTKO: prediction.fighterBByTKO,
              fighterBBySub: prediction.fighterBBySub,
              fighterBByDec: prediction.fighterBByDec,
              confidence: prediction.confidence,
              insights: prediction.insights,
              factors: prediction.factors,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching fight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fight details' },
      { status: 500 }
    );
  }
}
