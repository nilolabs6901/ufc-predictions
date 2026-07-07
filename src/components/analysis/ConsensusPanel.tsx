'use client';

interface ModelBreakdownItem {
  provider: string;
  modelId: string;
  pick: 'fighterA' | 'fighterB';
  fighter: string;
  confidenceLevel: string;
  winProbability: number;
  error?: string;
}

interface ConsensusPanelProps {
  consensusType: string | null;
  modelsAgree: number;
  modelsTotal: number;
  avgWinProbability: number | null;
  modelBreakdown: ModelBreakdownItem[] | null;
  fighterAName: string;
  fighterBName: string;
}

const providerLabels: Record<string, string> = {
  claude: 'Claude',
  openai: 'GPT-4o',
  gemini: 'Gemini',
};

const providerColors: Record<string, { bg: string; text: string; border: string }> = {
  claude: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  openai: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  gemini: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const consensusColors: Record<string, { border: string; bg: string; text: string; label: string }> = {
  unanimous: { border: 'border-green-500/50', bg: 'bg-green-500/5', text: 'text-green-400', label: 'UNANIMOUS' },
  majority: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/5', text: 'text-yellow-400', label: 'MAJORITY' },
  split: { border: 'border-red-500/50', bg: 'bg-red-500/5', text: 'text-red-400', label: 'SPLIT' },
};

export default function ConsensusPanel({
  consensusType,
  modelsAgree,
  modelsTotal,
  avgWinProbability,
  modelBreakdown,
  fighterAName,
  fighterBName,
}: ConsensusPanelProps) {
  if (!modelBreakdown || modelBreakdown.length <= 1) return null;

  const style = consensusColors[consensusType || 'split'] || consensusColors.split;
  const successfulModels = modelBreakdown.filter(m => !m.error);

  // Find consensus pick
  const picksA = successfulModels.filter(m => m.pick === 'fighterA');
  const picksB = successfulModels.filter(m => m.pick === 'fighterB');
  const consensusFighter = picksA.length >= picksB.length ? fighterAName : fighterBName;

  // Find dissenting models
  const majorityPick = picksA.length >= picksB.length ? 'fighterA' : 'fighterB';
  const dissenters = successfulModels.filter(m => m.pick !== majorityPick);

  return (
    <div className={`border ${style.border} ${style.bg} rounded-lg p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗳️</span>
          <span className="text-gray-300 font-semibold text-sm uppercase tracking-wide">
            AI Consensus
          </span>
        </div>
        <div className={`${style.text} text-sm font-bold`}>
          {modelsAgree}/{modelsTotal} {style.label}
        </div>
      </div>

      {/* Model Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {modelBreakdown.map((model) => {
          const colors = providerColors[model.provider] || providerColors.claude;
          const isAgreeing = !model.error && model.pick === majorityPick;
          const hasError = !!model.error;

          return (
            <div
              key={model.provider}
              className={`${colors.bg} border ${colors.border} rounded-lg px-3 py-2 flex-1 min-w-[120px]`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`${colors.text} font-medium text-sm`}>
                  {providerLabels[model.provider] || model.provider}
                </span>
                <span className="text-xs">
                  {hasError ? '❌' : isAgreeing ? '✓' : '✗'}
                </span>
              </div>
              {hasError ? (
                <p className="text-gray-500 text-xs">Unavailable</p>
              ) : (
                <>
                  <p className="text-white text-sm font-medium">{model.fighter}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 text-xs">
                      {(model.winProbability * 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs uppercase ${
                      model.confidenceLevel === 'high' ? 'text-green-400' :
                      model.confidenceLevel === 'medium' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {model.confidenceLevel}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Line */}
      <div className="text-gray-400 text-sm">
        {consensusType === 'unanimous' && (
          <span>
            All models pick <span className="text-white font-medium">{consensusFighter}</span>
            {avgWinProbability && (
              <span> (avg {(avgWinProbability * 100).toFixed(1)}%)</span>
            )}
          </span>
        )}
        {consensusType === 'majority' && (
          <span>
            Majority: <span className="text-white font-medium">{consensusFighter}</span>
            {dissenters.length > 0 && (
              <span className="text-yellow-400">
                {' '}| Dissent: {dissenters.map(d => providerLabels[d.provider] || d.provider).join(', ')}
              </span>
            )}
          </span>
        )}
        {consensusType === 'split' && (
          <span className="text-red-400">
            Models are split — no clear consensus
          </span>
        )}
      </div>
    </div>
  );
}
