'use client';

import { useEffect, useState } from 'react';

interface AccuracyData {
  overall: {
    total: number;
    correct: number;
    accuracy: number;
    accuracyPercent: string;
  };
  byConfidence: {
    high: { total: number; correct: number; accuracyPercent: string };
    medium: { total: number; correct: number; accuracyPercent: string };
    low: { total: number; correct: number; accuracyPercent: string };
  };
  recentResults: Array<{
    event: string;
    date: string;
    fighterA: string;
    fighterB: string;
    predictedWinner: string;
    actualWinner: string;
    correct: boolean;
    confidence: number;
    winProb: number;
  }>;
}

function CircularProgress({ value, size = 120, strokeWidth = 10, color = '#ef4444' }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{value.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ConfidenceTier({ label, total, correct, accuracyPercent, color }: {
  label: string;
  total: number;
  correct: number;
  accuracyPercent: string;
  color: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <div className={`text-xs uppercase tracking-wide mb-1 ${color}`}>{label}</div>
      <div className="text-xl font-bold text-white">{accuracyPercent}%</div>
      <div className="text-xs text-gray-400">{correct}/{total} correct</div>
    </div>
  );
}

export default function AccuracyTracker() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccuracy() {
      try {
        const response = await fetch('/api/accuracy');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Failed to load accuracy data');
      } finally {
        setLoading(false);
      }
    }

    fetchAccuracy();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4" />
        <div className="h-32 bg-gray-700 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Prediction Accuracy</h3>
        <p className="text-gray-400">No completed predictions yet. Check back after fights are decided!</p>
      </div>
    );
  }

  const { overall, byConfidence, recentResults } = data;

  // If no predictions yet, show a placeholder
  if (overall.total === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> Prediction Accuracy
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-400 mb-2">No completed predictions yet</p>
          <p className="text-sm text-gray-500">
            Accuracy tracking will begin once fight results are recorded
          </p>
        </div>

        {/* Show mock/expected accuracy based on model design */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Model Performance Target</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-green-400 text-xs uppercase">High Conf</div>
              <div className="text-lg font-bold text-white">70%+</div>
              <div className="text-xs text-gray-500">target</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-yellow-400 text-xs uppercase">Med Conf</div>
              <div className="text-lg font-bold text-white">60%+</div>
              <div className="text-xs text-gray-500">target</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-red-400 text-xs uppercase">Overall</div>
              <div className="text-lg font-bold text-white">55%+</div>
              <div className="text-xs text-gray-500">target</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span>📊</span> Prediction Accuracy
      </h3>

      {/* Overall Accuracy */}
      <div className="flex items-center justify-center mb-6">
        <CircularProgress
          value={overall.accuracy * 100}
          size={140}
          strokeWidth={12}
          color={overall.accuracy >= 0.6 ? '#22c55e' : overall.accuracy >= 0.5 ? '#eab308' : '#ef4444'}
        />
      </div>

      <div className="text-center mb-6">
        <div className="text-sm text-gray-400">
          {overall.correct} of {overall.total} predictions correct
        </div>
      </div>

      {/* By Confidence */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ConfidenceTier
          label="High (70%+)"
          total={byConfidence.high.total}
          correct={byConfidence.high.correct}
          accuracyPercent={byConfidence.high.accuracyPercent}
          color="text-green-400"
        />
        <ConfidenceTier
          label="Medium"
          total={byConfidence.medium.total}
          correct={byConfidence.medium.correct}
          accuracyPercent={byConfidence.medium.accuracyPercent}
          color="text-yellow-400"
        />
        <ConfidenceTier
          label="Low (<55%)"
          total={byConfidence.low.total}
          correct={byConfidence.low.correct}
          accuracyPercent={byConfidence.low.accuracyPercent}
          color="text-red-400"
        />
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Recent Predictions</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentResults.slice(0, 5).map((result, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  result.correct ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={result.correct ? 'text-green-400' : 'text-red-400'}>
                    {result.correct ? '✓' : '✗'}
                  </span>
                  <span className="text-sm text-white">
                    {result.fighterA} vs {result.fighterB}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {(result.winProb * 100).toFixed(0)}% conf
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
