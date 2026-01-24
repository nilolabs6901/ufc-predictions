// GET/POST /api/intelligence - Fighter injury and camp intelligence
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import {
  analyzeInjuryAndCamp,
  type InjuryData,
  type CampData,
} from '@/lib/prediction-engine/injury-camp-analyzer';

// GET: Retrieve intelligence for a fighter or fight
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fighterId = searchParams.get('fighterId');
  const fightId = searchParams.get('fightId');

  try {
    if (fightId) {
      // Get intelligence for both fighters in a fight
      const fight = await prisma.fight.findUnique({
        where: { id: fightId },
        include: {
          fighterA: {
            select: { id: true, name: true, fightingStyle: true },
          },
          fighterB: {
            select: { id: true, name: true, fightingStyle: true },
          },
        },
      });

      if (!fight) {
        return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
      }

      // Get injuries and camp intel for both fighters
      const [fighterAInjuries, fighterBInjuries, fighterACamp, fighterBCamp] =
        await Promise.all([
          prisma.fighterInjury.findMany({
            where: { fighterId: fight.fighterAId },
            orderBy: { reportedDate: 'desc' },
          }),
          prisma.fighterInjury.findMany({
            where: { fighterId: fight.fighterBId },
            orderBy: { reportedDate: 'desc' },
          }),
          prisma.campIntelligence.findFirst({
            where: { fightId },
            orderBy: { reportedDate: 'desc' },
          }),
          prisma.campIntelligence.findFirst({
            where: { fightId },
            orderBy: { reportedDate: 'desc' },
          }),
        ]);

      // Transform injuries to InjuryData type
      const transformInjuries = (injuries: typeof fighterAInjuries): InjuryData[] =>
        injuries.map(i => ({
          bodyPart: i.bodyPart,
          severity: i.severity as InjuryData['severity'],
          occurredDate: i.occurredDate || undefined,
          isRecovered: i.isRecovered,
          affectsFight: i.affectsFight,
        }));

      // Transform camp data
      const transformCamp = (camp: typeof fighterACamp): CampData | null =>
        camp
          ? {
              campWeeks: camp.campWeeks || undefined,
              isShortNotice: camp.isShortNotice,
              campChanged: camp.campChanged,
              weightIssues: camp.weightIssues,
              personalIssues: camp.personalIssues,
              lowConfidence: camp.lowConfidence,
              highConfidence: camp.highConfidence,
              sparringQuality: (camp.sparringQuality as CampData['sparringQuality']) || undefined,
              specificPrep: camp.specificPrep,
            }
          : null;

      const fighterAAnalysis = analyzeInjuryAndCamp(
        transformInjuries(fighterAInjuries),
        transformCamp(fighterACamp),
        fight.fighterA.fightingStyle
      );

      const fighterBAnalysis = analyzeInjuryAndCamp(
        transformInjuries(fighterBInjuries),
        transformCamp(fighterBCamp),
        fight.fighterB.fightingStyle
      );

      return NextResponse.json({
        fightId,
        fighterA: {
          id: fight.fighterA.id,
          name: fight.fighterA.name,
          injuries: fighterAInjuries,
          campIntel: fighterACamp,
          analysis: fighterAAnalysis,
        },
        fighterB: {
          id: fight.fighterB.id,
          name: fight.fighterB.name,
          injuries: fighterBInjuries,
          campIntel: fighterBCamp,
          analysis: fighterBAnalysis,
        },
      });
    }

    if (fighterId) {
      // Get intelligence for a single fighter
      const fighter = await prisma.fighter.findUnique({
        where: { id: fighterId },
        select: { id: true, name: true, fightingStyle: true },
      });

      if (!fighter) {
        return NextResponse.json({ error: 'Fighter not found' }, { status: 404 });
      }

      const [injuries, campIntel] = await Promise.all([
        prisma.fighterInjury.findMany({
          where: { fighterId },
          orderBy: { reportedDate: 'desc' },
        }),
        prisma.campIntelligence.findMany({
          where: { fighterId },
          orderBy: { reportedDate: 'desc' },
          take: 5,
        }),
      ]);

      const transformedInjuries: InjuryData[] = injuries.map(i => ({
        bodyPart: i.bodyPart,
        severity: i.severity as InjuryData['severity'],
        occurredDate: i.occurredDate || undefined,
        isRecovered: i.isRecovered,
        affectsFight: i.affectsFight,
      }));

      const latestCamp = campIntel[0];
      const campData: CampData | null = latestCamp
        ? {
            campWeeks: latestCamp.campWeeks || undefined,
            isShortNotice: latestCamp.isShortNotice,
            campChanged: latestCamp.campChanged,
            weightIssues: latestCamp.weightIssues,
            personalIssues: latestCamp.personalIssues,
            lowConfidence: latestCamp.lowConfidence,
            highConfidence: latestCamp.highConfidence,
            sparringQuality: (latestCamp.sparringQuality as CampData['sparringQuality']) || undefined,
            specificPrep: latestCamp.specificPrep,
          }
        : null;

      const analysis = analyzeInjuryAndCamp(transformedInjuries, campData, fighter.fightingStyle);

      return NextResponse.json({
        fighter: {
          id: fighter.id,
          name: fighter.name,
        },
        injuries,
        campIntel,
        analysis,
      });
    }

    return NextResponse.json(
      { error: 'Must provide fighterId or fightId parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching intelligence:', error);
    return NextResponse.json({ error: 'Failed to fetch intelligence' }, { status: 500 });
  }
}

