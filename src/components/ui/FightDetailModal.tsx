'use client';

import { useEffect, useState } from 'react';
import MatchupAnalysis from '../analysis/MatchupAnalysis';

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

interface Fighter {
  id: string;
  name: string;
  nickname: string | null;
  imageUrl: string | null;
  nationality: string | null;
  stance: string;
  height: number | null;
  reach: number | null;
  fightingStyle: string;
  trainingCamp: string | null;
  wins: number;
  losses: number;
  draws: number;
  winByKO: number;
  winByTKO: number;
  winBySub: number;
  winByDec: number;
  currentStreak: number;
  currentRank: number | null;
  isChampion: boolean;
  timesKOd: number;
  timesSubmitted: number;
  stats: FighterStats | null;
}

interface FightDetailModalProps {
  fightId: string;
  isOpen: boolean;
  onClose: () => void;
}

function StatComparison({
  label,
  valueA,
  valueB,
  higherIsBetter = true,
}: {
  label: string;
  valueA: number;
  valueB: number;
  higherIsBetter?: boolean;
}) {
  const aWins = higherIsBetter ? valueA > valueB : valueA < valueB;
  const bWins = higherIsBetter ? valueB > valueA : valueB < valueA;

  return (
    <div className="grid grid-cols-3 gap-2 items-center py-2 border-b border-gray-700/50">
      <div className={`text-right font-mono ${aWins ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
        {valueA.toFixed(1)}
      </div>
      <div className="text-center text-gray-400 text-xs uppercase">{label}</div>
      <div className={`text-left font-mono ${bWins ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
        {valueB.toFixed(1)}
      </div>
    </div>
  );
}

function FighterColumn({ fighter, isWinner }: { fighter: Fighter; isWinner: boolean }) {
  const formatHeight = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  return (
    <div className={`flex-1 p-4 ${isWinner ? 'bg-green-500/5' : ''}`}>
      <div className="flex flex-col items-center">
        {/* Photo */}
        <div className="relative w-24 h-24 mb-3 rounded-lg overflow-hidden bg-gray-700">
          {fighter.imageUrl ? (
            <img
              src={fighter.imageUrl}
              alt={fighter.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🥊</div>
          )}
          {isWinner && (
            <div className="absolute inset-0 border-2 border-green-500 rounded-lg" />
          )}
        </div>

        {/* Name */}
        <h3 className={`font-bold text-lg text-center ${isWinner ? 'text-green-400' : 'text-white'}`}>
          {fighter.name}
        </h3>
        {fighter.nickname && (
          <p className="text-gray-400 text-sm italic">"{fighter.nickname}"</p>
        )}

        {/* Record */}
        <p className="text-red-500 font-bold text-lg">
          {fighter.wins}-{fighter.losses}{fighter.draws > 0 ? `-${fighter.draws}` : ''}
        </p>

        {/* Camp */}
        {fighter.trainingCamp && (
          <p className="text-gray-500 text-xs mt-1">{fighter.trainingCamp}</p>
        )}

        {/* Physical */}
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          {fighter.height && <span>{formatHeight(fighter.height)}</span>}
          {fighter.reach && <span>{Math.round(fighter.reach / 2.54)}" reach</span>}
        </div>

        {/* Style */}
        <span className={`mt-2 px-2 py-0.5 rounded text-xs font-medium ${
          fighter.fightingStyle === 'Striker' ? 'bg-red-500/20 text-red-400' :
          fighter.fightingStyle === 'Grappler' ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {fighter.fightingStyle}
        </span>

        {/* Win Methods */}
        <div className="mt-3 w-full">
          <div className="text-xs text-gray-500 text-center mb-1">Win Methods</div>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
            <div
              className="bg-red-500"
              style={{ width: `${((fighter.winByKO + fighter.winByTKO) / fighter.wins) * 100}%` }}
              title={`KO/TKO: ${fighter.winByKO + fighter.winByTKO}`}
            />
            <div
              className="bg-blue-500"
              style={{ width: `${(fighter.winBySub / fighter.wins) * 100}%` }}
              title={`SUB: ${fighter.winBySub}`}
            />
            <div
              className="bg-yellow-500"
              style={{ width: `${(fighter.winByDec / fighter.wins) * 100}%` }}
              title={`DEC: ${fighter.winByDec}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>KO {fighter.winByKO + fighter.winByTKO}</span>
            <span>SUB {fighter.winBySub}</span>
            <span>DEC {fighter.winByDec}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FightDetailModal({ fightId, isOpen, onClose }: FightDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fightId) {
      setLoading(true);
      fetch(`/api/fights/${fightId}`)
        .then((res) => res.json())
        .then((result) => {
          setData(result.fight);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, fightId]);

  if (!isOpen) return null;

  const fight = data;
  const prediction = fight?.prediction;
  const fighterA = fight?.fighterA;
  const fighterB = fight?.fighterB;
  const predictedWinnerId = prediction
    ? prediction.fighterAWinProb > prediction.fighterBWinProb
      ? fighterA?.id
      : fighterB?.id
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-400 mt-4">Loading fight details...</p>
          </div>
        ) : fight ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900/30 to-gray-900 p-4 border-b border-gray-700">
              <div className="text-center">
                <div className="text-gray-400 text-sm">{fight.event?.name}</div>
                <div className="text-white font-bold text-lg">{fight.weightClass}</div>
                <div className="text-gray-500 text-sm">{fight.scheduledRounds} Rounds</div>
              </div>
            </div>

            {/* Fighters */}
            <div className="flex">
              <FighterColumn fighter={fighterA} isWinner={predictedWinnerId === fighterA?.id} />
              <div className="flex flex-col items-center justify-center px-4 py-6 bg-[#0d0d0d]">
                <div className="text-red-500 font-bold text-2xl">VS</div>
                {prediction && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-gray-500">Statistical Model</div>
                    <div className="text-green-400 font-bold">
                      {(Math.max(prediction.fighterAWinProb, prediction.fighterBWinProb) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
              <FighterColumn fighter={fighterB} isWinner={predictedWinnerId === fighterB?.id} />
            </div>

            {/* Stats Comparison */}
            {fighterA?.stats && fighterB?.stats && (
              <div className="p-4 border-t border-gray-700">
                <h4 className="text-white font-bold text-center mb-4">Stats Comparison</h4>
                <div className="max-w-md mx-auto">
                  <StatComparison
                    label="Str/Min"
                    valueA={fighterA.stats.slpm}
                    valueB={fighterB.stats.slpm}
                  />
                  <StatComparison
                    label="Str Acc %"
                    valueA={fighterA.stats.strAcc}
                    valueB={fighterB.stats.strAcc}
                  />
                  <StatComparison
                    label="Str Abs"
                    valueA={fighterA.stats.sapm}
                    valueB={fighterB.stats.sapm}
                    higherIsBetter={false}
                  />
                  <StatComparison
                    label="Str Def %"
                    valueA={fighterA.stats.strDef}
                    valueB={fighterB.stats.strDef}
                  />
                  <StatComparison
                    label="TD/15min"
                    valueA={fighterA.stats.tdAvg}
                    valueB={fighterB.stats.tdAvg}
                  />
                  <StatComparison
                    label="TD Acc %"
                    valueA={fighterA.stats.tdAcc}
                    valueB={fighterB.stats.tdAcc}
                  />
                  <StatComparison
                    label="TD Def %"
                    valueA={fighterA.stats.tdDef}
                    valueB={fighterB.stats.tdDef}
                  />
                  <StatComparison
                    label="Sub/15min"
                    valueA={fighterA.stats.subAvg}
                    valueB={fighterB.stats.subAvg}
                  />
                </div>
              </div>
            )}

            {/* Statistical Model Insights */}
            {prediction?.insights && prediction.insights.length > 0 && (
              <div className="p-4 border-t border-gray-700">
                <h4 className="text-white font-bold text-center mb-2">Statistical Model Insights</h4>
                <p className="text-gray-500 text-xs text-center mb-3">Based on weighted factor analysis</p>
                <div className="space-y-2">
                  {prediction.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-400">•</span>
                      <span className="text-gray-300">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis (Claude) - Different perspective from statistical model */}
            <div className="p-4 border-t border-gray-700">
              <div className="mb-3 text-center">
                <p className="text-gray-500 text-xs">
                  Note: AI Analysis may differ from Statistical Model — these are two independent perspectives
                </p>
              </div>
              <MatchupAnalysis
                fightId={fightId}
                fighterAName={fighterA?.name || 'Fighter A'}
                fighterBName={fighterB?.name || 'Fighter B'}
                compact={false}
              />
            </div>

            {/* Method Breakdown */}
            {prediction && (
              <div className="p-4 border-t border-gray-700">
                <h4 className="text-white font-bold text-center mb-3">Method Probability</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-center text-sm text-gray-400 mb-2">{fighterA.name}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-red-400">KO/TKO</span>
                        <span>{((prediction.fighterAByKO + prediction.fighterAByTKO) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Submission</span>
                        <span>{(prediction.fighterABySub * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-400">Decision</span>
                        <span>{(prediction.fighterAByDec * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-center text-sm text-gray-400 mb-2">{fighterB.name}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-red-400">KO/TKO</span>
                        <span>{((prediction.fighterBByKO + prediction.fighterBByTKO) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Submission</span>
                        <span>{(prediction.fighterBBySub * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-400">Decision</span>
                        <span>{(prediction.fighterBByDec * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-gray-400">Failed to load fight details</div>
        )}
      </div>
    </div>
  );
}
