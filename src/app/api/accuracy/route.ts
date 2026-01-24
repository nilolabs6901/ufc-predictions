// GET /api/accuracy - Get prediction accuracy stats with calibration data
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

/**
 * Calculate Wilson score confidence interval
 * Used for statistically valid confidence intervals on accuracy
 */
function wilsonInterval(successes: number, total: number, z = 1.96): { lower: number; upper: number } {
  if (total === 0) return { lower: 0, upper: 0 };

  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);

  return {
    lower: Math.max(0, (center - spread) / denominator),
    upper: Math.min(1, (center + spread) / denominator),
  };
}

/**
 * Calculate Brier score - measures calibration quality
 * Lower is better: 0 = perfect, 0.25 = random guessing
 */
function calculateBrierScore(predictions: Array<{ probability: number; correct: boolean }>): number {
  if (predictions.length === 0) return 0;

  const sumSquaredError = predictions.reduce((sum, pred) => {
    const outcome = pred.correct ? 1 : 0;
    return sum + Math.pow(pred.probability - outcome, 2);
  }, 0);

  return sumSquaredError / predictions.length;
}

/**
 * Calculate log loss - alternative calibration metric
 * Lower is better, heavily penalizes confident wrong predictions
 */
function calculateLogLoss(predictions: Array<{ probability: number; correct: boolean }>): number {
  if (predictions.length === 0) return 0;

  const epsilon = 1e-15; // Prevent log(0)
  const sumLogLoss = predictions.reduce((sum, pred) => {
    const p = Math.max(epsilon, Math.min(1 - epsilon, pred.probability));
    const outcome = pred.correct ? 1 : 0;
    return sum - (outcome * Math.log(p) + (1 - outcome) * Math.log(1 - p));
  }, 0);

  return sumLogLoss / predictions.length;
}

