// GET /api/events/[id] - Get single event with all fights
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { fighterImage } from '@/lib/fighter-images';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        fights: {
          orderBy: { fightOrder: 'desc' },
          include: {
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
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Group fights by card section
    const mainCard = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'main');
    const prelims = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'prelims');
    const earlyPrelims = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'early_prelims');

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        venue: event.venue,
        city: event.city,
        state: event.state,
        country: event.country,
        altitude: event.altitude,
        cageSize: event.cageSize,
        isPPV: event.isPPV,
        isCompleted: event.isCompleted,
      },
      fights: {
        mainCard: mainCard.map(formatFight),
        prelims: prelims.map(formatFight),
        earlyPrelims: earlyPrelims.map(formatFight),
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

function formatFight(fight: any) {
  const prediction = fight.predictions[0];

  return {
    id: fight.id,
    weightClass: fight.weightClass,
    isTitleFight: fight.isTitleFight,
    isInterimTitle: fight.isInterimTitle,
    isMainEvent: fight.isMainEvent,
    isCoMain: fight.isCoMain,
    scheduledRounds: fight.scheduledRounds,
    fightOrder: fight.fightOrder,
    fighterA: {
      id: fight.fighterA.id,
      name: fight.fighterA.name,
      nickname: fight.fighterA.nickname,
      imageUrl: fighterImage(fight.fighterA.name, fight.fighterA.imageUrl),
      nationality: fight.fighterA.nationality,
      stance: fight.fighterA.stance,
      fightingStyle: fight.fighterA.fightingStyle,
      record: `${fight.fighterA.wins}-${fight.fighterA.losses}${fight.fighterA.draws > 0 ? `-${fight.fighterA.draws}` : ''}`,
      currentRank: fight.fighterA.currentRank,
      isChampion: fight.fighterA.isChampion,
    },
    fighterB: {
      id: fight.fighterB.id,
      name: fight.fighterB.name,
      nickname: fight.fighterB.nickname,
      imageUrl: fighterImage(fight.fighterB.name, fight.fighterB.imageUrl),
      nationality: fight.fighterB.nationality,
      stance: fight.fighterB.stance,
      fightingStyle: fight.fighterB.fightingStyle,
      record: `${fight.fighterB.wins}-${fight.fighterB.losses}${fight.fighterB.draws > 0 ? `-${fight.fighterB.draws}` : ''}`,
      currentRank: fight.fighterB.currentRank,
      isChampion: fight.fighterB.isChampion,
    },
    odds: {
      fighterA: fight.fighterAOdds,
      fighterB: fight.fighterBOdds,
    },
    prediction: prediction ? {
      fighterAWinProb: prediction.fighterAWinProb,
      fighterBWinProb: prediction.fighterBWinProb,
      predictedWinnerId: prediction.predictedWinnerId,
      confidence: prediction.confidence,
      insights: prediction.insights,
    } : null,
    result: fight.winnerId ? {
      winnerId: fight.winnerId,
      method: fight.method,
      methodDetail: fight.methodDetail,
      round: fight.round,
      time: fight.time,
    } : null,
  };
}
