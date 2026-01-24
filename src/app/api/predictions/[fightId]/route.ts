// GET /api/predictions/[fightId] - Get or generate prediction for a fight
import { NextRequest, NextResponse } from 'next/server';
import { getPrediction } from '@/lib/services/prediction-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fightId: string }> }
) {
  try {
    const { fightId } = await params;

    const prediction = await getPrediction(fightId);

    if (!prediction) {
      return NextResponse.json(
        { error: 'Fight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Error generating prediction:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
