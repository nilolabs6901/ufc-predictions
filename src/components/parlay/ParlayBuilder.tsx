'use client';

import { useState, useEffect } from 'react';

interface ParlayLeg {
  fightId: string;
  fighterAName: string;
  fighterBName: string;
  selectionType: 'moneyline';
  selection: string;
  odds: number;
  modelProb: number;
  impliedProb: number;
  trainingCamp?: string;
  weightClass?: string;
}

interface ParlayCorrelation {
  leg1Index: number;
  leg2Index: number;
  correlationType: string;
  correlationValue: number;
  description: string;
}

interface ParlayAnalysis {
  legs: ParlayLeg[];
  naiveProbability: number;
  adjustedProbability: number;
  totalOdds: number;
  expectedValue: number;
  kellyStake: number;
  variance: number;
  sharpeRatio: number;
  correlations: ParlayCorrelation[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface Fight {
  id: string;
  fighterA: {
    name: string;
    trainingCamp?: string;
  };
  fighterB: {
    name: string;
    trainingCamp?: string;
  };
  fighterAOdds: number | null;
  fighterBOdds: number | null;
  weightClass: string;
  prediction?: {
    fighterAWinProb: number;
    fighterBWinProb: number;
  };
}

interface ParlayBuilderProps {
  fights: Fight[];
}

export default function ParlayBuilder({ fights }: ParlayBuilderProps) {
  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [analysis, setAnalysis] = useState<ParlayAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [stake, setStake] = useState(100);

  useEffect(() => {
    if (legs.length >= 2) {
      analyzeParlay();
    } else {
      setAnalysis(null);
    }
  }, [legs]);

  async function analyzeParlay() {
    setLoading(true);
    try {
      const response = await fetch('/api/parlay/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs }),
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to analyze parlay:', error);
    }
    setLoading(false);
  }

  function addLeg(fight: Fight, selection: 'A' | 'B') {
    const isA = selection === 'A';
    const odds = isA ? (fight.fighterAOdds || -110) : (fight.fighterBOdds || -110);
    const modelProb = fight.prediction
      ? (isA ? fight.prediction.fighterAWinProb : fight.prediction.fighterBWinProb)
      : 0.5;

    // Calculate implied probability from odds
    const impliedProb = odds < 0
      ? Math.abs(odds) / (Math.abs(odds) + 100)
      : 100 / (odds + 100);

    const newLeg: ParlayLeg = {
      fightId: fight.id,
      fighterAName: fight.fighterA.name,
      fighterBName: fight.fighterB.name,
      selectionType: 'moneyline',
      selection: isA ? fight.fighterA.name : fight.fighterB.name,
      odds,
      modelProb,
      impliedProb,
      trainingCamp: isA ? fight.fighterA.trainingCamp : fight.fighterB.trainingCamp,
      weightClass: fight.weightClass,
    };

    setLegs([...legs, newLeg]);
  }

  function removeLeg(index: number) {
    setLegs(legs.filter((_, i) => i !== index));
  }

  function clearAll() {
    setLegs([]);
    setAnalysis(null);
  }

  const potentialPayout = analysis
    ? stake * analysis.totalOdds
    : 0;

  const riskColors: Record<string, string> = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    extreme: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Fight Selection */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-4">Available Fights</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {fights.map(fight => {
            const alreadyAdded = legs.some(l => l.fightId === fight.id);
            const aProb = fight.prediction?.fighterAWinProb || 0.5;
            const bProb = fight.prediction?.fighterBWinProb || 0.5;

            return (
              <div
                key={fight.id}
                className={`p-3 rounded-lg border transition-colors ${
                  alreadyAdded
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-xs text-gray-500 mb-2">{fight.weightClass}</div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => addLeg(fight, 'A')}
                    disabled={alreadyAdded}
                    className="flex-1 text-left p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="font-bold text-white">{fight.fighterA.name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={fight.fighterAOdds && fight.fighterAOdds < 0 ? 'text-green-400' : 'text-red-400'}>
                        {fight.fighterAOdds ? (fight.fighterAOdds > 0 ? `+${fight.fighterAOdds}` : fight.fighterAOdds) : '--'}
                      </span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">{(aProb * 100).toFixed(0)}%</span>
                    </div>
                  </button>

                  <span className="text-gray-600 text-sm">vs</span>

                  <button
                    onClick={() => addLeg(fight, 'B')}
                    disabled={alreadyAdded}
                    className="flex-1 text-right p-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="font-bold text-white">{fight.fighterB.name}</div>
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-gray-400">{(bProb * 100).toFixed(0)}%</span>
                      <span className="text-gray-500">|</span>
                      <span className={fight.fighterBOdds && fight.fighterBOdds < 0 ? 'text-green-400' : 'text-red-400'}>
                        {fight.fighterBOdds ? (fight.fighterBOdds > 0 ? `+${fight.fighterBOdds}` : fight.fighterBOdds) : '--'}
                      </span>
                    </div>
                  </button>
                </div>

                {fight.prediction && (
                  <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                      style={{ width: `${aProb * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Parlay Slip */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Your Parlay ({legs.length} leg{legs.length !== 1 ? 's' : ''})
          </h3>
          {legs.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          )}
        </div>

        {legs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🎰</div>
            <p>Click on a fighter to add them to your parlay</p>
            <p className="text-sm mt-1">Minimum 2 legs required</p>
          </div>
        ) : (
          <>
            {/* Selected Legs */}
            <div className="space-y-2 mb-4">
              {legs.map((leg, idx) => {
                const edge = ((leg.modelProb - leg.impliedProb) * 100).toFixed(1);
                const hasEdge = leg.modelProb > leg.impliedProb;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white">{leg.selection}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={leg.odds < 0 ? 'text-green-400' : 'text-red-400'}>
                          {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                        </span>
                        <span>•</span>
                        <span>Model: {(leg.modelProb * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span className={hasEdge ? 'text-green-400' : 'text-red-400'}>
                          Edge: {hasEdge ? '+' : ''}{edge}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLeg(idx)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stake Input */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Stake Amount ($)</label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                min={1}
              />
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="border-t border-gray-700 pt-4 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Win Probability</div>
                    <div className="text-xl font-bold text-white">
                      {(analysis.adjustedProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Total Odds</div>
                    <div className="text-xl font-bold text-green-400">
                      +{((analysis.totalOdds - 1) * 100).toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Expected Value</div>
                    <div className={`text-xl font-bold ${analysis.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.expectedValue >= 0 ? '+' : ''}{(analysis.expectedValue * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Risk Level</div>
                    <div className={`text-xl font-bold capitalize ${riskColors[analysis.riskLevel].split(' ')[0]}`}>
                      {analysis.riskLevel}
                    </div>
                  </div>
                </div>

                {/* Potential Payout */}
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm text-green-400">Potential Payout</div>
                  <div className="text-3xl font-bold text-white">
                    ${potentialPayout.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Profit: ${(potentialPayout - stake).toFixed(2)}
                  </div>
                </div>

                {/* Kelly Stake */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Recommended Stake (Quarter Kelly)</div>
                  <div className="text-lg font-bold text-white">
                    {(analysis.kellyStake * 100).toFixed(1)}% of bankroll
                  </div>
                </div>

                {/* Correlations */}
                {analysis.correlations.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400">⚠️</span>
                      <span className="font-bold text-yellow-400">Correlations Detected</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {analysis.correlations.map((corr, idx) => (
                        <li key={idx}>• {corr.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-sm text-gray-300">{rec}</p>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4 text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2" />
                Analyzing parlay...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
