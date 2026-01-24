'use client';

interface FighterStats {
  slpm: number;
  strAcc: number;
  sapm: number;
  strDef: number;
  tdAvg: number;
  tdAcc: number;
  tdDef: number;
  subAvg: number;
}

interface FighterStatsCardProps {
  name: string;
  nickname?: string | null;
  imageUrl?: string | null;
  record: string;
  stance?: string | null;
  height?: number | null;
  reach?: number | null;
  fightingStyle?: string | null;
  currentRank?: number | null;
  isChampion?: boolean;
  currentStreak?: number | null;
  stats?: FighterStats | null;
  winByKO?: number;
  winByTKO?: number;
  winBySub?: number;
  winByDec?: number;
  wins: number;
  losses: number;
  draws: number;
}

function StatBar({ label, value, max = 100, color = 'red' }: { label: string; value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-gray-400 text-xs">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || 'bg-red-500'} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-right text-white font-mono text-xs">{value.toFixed(1)}</span>
    </div>
  );
}

function WinMethodChart({ ko, tko, sub, dec, total }: { ko: number; tko: number; sub: number; dec: number; total: number }) {
  if (total === 0) return null;

  const koPercent = ((ko + tko) / total) * 100;
  const subPercent = (sub / total) * 100;
  const decPercent = (dec / total) * 100;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 uppercase tracking-wide">Win Methods</div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-700">
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${koPercent}%` }}
          title={`KO/TKO: ${ko + tko}`}
        />
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${subPercent}%` }}
          title={`Submission: ${sub}`}
        />
        <div
          className="bg-yellow-500 transition-all duration-500"
          style={{ width: `${decPercent}%` }}
          title={`Decision: ${dec}`}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          KO/TKO {ko + tko}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          SUB {sub}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          DEC {dec}
        </span>
      </div>
    </div>
  );
}

export default function FighterStatsCard({
  name,
  nickname,
  imageUrl,
  record,
  stance,
  height,
  reach,
  fightingStyle,
  currentRank,
  isChampion,
  currentStreak,
  stats,
  winByKO = 0,
  winByTKO = 0,
  winBySub = 0,
  winByDec = 0,
  wins,
}: FighterStatsCardProps) {
  const formatHeight = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  const formatReach = (cm: number) => `${Math.round(cm / 2.54)}"`;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-20 h-20 rounded-lg object-cover bg-gray-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
            🥊
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isChampion && <span className="text-yellow-400">🏆</span>}
            {currentRank && !isChampion && (
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">#{currentRank}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          {nickname && <p className="text-sm text-gray-400">"{nickname}"</p>}
          <p className="text-xl font-bold text-red-500">{record}</p>
        </div>
      </div>

      {/* Physical Attributes */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {height && (
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-400">Height</div>
            <div className="font-bold text-white">{formatHeight(height)}</div>
          </div>
        )}
        {reach && (
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-400">Reach</div>
            <div className="font-bold text-white">{formatReach(reach)}</div>
          </div>
        )}
        {stance && (
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-400">Stance</div>
            <div className="font-bold text-white capitalize">{stance}</div>
          </div>
        )}
      </div>

      {/* Style & Streak */}
      <div className="flex items-center justify-between">
        {fightingStyle && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            fightingStyle === 'Striker' ? 'bg-red-500/20 text-red-400' :
            fightingStyle === 'Grappler' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {fightingStyle}
          </span>
        )}
        {currentStreak !== null && currentStreak !== undefined && currentStreak !== 0 && (
          <span className={`text-sm font-medium ${
            currentStreak > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {currentStreak > 0 ? `${currentStreak}W Streak` : `${Math.abs(currentStreak)}L Streak`}
          </span>
        )}
      </div>

      {/* Win Methods */}
      <WinMethodChart
        ko={winByKO}
        tko={winByTKO}
        sub={winBySub}
        dec={winByDec}
        total={wins}
      />

      {/* Detailed Stats */}
      {stats && (
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">Performance Stats</div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <StatBar label="SLpM" value={stats.slpm} max={10} color="red" />
            <StatBar label="Str Acc" value={stats.strAcc} max={100} color="red" />
            <StatBar label="SApM" value={stats.sapm} max={10} color="yellow" />
            <StatBar label="Str Def" value={stats.strDef} max={100} color="green" />
            <StatBar label="TD Avg" value={stats.tdAvg} max={8} color="blue" />
            <StatBar label="TD Acc" value={stats.tdAcc} max={100} color="blue" />
            <StatBar label="TD Def" value={stats.tdDef} max={100} color="green" />
            <StatBar label="Sub Avg" value={stats.subAvg} max={3} color="blue" />
          </div>
        </div>
      )}
    </div>
  );
}
