// GET /api/events - List all events
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = upcoming
      ? {
          date: { gte: new Date() },
          isCompleted: false,
        }
      : {};

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: upcoming ? 'asc' : 'desc' },
      take: limit,
      include: {
        fights: {
          orderBy: { fightOrder: 'desc' },
          take: 1, // Just get main event for preview
          include: {
            fighterA: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            fighterB: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: { fights: true },
        },
      },
    });

    return NextResponse.json({
      events: events.map((event: typeof events[0]) => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        venue: event.venue,
        city: event.city,
        country: event.country,
        isPPV: event.isPPV,
        isCompleted: event.isCompleted,
        fightCount: event._count.fights,
        mainEvent: event.fights[0] ? {
          fighterA: event.fights[0].fighterA,
          fighterB: event.fights[0].fighterB,
          weightClass: event.fights[0].weightClass,
          isTitleFight: event.fights[0].isTitleFight,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
