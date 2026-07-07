'use client';

import { useState, useEffect } from 'react';
import ConsensusPanel from './ConsensusPanel';
import ModelTab from './ModelTab';

interface FactorBreakdownItem {
  factor: string;
  displayName: string;
  fighterAValue: string;
  fighterBValue: string;
  impact: number;
  advantage: 'A' | 'B' | 'even';
  emoji: string;
}

interface ModelBreakdownItem {
  provider: string;
  modelId: string;
  pick: 'fighterA' | 'fighterB';
  fighter: string;
  confidenceLevel: string;
  winProbability: number;
  error?: string;
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
  // Multi-model consensus fields
  consensusType?: string | null;
  modelsAgree?: number;
  modelsTotal?: number;
  avgWinProbability?: number | null;
  modelBreakdown?: ModelBreakdownItem[] | null;
}

interface ModelAnalysisData {
  id: string;
  provider: string;
  modelId: string;
  matchupSummary: string;
  pickExplanation: string;
  keyFactorNarrative?: string | null;
  recommendedPick: string;
  recommendedFighter: string;
  winProbability: number;
  confidenceLevel: string;
  bettingInsight?: string | null;
  cautionFlags: string[];
  tokensUsed?: number | null;
  latencyMs?: number | null;
  error?: string | null;
}

interface MatchupAnalysisProps {
  fightId: string;
  fighterAName: string;
  fighterBName: string;
  compact?: boolean;
}

const providerLabels: Record<string, string> = {
  claude: 'Claude',
  openai: 'GPT-4o',
  gemini: 'Gemini',
};

const providerTabColors: Record<string, string> = {
  claude: 'border-orange-500 text-orange-400',
  openai: 'border-green-500 text-green-400',
  gemini: 'border-blue-500 text-blue-400',
};

export default function MatchupAnalysis({
  fightId,
  fighterAName,
  fighterBName,
  compact = false,
}: MatchupAnalysisProps) {
  const [analysis, setAnalysis] = useState<MatchupAnalysisData | null>(null);
  const [modelAnalyses, setModelAnalyses] = useState<ModelAnalysisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    fetchAnalysis();
  }, [fightId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try GET first
      const getRes = await fetch(`/api/fights/${fightId}/analysis`);
      if (getRes.ok) {
        const data = await getRes.json();
        setAnalysis(data.analysis);
        setModelAnalyses(data.modelAnalyses || []);
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
          setModelAnalyses(data.modelAnalyses || []);
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

  const hasMultiModel = analysis.modelBreakdown && analysis.modelBreakdown.length > 1;
  const hasModelTabs = modelAnalyses.length > 0;

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

  // Determine header text
  const modelCount = analysis.modelsTotal || 1;
  const headerText = modelCount > 1
    ? `AI Analysis (${modelCount} Models)`
    : 'AI Analysis (Claude)';
  const headerSubtext = modelCount > 1
    ? 'Multi-model consensus analysis'
    : 'LLM-based qualitative analysis';

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 hover:bg-[#252525] transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-gray-300 font-medium">{headerText}</span>
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
              <h3 className="text-white font-semibold">{headerText}</h3>
              <p className="text-gray-500 text-xs">{headerSubtext}</p>
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
        {/* Consensus Panel - only show when multiple models */}
        {hasMultiModel && (
          <ConsensusPanel
            consensusType={analysis.consensusType || null}
            modelsAgree={analysis.modelsAgree || 1}
            modelsTotal={analysis.modelsTotal || 1}
            avgWinProbability={analysis.avgWinProbability || null}
            modelBreakdown={analysis.modelBreakdown || null}
            fighterAName={fighterAName}
            fighterBName={fighterBName}
          />
        )}

        {/* Tab Navigation - show when multiple model analyses exist */}
        {hasModelTabs && (
          <div className="flex border-b border-[#3a3a3a] -mx-4 px-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#d20a0a] text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            {modelAnalyses.map((ma) => (
              <button
                key={ma.provider}
                onClick={() => setActiveTab(ma.provider)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === ma.provider
                    ? `${providerTabColors[ma.provider] || 'border-gray-400 text-gray-300'}`
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {providerLabels[ma.provider] || ma.provider}
                {ma.error && ' ❌'}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {activeTab !== 'overview' && hasModelTabs ? (
          <ModelTab
            analysis={modelAnalyses.find(m => m.provider === activeTab)!}
            fighterAName={fighterAName}
            fighterBName={fighterBName}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
