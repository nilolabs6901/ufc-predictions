'use client';

import { useState, useEffect } from 'react';

interface FactorBreakdownItem {
  factor: string;
  displayName: string;
  fighterAValue: string;
  fighterBValue: string;
  impact: number;
  advantage: 'A' | 'B' | 'even';
  emoji: string;
}

interface MatchupAnalysisData {
  id: string;
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string;
  recommendedPick: 'fighterA' | 'fighterB';
  recommendedFighter: string;
  winProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  factorBreakdown: FactorBreakdownItem[];
  bettingInsight?: string;
  cautionFlags: string[];
}

interface MatchupAnalysisProps {
  fightId: string;
  fighterAName: string;
  fighterBName: string;
  compact?: boolean;
}

export default function MatchupAnalysis({
  fightId,
  fighterAName,
  fighterBName,
  compact = false,
}: MatchupAnalysisProps) {
  const [analysis, setAnalysis] = useState<MatchupAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    fetchAnalysis();
  }, [fightId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try GET first (using [id] route parameter)
      const getRes = await fetch(`/api/fights/${fightId}/analysis`);
      if (getRes.ok) {
        const data = await getRes.json();
        setAnalysis(data.analysis);
        return;
      }

      // If not found, generate via POST
      if (getRes.status === 404) {
        const postRes = await fetch(`/api/fights/${fightId}/analysis`, {
          method: 'POST',
        });

        if (postRes.ok) {
          const data = await postRes.json();
          setAnalysis(data.analysis);
          return;
        }

        const errorData = await postRes.json();
        setError(errorData.error || 'Failed to generate analysis');
      }
    } catch (err) {
      setError('Failed to load analysis');
      console.error('Analysis fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d20a0a]" />
          <span className="text-gray-400 text-sm">Generating AI analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const confidenceColors = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-orange-400',
  };

  const getAdvantageColor = (advantage: 'A' | 'B' | 'even') => {
    if (advantage === 'A') return 'text-blue-400';
    if (advantage === 'B') return 'text-red-400';
    return 'text-gray-400';
  };

  const getAdvantageName = (advantage: 'A' | 'B' | 'even') => {
    if (advantage === 'A') return fighterAName;
    if (advantage === 'B') return fighterBName;
    return 'Even';
  };

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#252525] transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-gray-300 font-medium">AI Analysis</span>
            <span className={`text-xs uppercase ${confidenceColors[analysis.confidenceLevel]}`}>
              {analysis.confidenceLevel} confidence
            </span>
          </div>
          <span className="text-gray-500 text-sm">Click to expand</span>
        </div>
        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{analysis.matchupSummary}</p>
      </button>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#d20a0a]/20 to-transparent border-b border-[#3a3a3a] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="text-white font-semibold">AI Analysis (Claude)</h3>
              <p className="text-gray-500 text-xs">LLM-based qualitative analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${confidenceColors[analysis.confidenceLevel]}`}>
              {analysis.confidenceLevel.toUpperCase()} Confidence
            </span>
            {compact && (
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Collapse
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Pick Banner */}
        <div className="bg-gradient-to-r from-[#d20a0a]/30 to-[#d20a0a]/10 border border-[#d20a0a]/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-sm">Recommended Pick</span>
              <p className="text-white font-bold text-lg">{analysis.recommendedFighter}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-sm">Win Probability</span>
              <p className="text-[#d20a0a] font-bold text-lg">
                {(analysis.winProbability * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Matchup Summary */}
        <div>
          <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Matchup Overview</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.matchupSummary}</p>
        </div>

        {/* Pick Explanation */}
        <div>
          <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Why This Pick</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.pickExplanation}</p>
        </div>

        {/* Key Factor Narrative */}
        {analysis.keyFactorNarrative && (
          <div>
            <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Key Factor</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.keyFactorNarrative}</p>
          </div>
        )}

        {/* Factor Breakdown */}
        <div>
          <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-3">Factor Breakdown</h4>
          <div className="space-y-2">
            {analysis.factorBreakdown.slice(0, 6).map((factor, idx) => (
              <div
                key={idx}
                className="bg-[#252525] rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{factor.emoji}</span>
                  <span className="text-gray-300 font-medium">{factor.displayName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-blue-400 text-sm">{factor.fighterAValue}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="text-red-400 text-sm">{factor.fighterBValue}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${getAdvantageColor(factor.advantage)} bg-black/30`}
                  >
                    {getAdvantageName(factor.advantage)}{' '}
                    {factor.impact !== 0 && `+${Math.abs(factor.impact).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Betting Insight */}
        {analysis.bettingInsight && (
          <div className="bg-[#252525] border-l-4 border-yellow-500/50 rounded-r-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">💡</span>
              <div>
                <h4 className="text-yellow-500 text-xs uppercase tracking-wide mb-1">
                  Betting Insight
                </h4>
                <p className="text-gray-300 text-sm">{analysis.bettingInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Caution Flags */}
        {analysis.cautionFlags.length > 0 && (
          <div className="bg-[#252525] border-l-4 border-orange-500/50 rounded-r-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-orange-500">⚠️</span>
              <div>
                <h4 className="text-orange-500 text-xs uppercase tracking-wide mb-1">
                  Risk Factors
                </h4>
                <ul className="space-y-1">
                  {analysis.cautionFlags.map((flag, idx) => (
                    <li key={idx} className="text-gray-300 text-sm">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
