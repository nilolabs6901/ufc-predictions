'use client';

import { useState, useEffect } from 'react';

interface CalibrationData {
  range: string;
  midpoint: number;
  total: number;
  correct: number;
  actualRate: number;
  avgPredicted: number;
  perfectCalibration: number;
}

interface WeightClassData {
  weightClass: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface RecentResult {
  event: string;
  date: string;
  fighterA: string;
  fighterB: string;
  predictedWinner: string;
  actualWinner: string;
  correct: boolean;
  confidence: number;
  winProb: number;
}

interface AccuracyData {
  overall: {
    total: number;
    correct: number;
    accuracy: number;
    accuracyPercent: string;
    confidenceInterval: {
      lower: string;
      upper: string;
    };
  };
  byConfidence: {
    high: { total: number; correct: number; accuracy: number; accuracyPercent: string };
    medium: { total: number; correct: number; accuracy: number; accuracyPercent: string };
    low: { total: number; correct: number; accuracy: number; accuracyPercent: string };
  };
  calibration: {
    brierScore: string;
    brierRating: string;
    logLoss: string;
    data: CalibrationData[];
  };
  rolling: {
    last10: { total: number; correct: number; accuracy: number; accuracyPercent: string };
    last20: { total: number; correct: number; accuracy: number; accuracyPercent: string };
    last50: { total: number; correct: number; accuracy: number; accuracyPercent: string };
  };
  byWeightClass: WeightClassData[];
  recentResults: RecentResult[];
}

export default function AccuracyDashboard() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'calibration' | 'breakdown' | 'history'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accuracy');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch accuracy data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-800 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-800 rounded-xl"></div>
          <div className="h-24 bg-gray-800 rounded-xl"></div>
          <div className="h-24 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data || data.overall.total === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 border border-gray-700 rounded-xl">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-white mb-2">No Prediction Data Yet</h2>
        <p className="text-gray-400">Complete some events to see accuracy statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(['overview', 'calibration', 'breakdown', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'calibration' && 'Calibration'}
            {tab === 'breakdown' && 'Breakdown'}
            {tab === 'history' && 'History'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Overall Accuracy"
              value={`${data.overall.accuracyPercent}%`}
              subtext={`${data.overall.correct}/${data.overall.total} correct`}
              color="blue"
              large
            />
            <StatCard
              label="Confidence Interval"
              value={`${data.overall.confidenceInterval.lower}-${data.overall.confidenceInterval.upper}%`}
              subtext="95% CI (Wilson)"
              color="purple"
            />
            <StatCard
              label="Brier Score"
              value={data.calibration.brierScore}
              subtext={data.calibration.brierRating}
              color={getBrierColor(data.calibration.brierRating)}
            />
            <StatCard
              label="Log Loss"
              value={data.calibration.logLoss}
              subtext="Lower is better"
              color="gray"
            />
          </div>

          {/* Confidence Tier Performance */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Performance by Confidence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ConfidenceTierCard
                label="High Confidence (70%+)"
                data={data.byConfidence.high}
                color="green"
              />
              <ConfidenceTierCard
                label="Medium Confidence (55-70%)"
                data={data.byConfidence.medium}
                color="yellow"
              />
              <ConfidenceTierCard
                label="Low Confidence (<55%)"
                data={data.byConfidence.low}
                color="red"
              />
            </div>
          </div>

          {/* Rolling Performance */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Rolling Performance</h3>
            <div className="grid grid-cols-3 gap-4">
              <RollingCard label="Last 10" data={data.rolling.last10} />
              <RollingCard label="Last 20" data={data.rolling.last20} />
              <RollingCard label="Last 50" data={data.rolling.last50} />
            </div>
          </div>
        </div>
      )}

      {/* Calibration Tab */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          {/* Calibration Chart */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Calibration Chart</h3>
            <p className="text-sm text-gray-400 mb-6">
              A well-calibrated model should have actual win rates matching predicted probabilities.
              Points on the diagonal line indicate perfect calibration.
            </p>
            <CalibrationChart data={data.calibration.data} />
          </div>

          {/* Calibration Table */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Calibration Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Predicted Range</th>
                    <th className="text-center py-2 px-3">Predictions</th>
                    <th className="text-center py-2 px-3">Correct</th>
                    <th className="text-center py-2 px-3">Actual Rate</th>
                    <th className="text-center py-2 px-3">Expected</th>
                    <th className="text-center py-2 px-3">Calibration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.calibration.data.map(bucket => {
                    const diff = bucket.total > 0
                      ? (bucket.actualRate - bucket.perfectCalibration) * 100
                      : 0;
                    const calibrationStatus = Math.abs(diff) < 5 ? 'good' : Math.abs(diff) < 10 ? 'fair' : 'poor';

                    return (
                      <tr key={bucket.range} className="border-b border-gray-800">
                        <td className="py-2 px-3 text-white">{bucket.range}%</td>
                        <td className="py-2 px-3 text-center text-gray-300">{bucket.total}</td>
                        <td className="py-2 px-3 text-center text-gray-300">{bucket.correct}</td>
                        <td className="py-2 px-3 text-center text-white font-medium">
                          {bucket.total > 0 ? `${(bucket.actualRate * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">
                          {bucket.midpoint}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          {bucket.total > 0 ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              calibrationStatus === 'good' ? 'bg-green-900/50 text-green-400' :
                              calibrationStatus === 'fair' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calibration Explanation */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Understanding Calibration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Brier Score</h4>
                <p className="mb-2">
                  Measures overall calibration quality. Ranges from 0 (perfect) to 1 (worst).
                  Random guessing yields 0.25.
                </p>
                <ul className="space-y-1 text-gray-400">
                  <li>0.00 - 0.10: Excellent</li>
                  <li>0.10 - 0.15: Very Good</li>
                  <li>0.15 - 0.20: Good</li>
                  <li>0.20 - 0.25: Fair</li>
                  <li>&gt; 0.25: Needs Improvement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">What Good Calibration Means</h4>
                <p>
                  When the model predicts 70% win probability, that fighter should win approximately
                  70% of the time across many predictions. Over-confidence means winning less often
                  than predicted; under-confidence means winning more often.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {/* Weight Class Performance */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Performance by Weight Class</h3>
            <div className="space-y-3">
              {data.byWeightClass.map(wc => (
                <WeightClassBar key={wc.weightClass} data={wc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Predictions</h3>
          <div className="space-y-2">
            {data.recentResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  result.correct
                    ? 'bg-green-900/20 border-green-800'
                    : 'bg-red-900/20 border-red-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {result.fighterA} vs {result.fighterB}
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.event} - {new Date(result.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                      {result.correct ? 'CORRECT' : 'WRONG'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Predicted: {result.predictedWinner} ({(result.winProb * 100).toFixed(0)}%)
                    </div>
                    {!result.correct && (
                      <div className="text-xs text-gray-500">
                        Actual: {result.actualWinner}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
  large = false,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
  large?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-600 bg-blue-900/20',
    green: 'border-green-600 bg-green-900/20',
    yellow: 'border-yellow-600 bg-yellow-900/20',
    red: 'border-red-600 bg-red-900/20',
    purple: 'border-purple-600 bg-purple-900/20',
    gray: 'border-gray-600 bg-gray-900/20',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className={`font-bold text-white ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-gray-500 text-xs mt-1">{subtext}</div>
    </div>
  );
}

function ConfidenceTierCard({
  label,
  data,
  color,
}: {
  label: string;
  data: { total: number; correct: number; accuracy: number; accuracyPercent: string };
  color: 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-bold text-white">{data.accuracyPercent}%</span>
        <span className="text-gray-500 text-sm mb-1">{data.correct}/{data.total}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${data.accuracy * 100}%` }}
        />
      </div>
    </div>
  );
}

function RollingCard({
  label,
  data,
}: {
  label: string;
  data: { total: number; correct: number; accuracy: number; accuracyPercent: string };
}) {
  return (
    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{data.accuracyPercent}%</div>
      <div className="text-gray-500 text-xs">{data.correct}/{data.total}</div>
    </div>
  );
}

function CalibrationChart({ data }: { data: CalibrationData[] }) {
  const chartHeight = 300;
  const chartWidth = 500;
  const padding = 40;

  const filteredData = data.filter(d => d.total > 0);

  return (
    <div className="flex justify-center">
      <svg width={chartWidth} height={chartHeight} className="overflow-visible">
        {/* Background grid */}
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line
              x1={padding}
              y1={chartHeight - padding - (val / 100) * (chartHeight - 2 * padding)}
              x2={chartWidth - padding}
              y2={chartHeight - padding - (val / 100) * (chartHeight - 2 * padding)}
              stroke="#374151"
              strokeDasharray="4,4"
            />
            <text
              x={padding - 5}
              y={chartHeight - padding - (val / 100) * (chartHeight - 2 * padding) + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {val}%
            </text>
          </g>
        ))}

        {/* Diagonal perfect calibration line */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={padding}
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="8,4"
        />

        {/* X-axis labels */}
        {[50, 60, 70, 80, 90, 100].map(val => (
          <text
            key={val}
            x={padding + ((val - 50) / 50) * (chartWidth - 2 * padding)}
            y={chartHeight - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {val}%
          </text>
        ))}

        {/* Data points */}
        {filteredData.map((point, idx) => {
          const x = padding + ((point.midpoint - 50) / 50) * (chartWidth - 2 * padding);
          const y = chartHeight - padding - point.actualRate * (chartHeight - 2 * padding);
          const size = Math.max(6, Math.min(20, point.total * 2));

          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={size}
                fill="#ef4444"
                fillOpacity={0.7}
                stroke="#dc2626"
                strokeWidth={2}
              />
              <title>
                {point.range}%: {point.correct}/{point.total} ({(point.actualRate * 100).toFixed(1)}% actual)
              </title>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          className="text-sm fill-gray-400"
        >
          Predicted Probability
        </text>
        <text
          x={15}
          y={chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${chartHeight / 2})`}
          className="text-sm fill-gray-400"
        >
          Actual Win Rate
        </text>
      </svg>
    </div>
  );
}

function WeightClassBar({ data }: { data: WeightClassData }) {
  const accuracy = data.accuracy * 100;

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 text-sm text-gray-300 truncate">{data.weightClass}</div>
      <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            accuracy >= 60 ? 'bg-green-600' : accuracy >= 50 ? 'bg-yellow-600' : 'bg-red-600'
          }`}
          style={{ width: `${accuracy}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white drop-shadow">
            {accuracy.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="w-16 text-right text-xs text-gray-500">
        {data.correct}/{data.total}
      </div>
    </div>
  );
}

function getBrierColor(rating: string): string {
  switch (rating) {
    case 'Excellent': return 'green';
    case 'Very Good': return 'green';
    case 'Good': return 'yellow';
    case 'Fair': return 'yellow';
    default: return 'red';
  }
}