// POST: Add new injury or camp intelligence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, fighterId, fightId, data } = body;

    if (!fighterId) {
      return NextResponse.json({ error: 'fighterId is required' }, { status: 400 });
    }

    // Verify fighter exists
    const fighter = await prisma.fighter.findUnique({
      where: { id: fighterId },
    });

    if (!fighter) {
      return NextResponse.json({ error: 'Fighter not found' }, { status: 404 });
    }

    if (type === 'injury') {
      // Add injury record
      const injury = await prisma.fighterInjury.create({
        data: {
          fighterId,
          bodyPart: data.bodyPart,
          severity: data.severity,
          description: data.description,
          occurredDate: data.occurredDate ? new Date(data.occurredDate) : null,
          recoveryDate: data.recoveryDate ? new Date(data.recoveryDate) : null,
          isRecovered: data.isRecovered || false,
          affectsFight: data.affectsFight !== false,
          source: data.source,
        },
      });

      return NextResponse.json({ success: true, injury });
    }

    if (type === 'camp') {
      // Add camp intelligence
      const campIntel = await prisma.campIntelligence.create({
        data: {
          fighterId,
          fightId: fightId || null,
          campWeeks: data.campWeeks,
          isShortNotice: data.isShortNotice || false,
          campChanged: data.campChanged || false,
          newCampName: data.newCampName,
          weightIssues: data.weightIssues || false,
          missedWeight: data.missedWeight || false,
          drainedFromCut: data.drainedFromCut || false,
          personalIssues: data.personalIssues || false,
          lowConfidence: data.lowConfidence || false,
          highConfidence: data.highConfidence || false,
          sparringQuality: data.sparringQuality,
          specificPrep: data.specificPrep || false,
          source: data.source,
        },
      });

      return NextResponse.json({ success: true, campIntel });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "injury" or "camp"' }, { status: 400 });
  } catch (error) {
    console.error('Error adding intelligence:', error);
    return NextResponse.json({ error: 'Failed to add intelligence' }, { status: 500 });
  }
}

// PATCH: Update injury recovery status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { injuryId, isRecovered, recoveryDate } = body;

    if (!injuryId) {
      return NextResponse.json({ error: 'injuryId is required' }, { status: 400 });
    }

    const injury = await prisma.fighterInjury.update({
      where: { id: injuryId },
      data: {
        isRecovered: isRecovered ?? undefined,
        recoveryDate: recoveryDate ? new Date(recoveryDate) : undefined,
        affectsFight: isRecovered ? false : undefined,
      },
    });

    return NextResponse.json({ success: true, injury });
  } catch (error) {
    console.error('Error updating injury:', error);
    return NextResponse.json({ error: 'Failed to update injury' }, { status: 500 });
  }
}
