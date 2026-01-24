'use client';

interface ProbabilityBarProps {
  fighterAProb: number;
  fighterBProb: number;
  fighterAName: string;
  fighterBName: string;
  predictedWinnerId: string;
  fighterAId: string;
  fighterBId: string;
  animate?: boolean;
}

export default function ProbabilityBar({
  fighterAProb,
  fighterBProb,
  fighterAName,
  fighterBName,
  predictedWinnerId,
  fighterAId,
  fighterBId,
  animate = true,
}: ProbabilityBarProps) {
  const aPercent = Math.round(fighterAProb * 100);
  const bPercent = Math.round(fighterBProb * 100);
  const isPredictedA = predictedWinnerId === fighterAId;
  const isPredictedB = predictedWinnerId === fighterBId;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Statistical Model</span>
      </div>
      {/* Labels */}
      <div className="flex justify-between items-center mb-2 text-sm">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isPredictedA ? 'text-green-400' : 'text-gray-300'}`}>
            {fighterAName.split(' ').pop()}
          </span>
          {isPredictedA && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
              PICK
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPredictedB && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
              PICK
            </span>
          )}
          <span className={`font-bold ${isPredictedB ? 'text-green-400' : 'text-gray-300'}`}>
            {fighterBName.split(' ').pop()}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-8 rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#3a3a3a]">
        {/* Fighter A side (left) */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
            animate ? 'probability-bar-animate-left' : ''
          }`}
          style={{
            width: `${aPercent}%`,
            background: isPredictedA
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : 'linear-gradient(90deg, #3a3a3a, #4a4a4a)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-start pl-3">
            <span className={`font-bold text-sm ${isPredictedA ? 'text-white' : 'text-gray-300'}`}>
              {aPercent}%
            </span>
          </div>
        </div>

        {/* Fighter B side (right) */}
        <div
          className={`absolute right-0 top-0 h-full transition-all duration-1000 ease-out ${
            animate ? 'probability-bar-animate-right' : ''
          }`}
          style={{
            width: `${bPercent}%`,
            background: isPredictedB
              ? 'linear-gradient(90deg, #22c55e, #16a34a)'
              : 'linear-gradient(90deg, #4a4a4a, #3a3a3a)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-end pr-3">
            <span className={`font-bold text-sm ${isPredictedB ? 'text-white' : 'text-gray-300'}`}>
              {bPercent}%
            </span>
          </div>
        </div>

        {/* Center divider */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-[#0d0d0d] transform -translate-x-1/2 z-10" />
      </div>

      {/* Prediction indicator */}
      <div className="flex justify-center mt-2">
        <div
          className={`text-xs px-3 py-1 rounded-full ${
            aPercent > bPercent
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : aPercent < bPercent
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
          }`}
        >
          {aPercent > bPercent
            ? `${fighterAName.split(' ').pop()} favored by ${aPercent - bPercent}%`
            : aPercent < bPercent
            ? `${fighterBName.split(' ').pop()} favored by ${bPercent - aPercent}%`
            : 'Even matchup'}
        </div>
      </div>
    </div>
  );
}
