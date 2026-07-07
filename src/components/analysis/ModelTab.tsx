'use client';

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

interface ModelTabProps {
  analysis: ModelAnalysisData;
  fighterAName: string;
  fighterBName: string;
}

const providerLabels: Record<string, string> = {
  claude: 'Claude Sonnet 4',
  openai: 'GPT-4o',
  gemini: 'Gemini 2.0 Flash',
};

const confidenceColors: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-orange-400',
};

export default function ModelTab({ analysis, fighterAName, fighterBName }: ModelTabProps) {
  if (analysis.error) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 text-sm">
          {providerLabels[analysis.provider] || analysis.provider} analysis unavailable
        </p>
        <p className="text-gray-600 text-xs mt-1">{analysis.error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Pick */}
      <div className="bg-gradient-to-r from-[#d20a0a]/20 to-transparent border border-[#d20a0a]/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs">Pick</span>
            <p className="text-white font-bold">{analysis.recommendedFighter}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-xs">Win Prob</span>
            <p className="text-[#d20a0a] font-bold">
              {(analysis.winProbability * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs uppercase ${confidenceColors[analysis.confidenceLevel] || 'text-gray-400'}`}>
              {analysis.confidenceLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div>
        <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-1">Matchup Overview</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{analysis.matchupSummary}</p>
      </div>

      {/* Explanation */}
      <div>
        <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-1">Why This Pick</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{analysis.pickExplanation}</p>
      </div>

      {/* Key Factor */}
      {analysis.keyFactorNarrative && (
        <div>
          <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-1">Key Factor</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.keyFactorNarrative}</p>
        </div>
      )}

      {/* Betting Insight */}
      {analysis.bettingInsight && (
        <div className="bg-[#252525] border-l-4 border-yellow-500/50 rounded-r-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-sm">💡</span>
            <p className="text-gray-300 text-sm">{analysis.bettingInsight}</p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-gray-600 text-xs pt-2 border-t border-[#2a2a2a]">
        <span>{providerLabels[analysis.provider] || analysis.modelId}</span>
        {analysis.latencyMs && <span>{(analysis.latencyMs / 1000).toFixed(1)}s</span>}
        {analysis.tokensUsed && <span>{analysis.tokensUsed} tokens</span>}
      </div>
    </div>
  );
}
