// GET/POST /api/fights/[id]/analysis - AI-generated matchup analysis
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import {
  generateMatchupAnalysis,
  MatchupAnalysisInput,
  FighterAnalysisData,
} from '@/lib/ai/matchup-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fightId } = await params;

    // Check for cached analysis
    const cached = await prisma.matchupAnalysis.findUnique({
      where: { fightId },
    });

    if (cached) {
      return NextResponse.json({
        analysis: cached,
        source: 'cache',
      });
    }

    return NextResponse.json(
      { error: 'No analysis found. Use POST to generate.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fightId } = await params;

    // Check for existing analysis first
    const existing = await prisma.matchupAnalysis.findUnique({
      where: { fightId },
    });

    if (existing) {
      return NextResponse.json({
        analysis: existing,
        source: 'cache',
      });
    }

    // Fetch fight with all necessary data
    const fight = await prisma.fight.findUnique({
      where: { id: fightId },
      include: {
        event: true,
        fighterA: {
          include: { stats: true },
        },
        fighterB: {
          include: { stats: true },
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

    const prediction = fight.predictions[0];
    if (!prediction) {
      return NextResponse.json(
        { error: 'No prediction available for this fight' },
        { status: 400 }
      );
    }

    // Build fighter analysis data
    const fighterAData: FighterAnalysisData = {
      name: fight.fighterA.name,
      nickname: fight.fighterA.nickname || undefined,
      fightingStyle: fight.fighterA.fightingStyle,
      fightingApproach: fight.fighterA.fightingApproach || undefined,
      stance: fight.fighterA.stance,
      reach: fight.fighterA.reach || undefined,
      height: fight.fighterA.height || undefined,
      stats: {
        slpm: fight.fighterA.stats?.slpm || 0,
        strAcc: fight.fighterA.stats?.strAcc || 0,
        sapm: fight.fighterA.stats?.sapm || 0,
        strDef: fight.fighterA.stats?.strDef || 0,
        tdAvg: fight.fighterA.stats?.tdAvg || 0,
        tdAcc: fight.fighterA.stats?.tdAcc || 0,
        tdDef: fight.fighterA.stats?.tdDef || 0,
        subAvg: fight.fighterA.stats?.subAvg || 0,
      },
      history: {
        wins: fight.fighterA.wins,
        losses: fight.fighterA.losses,
        last5Record: fight.fighterA.last5Record,
        currentStreak: fight.fighterA.currentStreak,
        careerFinishRate: fight.fighterA.careerFinishRate,
        timesKOd: fight.fighterA.timesKOd,
        timesSubmitted: fight.fighterA.timesSubmitted,
        daysSinceLastFight: fight.fighterA.daysSinceLastFight,
        fiveRoundFights: fight.fighterA.fiveRoundFights,
      },
    };

    const fighterBData: FighterAnalysisData = {
      name: fight.fighterB.name,
      nickname: fight.fighterB.nickname || undefined,
      fightingStyle: fight.fighterB.fightingStyle,
      fightingApproach: fight.fighterB.fightingApproach || undefined,
      stance: fight.fighterB.stance,
      reach: fight.fighterB.reach || undefined,
      height: fight.fighterB.height || undefined,
      stats: {
        slpm: fight.fighterB.stats?.slpm || 0,
        strAcc: fight.fighterB.stats?.strAcc || 0,
        sapm: fight.fighterB.stats?.sapm || 0,
        strDef: fight.fighterB.stats?.strDef || 0,
        tdAvg: fight.fighterB.stats?.tdAvg || 0,
        tdAcc: fight.fighterB.stats?.tdAcc || 0,
        tdDef: fight.fighterB.stats?.tdDef || 0,
        subAvg: fight.fighterB.stats?.subAvg || 0,
      },
      history: {
        wins: fight.fighterB.wins,
        losses: fight.fighterB.losses,
        last5Record: fight.fighterB.last5Record,
        currentStreak: fight.fighterB.currentStreak,
        careerFinishRate: fight.fighterB.careerFinishRate,
        timesKOd: fight.fighterB.timesKOd,
        timesSubmitted: fight.fighterB.timesSubmitted,
        daysSinceLastFight: fight.fighterB.daysSinceLastFight,
        fiveRoundFights: fight.fighterB.fiveRoundFights,
      },
    };

    // Parse factors from prediction
    const factors =
      typeof prediction.factors === 'object' && prediction.factors !== null
        ? (prediction.factors as Record<string, number>)
        : {};

    const input: MatchupAnalysisInput = {
      fighterA: fighterAData,
      fighterB: fighterBData,
      prediction: {
        fighterAWinProb: prediction.fighterAWinProb,
        fighterBWinProb: prediction.fighterBWinProb,
        confidence: prediction.confidence,
        factors,
        insights: prediction.insights,
      },
      context: {
        weightClass: fight.weightClass,
        isTitleFight: fight.isTitleFight,
        scheduledRounds: fight.scheduledRounds,
        isMainEvent: fight.isMainEvent,
        fighterAOdds: fight.fighterAOdds || undefined,
        fighterBOdds: fight.fighterBOdds || undefined,
      },
    };

    // Generate analysis using Claude
    const analysis = await generateMatchupAnalysis(input);

    // Save to database (upsert to handle existing records)
    const saved = await prisma.matchupAnalysis.upsert({
      where: { fightId },
      update: {
        matchupSummary: analysis.matchupSummary,
        pickExplanation: analysis.pickExplanation,
        keyFactorNarrative: analysis.keyFactorNarrative,
        recommendedPick: analysis.recommendedPick,
        recommendedFighter: analysis.recommendedFighter,
        winProbability: analysis.winProbability,
        confidenceLevel: analysis.confidenceLevel,
        factorBreakdown: JSON.parse(JSON.stringify(analysis.factorBreakdown)),
        bettingInsight: analysis.bettingInsight,
        cautionFlags: analysis.cautionFlags,
        tokensUsed: analysis.tokensUsed,
      },
      create: {
        fightId,
        matchupSummary: analysis.matchupSummary,
        pickExplanation: analysis.pickExplanation,
        keyFactorNarrative: analysis.keyFactorNarrative,
        recommendedPick: analysis.recommendedPick,
        recommendedFighter: analysis.recommendedFighter,
        winProbability: analysis.winProbability,
        confidenceLevel: analysis.confidenceLevel,
        factorBreakdown: JSON.parse(JSON.stringify(analysis.factorBreakdown)),
        bettingInsight: analysis.bettingInsight,
        cautionFlags: analysis.cautionFlags,
        tokensUsed: analysis.tokensUsed,
      },
    });

    return NextResponse.json({
      analysis: saved,
      source: 'generated',
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