export async function GET() {
  try {
    // Get all completed fights with predictions
    const completedFights = await prisma.fight.findMany({
      where: {
        winnerId: { not: null },
        predictions: { some: {} },
      },
      include: {
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        winner: { select: { id: true, name: true } },
        fighterA: { select: { id: true, name: true } },
        fighterB: { select: { id: true, name: true } },
        event: { select: { name: true, date: true } },
      },
      orderBy: { event: { date: 'desc' } },
    });

    let totalPredictions = 0;
    let correctPredictions = 0;
    let highConfidenceTotal = 0;
    let highConfidenceCorrect = 0;
    let medConfidenceTotal = 0;
    let medConfidenceCorrect = 0;
    let lowConfidenceTotal = 0;
    let lowConfidenceCorrect = 0;

    // Calibration buckets (10% increments from 50-100%)
    const calibrationBuckets: Record<string, { total: number; correct: number; sumProb: number }> = {
      '50-55': { total: 0, correct: 0, sumProb: 0 },
      '55-60': { total: 0, correct: 0, sumProb: 0 },
      '60-65': { total: 0, correct: 0, sumProb: 0 },
      '65-70': { total: 0, correct: 0, sumProb: 0 },
      '70-75': { total: 0, correct: 0, sumProb: 0 },
      '75-80': { total: 0, correct: 0, sumProb: 0 },
      '80-85': { total: 0, correct: 0, sumProb: 0 },
      '85-90': { total: 0, correct: 0, sumProb: 0 },
      '90-95': { total: 0, correct: 0, sumProb: 0 },
      '95-100': { total: 0, correct: 0, sumProb: 0 },
    };

    // All predictions for Brier/LogLoss calculation
    const allPredictions: Array<{ probability: number; correct: boolean }> = [];

    // Method accuracy tracking
    const methodAccuracy: Record<string, { predicted: number; correct: number }> = {
      KO: { predicted: 0, correct: 0 },
      SUB: { predicted: 0, correct: 0 },
      DEC: { predicted: 0, correct: 0 },
    };

    // Weight class accuracy
    const weightClassAccuracy: Record<string, { total: number; correct: number }> = {};

    // Rolling accuracy (last N fights)
    const rollingData: Array<{ date: string; correct: boolean; confidence: number }> = [];

    const recentResults: Array<{
      event: string;
      date: string;
      fighterA: string;
      fighterB: string;
      predictedWinner: string;
      actualWinner: string;
      correct: boolean;
      confidence: number;
      winProb: number;
    }> = [];

    for (const fight of completedFights) {
      const prediction = fight.predictions[0];

      if (!prediction || !fight.winnerId) continue;

      totalPredictions++;

      // Determine predicted winner
      const predictedWinnerId =
        prediction.fighterAWinProb > prediction.fighterBWinProb
          ? fight.fighterAId
          : fight.fighterBId;

      // Check if correct
      const isCorrect = predictedWinnerId === fight.winnerId;
      if (isCorrect) correctPredictions++;

      // Confidence tier (using the higher probability)
      const winProb = Math.max(prediction.fighterAWinProb, prediction.fighterBWinProb);

      // Add to all predictions for metrics
      allPredictions.push({ probability: winProb, correct: isCorrect });

      // Rolling data
      rollingData.push({
        date: fight.event.date.toISOString(),
        correct: isCorrect,
        confidence: prediction.confidence,
      });

      // Calibration bucket assignment
      const bucketKey = getBucketKey(winProb);
      if (bucketKey && calibrationBuckets[bucketKey]) {
        calibrationBuckets[bucketKey].total++;
        calibrationBuckets[bucketKey].sumProb += winProb;
        if (isCorrect) calibrationBuckets[bucketKey].correct++;
      }

      // Weight class tracking
      const wc = fight.weightClass || 'Unknown';
      if (!weightClassAccuracy[wc]) {
        weightClassAccuracy[wc] = { total: 0, correct: 0 };
      }
      weightClassAccuracy[wc].total++;
      if (isCorrect) weightClassAccuracy[wc].correct++;

      // Confidence tier tracking
      if (winProb >= 0.7) {
        highConfidenceTotal++;
        if (isCorrect) highConfidenceCorrect++;
      } else if (winProb >= 0.55) {
        medConfidenceTotal++;
        if (isCorrect) medConfidenceCorrect++;
      } else {
        lowConfidenceTotal++;
        if (isCorrect) lowConfidenceCorrect++;
      }

      // Add to recent results (last 20)
      if (recentResults.length < 20) {
        recentResults.push({
          event: fight.event.name,
          date: fight.event.date.toISOString(),
          fighterA: fight.fighterA.name,
          fighterB: fight.fighterB.name,
          predictedWinner:
            predictedWinnerId === fight.fighterAId
              ? fight.fighterA.name
              : fight.fighterB.name,
          actualWinner: fight.winner?.name || 'Draw/NC',
          correct: isCorrect,
          confidence: prediction.confidence,
          winProb: winProb,
        });
      }
    }

    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    const highConfidenceAccuracy =
      highConfidenceTotal > 0 ? highConfidenceCorrect / highConfidenceTotal : 0;
    const medConfidenceAccuracy =
      medConfidenceTotal > 0 ? medConfidenceCorrect / medConfidenceTotal : 0;
    const lowConfidenceAccuracy =
      lowConfidenceTotal > 0 ? lowConfidenceCorrect / lowConfidenceTotal : 0;

    // Calculate Wilson confidence interval for overall accuracy
    const wilsonCI = wilsonInterval(correctPredictions, totalPredictions);

    // Calculate calibration metrics
    const brierScore = calculateBrierScore(allPredictions);
    const logLoss = calculateLogLoss(allPredictions);

    // Format calibration data for chart
    const calibrationData = Object.entries(calibrationBuckets).map(([range, data]) => ({
      range,
      midpoint: getMidpoint(range),
      total: data.total,
      correct: data.correct,
      actualRate: data.total > 0 ? data.correct / data.total : 0,
      avgPredicted: data.total > 0 ? data.sumProb / data.total : getMidpoint(range) / 100,
      perfectCalibration: getMidpoint(range) / 100,
    }));

    // Calculate rolling accuracy (windows of 10, 20, 50)
    const rolling10 = calculateRollingAccuracy(rollingData.slice(0, 10));
    const rolling20 = calculateRollingAccuracy(rollingData.slice(0, 20));
    const rolling50 = calculateRollingAccuracy(rollingData.slice(0, 50));

    // Format weight class data
    const weightClassData = Object.entries(weightClassAccuracy)
      .map(([wc, data]) => ({
        weightClass: wc,
        total: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? data.correct / data.total : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      overall: {
        total: totalPredictions,
        correct: correctPredictions,
        accuracy: accuracy,
        accuracyPercent: (accuracy * 100).toFixed(1),
        confidenceInterval: {
          lower: (wilsonCI.lower * 100).toFixed(1),
          upper: (wilsonCI.upper * 100).toFixed(1),
        },
      },
      byConfidence: {
        high: {
          total: highConfidenceTotal,
          correct: highConfidenceCorrect,
          accuracy: highConfidenceAccuracy,
          accuracyPercent: (highConfidenceAccuracy * 100).toFixed(1),
        },
        medium: {
          total: medConfidenceTotal,
          correct: medConfidenceCorrect,
          accuracy: medConfidenceAccuracy,
          accuracyPercent: (medConfidenceAccuracy * 100).toFixed(1),
        },
        low: {
          total: lowConfidenceTotal,
          correct: lowConfidenceCorrect,
          accuracy: lowConfidenceAccuracy,
          accuracyPercent: (lowConfidenceAccuracy * 100).toFixed(1),
        },
      },
      calibration: {
        brierScore: brierScore.toFixed(4),
        brierRating: getBrierRating(brierScore),
        logLoss: logLoss.toFixed(4),
        data: calibrationData,
      },
      rolling: {
        last10: rolling10,
        last20: rolling20,
        last50: rolling50,
      },
      byWeightClass: weightClassData,
      recentResults,
    });
  } catch (error) {
    console.error('Error fetching accuracy stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accuracy stats' },
      { status: 500 }
    );
  }
}

function getBucketKey(prob: number): string | null {
  if (prob >= 0.95) return '95-100';
  if (prob >= 0.90) return '90-95';
  if (prob >= 0.85) return '85-90';
  if (prob >= 0.80) return '80-85';
  if (prob >= 0.75) return '75-80';
  if (prob >= 0.70) return '70-75';
  if (prob >= 0.65) return '65-70';
  if (prob >= 0.60) return '60-65';
  if (prob >= 0.55) return '55-60';
  if (prob >= 0.50) return '50-55';
  return null;
}

function getMidpoint(range: string): number {
  const [low, high] = range.split('-').map(Number);
  return (low + high) / 2;
}

function calculateRollingAccuracy(data: Array<{ correct: boolean }>): {
  total: number;
  correct: number;
  accuracy: number;
  accuracyPercent: string;
} {
  const total = data.length;
  const correct = data.filter(d => d.correct).length;
  const accuracy = total > 0 ? correct / total : 0;
  return {
    total,
    correct,
    accuracy,
    accuracyPercent: (accuracy * 100).toFixed(1),
  };
}

function getBrierRating(brierScore: number): string {
  if (brierScore <= 0.1) return 'Excellent';
  if (brierScore <= 0.15) return 'Very Good';
  if (brierScore <= 0.2) return 'Good';
  if (brierScore <= 0.25) return 'Fair';
  return 'Needs Improvement';
}
