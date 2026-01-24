// GET /api/fighters - List fighters with search
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const weightClass = searchParams.get('weightClass');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (weightClass) {
      where.weightClass = weightClass;
    }

    const [fighters, total] = await Promise.all([
      prisma.fighter.findMany({
        where,
        orderBy: [
          { isChampion: 'desc' },
          { currentRank: 'asc' },
          { wins: 'desc' },
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          nickname: true,
          imageUrl: true,
          nationality: true,
          weightClass: true,
          stance: true,
          fightingStyle: true,
          wins: true,
          losses: true,
          draws: true,
          currentRank: true,
          isChampion: true,
          currentStreak: true,
        },
      }),
      prisma.fighter.count({ where }),
    ]);

    return NextResponse.json({
      fighters: fighters.map((f: typeof fighters[0]) => ({
        ...f,
        record: `${f.wins}-${f.losses}${f.draws > 0 ? `-${f.draws}` : ''}`,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching fighters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fighters' },
      { status: 500 }
    );
  }
}
