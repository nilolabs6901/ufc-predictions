'use client';

interface MethodBreakdownProps {
  fighterAName: string;
  fighterBName: string;
  fighterAByKO: number;
  fighterAByTKO: number;
  fighterABySub: number;
  fighterAByDec: number;
  fighterBByKO: number;
  fighterBByTKO: number;
  fighterBBySub: number;
  fighterBByDec: number;
  compact?: boolean;
}

interface MethodBarProps {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
}

function MethodBar({ label, value, color, maxValue = 0.5 }: MethodBarProps) {
  const percentage = Math.round(value * 100);
  const barWidth = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-4 bg-[#1a1a1a] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-700 ease-out method-bar-animate"
          style={{
            width: `${barWidth}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-300 w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

export default function MethodBreakdown({
  fighterAName,
  fighterBName,
  fighterAByKO,
  fighterAByTKO,
  fighterABySub,
  fighterAByDec,
  fighterBByKO,
  fighterBByTKO,
  fighterBBySub,
  fighterBByDec,
  compact = false,
}: MethodBreakdownProps) {
  const aKO = fighterAByKO + fighterAByTKO;
  const bKO = fighterBByKO + fighterBByTKO;
  const maxValue = Math.max(aKO, fighterABySub, fighterAByDec, bKO, fighterBBySub, fighterBByDec, 0.3);

  const getLastName = (name: string) => name.split(' ').pop() || name;

  if (compact) {
    return (
      <div className="flex gap-4 text-xs">
        <div className="flex-1">
          <div className="text-gray-400 mb-1 font-medium">{getLastName(fighterAName)}</div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              KO {Math.round(aKO * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
              SUB {Math.round(fighterABySub * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
              DEC {Math.round(fighterAByDec * 100)}%
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-gray-400 mb-1 font-medium text-right">{getLastName(fighterBName)}</div>
          <div className="flex gap-2 justify-end">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              KO {Math.round(bKO * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
              SUB {Math.round(fighterBBySub * 100)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
              DEC {Math.round(fighterBByDec * 100)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Fighter A */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-3">
          {getLastName(fighterAName)} wins by...
        </div>
        <div className="space-y-2">
          <MethodBar
            label="KO"
            value={aKO}
            color="linear-gradient(90deg, #dc2626, #ef4444)"
            maxValue={maxValue}
          />
          <MethodBar
            label="SUB"
            value={fighterABySub}
            color="linear-gradient(90deg, #2563eb, #3b82f6)"
            maxValue={maxValue}
          />
          <MethodBar
            label="DEC"
            value={fighterAByDec}
            color="linear-gradient(90deg, #4b5563, #6b7280)"
            maxValue={maxValue}
          />
        </div>
      </div>

      {/* Fighter B */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-3 text-right">
          {getLastName(fighterBName)} wins by...
        </div>
        <div className="space-y-2">
          <MethodBar
            label="KO"
            value={bKO}
            color="linear-gradient(90deg, #dc2626, #ef4444)"
            maxValue={maxValue}
          />
          <MethodBar
            label="SUB"
            value={fighterBBySub}
            color="linear-gradient(90deg, #2563eb, #3b82f6)"
            maxValue={maxValue}
          />
          <MethodBar
            label="DEC"
            value={fighterBByDec}
            color="linear-gradient(90deg, #4b5563, #6b7280)"
            maxValue={maxValue}
          />
        </div>
      </div>
    </div>
  );
}
