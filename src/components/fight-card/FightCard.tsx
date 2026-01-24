'use client';

import { useState } from 'react';
import ProbabilityBar from '@/components/ui/ProbabilityBar';
import MethodBreakdown from '@/components/ui/MethodBreakdown';
import FightDetailModal from '@/components/ui/FightDetailModal';

interface Fighter {
  id: string;
  name: string;
  nickname: string | null;
  imageUrl: string | null;
  nationality: string | null;
  stance: string;
  fightingStyle: string;
  record: string;
  currentRank: number | null;
  isChampion: boolean;
  reach?: number | null;
  height?: number | null;
  currentStreak?: number | null;
}

interface Prediction {
  fighterAWinProb: number;
  fighterBWinProb: number;
  predictedWinnerId: string;
  confidence: number;
  insights: string[];
  fighterAByKO?: number;
  fighterAByTKO?: number;
  fighterABySub?: number;
  fighterAByDec?: number;
  fighterBByKO?: number;
  fighterBByTKO?: number;
  fighterBBySub?: number;
  fighterBByDec?: number;
}

interface FightCardProps {
  id: string;
  weightClass: string;
  isTitleFight: boolean;
  isMainEvent: boolean;
  isCoMain: boolean;
  scheduledRounds: number;
  fighterA: Fighter;
  fighterB: Fighter;
  odds: {
    fighterA: number | null;
    fighterB: number | null;
  };
  prediction: Prediction | null;
  index?: number;
}

// Country to flag emoji mapping
const countryFlags: Record<string, string> = {
  'USA': 'US',
  'United States': 'US',
  'Brazil': 'BR',
  'Russia': 'RU',
  'Ireland': 'IE',
  'England': 'GB',
  'UK': 'GB',
  'Australia': 'AU',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Nigeria': 'NG',
  'Cameroon': 'CM',
  'France': 'FR',
  'Netherlands': 'NL',
  'Poland': 'PL',
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Georgia': 'GE',
  'Dagestan': 'RU',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'New Zealand': 'NZ',
  'Germany': 'DE',
  'Italy': 'IT',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Peru': 'PE',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Ecuador': 'EC',
  'Jamaica': 'JM',
  'Cuba': 'CU',
  'Puerto Rico': 'PR',
  'Dominican Republic': 'DO',
};

function getFlag(nationality: string | null): string {
  if (!nationality) return '';
  const code = countryFlags[nationality] || nationality.slice(0, 2).toUpperCase();
  const codePoints = [...code.toUpperCase()].map(char =>
    127397 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

function formatOdds(odds: number | null): string {
  if (odds === null) return '--';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function getOddsClass(odds: number | null): string {
  if (odds === null) return 'text-gray-400';
  return odds < 0 ? 'odds-favorite' : 'odds-underdog';
}

function FighterSilhouette() {
  return (
    <div className="fighter-silhouette w-full h-full">
      <svg
        viewBox="0 0 100 120"
        className="w-20 h-24 text-gray-500"
        fill="currentColor"
      >
        <circle cx="50" cy="25" r="18" />
        <path d="M30 50 L30 90 L40 90 L40 65 L60 65 L60 90 L70 90 L70 50 L50 45 L30 50" />
        <path d="M30 52 L15 75 L22 78 L35 60" />
        <path d="M70 52 L85 75 L78 78 L65 60" />
      </svg>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number | null | undefined }) {
  if (!streak || Math.abs(streak) < 2) return null;

  const isWinStreak = streak > 0;
  const count = Math.abs(streak);

  return (
    <div
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        isWinStreak
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      {isWinStreak ? `${count}W` : `${count}L`}
    </div>
  );
}

function FighterStats({ stance, reach, height }: { stance: string; reach?: number | null; height?: number | null }) {
  return (
    <div className="flex gap-2 text-[10px] text-gray-500">
      <span className="capitalize">{stance}</span>
      {reach && <span>{reach}cm reach</span>}
      {height && <span>{height}cm</span>}
    </div>
  );
}

export default function FightCard({
  id,
  weightClass,
  isTitleFight,
  isMainEvent,
  isCoMain,
  scheduledRounds,
  fighterA,
  fighterB,
  odds,
  prediction,
  index = 0,
}: FightCardProps) {
  const [showMethodBreakdown, setShowMethodBreakdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const isPredictedWinnerA = prediction?.predictedWinnerId === fighterA.id;
  const isPredictedWinnerB = prediction?.predictedWinnerId === fighterB.id;

  const hasMethodData = prediction &&
    (prediction.fighterAByKO !== undefined || prediction.fighterABySub !== undefined);

  // Detect upset alert - when model picks the betting underdog
  const isUpsetAlert = prediction && (
    (isPredictedWinnerA && odds.fighterA !== null && odds.fighterA > 0) ||
    (isPredictedWinnerB && odds.fighterB !== null && odds.fighterB > 0)
  );

  const upsetFighterName = isUpsetAlert
    ? (isPredictedWinnerA ? fighterA.name : fighterB.name)
    : null;

  const upsetOdds = isUpsetAlert
    ? (isPredictedWinnerA ? odds.fighterA : odds.fighterB)
    : null;

  return (
    <>
    <div
      className="fight-card card-entrance cursor-pointer hover:border-red-500/50 transition-colors"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => setShowDetailModal(true)}
    >
      {/* Upset Alert Banner */}
      {isUpsetAlert && (
        <div className="upset-alert-banner flex items-center justify-center gap-2 py-2 border-b border-orange-500/50">
          <svg className="w-4 h-4 text-orange-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-orange-400 text-xs font-bold uppercase tracking-wide">
            Upset Alert: {upsetFighterName} ({formatOdds(upsetOdds)})
          </span>
          <svg className="w-4 h-4 text-orange-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Title/Event Badge */}
      {(isTitleFight || isMainEvent || isCoMain) && (
        <div className={`flex justify-center gap-2 py-2 border-b border-[#3a3a3a] ${
          isTitleFight ? 'title-fight-header' : 'bg-[#1a1a1a]'
        }`}>
          {isTitleFight && (
            <span className="title-badge flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.44.91-5.32-3.87-3.77 5.34-.78L10 2z" />
              </svg>
              TITLE FIGHT
            </span>
          )}
          {isMainEvent && !isTitleFight && (
            <span className="bg-[#d20a0a] text-white text-xs font-bold px-3 py-1 rounded-full">
              MAIN EVENT
            </span>
          )}
          {isCoMain && !isMainEvent && (
            <span className="bg-[#3a3a3a] text-white text-xs font-bold px-3 py-1 rounded-full">
              CO-MAIN
            </span>
          )}
        </div>
      )}

      {/* Main Fight Display */}
      <div className="flex items-stretch">
        {/* Fighter A */}
        <div className={`flex-1 p-4 transition-all duration-300 ${
          isPredictedWinnerA ? 'bg-green-500/5' : ''
        }`}>
          <div className="flex flex-col items-center">
            {/* Photo */}
            <div className="relative w-28 h-28 mb-3 rounded-lg overflow-hidden bg-[#2a2a2a] group">
              {fighterA.imageUrl ? (
                <img
                  src={fighterA.imageUrl}
                  alt={fighterA.name}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={fighterA.imageUrl ? 'hidden' : ''}>
                <FighterSilhouette />
              </div>
              {/* Champion indicator */}
              {fighterA.isChampion && (
                <div className="absolute top-1 left-1 bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.44.91-5.32-3.87-3.77 5.34-.78L10 2z" />
                  </svg>
                  C
                </div>
              )}
              {/* Ranking */}
              {fighterA.currentRank && !fighterA.isChampion && (
                <div className="absolute top-1 left-1 bg-[#3a3a3a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  #{fighterA.currentRank}
                </div>
              )}
              {/* Predicted winner glow */}
              {isPredictedWinnerA && (
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none" />
              )}
            </div>

            {/* Name & Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-lg">{getFlag(fighterA.nationality)}</span>
                <span className={`font-bold text-lg ${isPredictedWinnerA ? 'text-green-400' : ''}`}>
                  {fighterA.name}
                </span>
              </div>
              {fighterA.nickname && (
                <p className="text-gray-400 text-sm italic mb-1">
                  &quot;{fighterA.nickname}&quot;
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-gray-300 text-sm">{fighterA.record}</p>
                <StreakBadge streak={fighterA.currentStreak} />
              </div>

              {/* Fighter stats */}
              <FighterStats
                stance={fighterA.stance}
                reach={fighterA.reach}
                height={fighterA.height}
              />

              {/* Odds */}
              <p className={`text-xl font-bold mt-2 ${getOddsClass(odds.fighterA)}`}>
                {formatOdds(odds.fighterA)}
              </p>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-4 py-6 bg-[#1a1a1a] relative">
          <div className="text-[#d20a0a] font-bold text-2xl mb-2 vs-glow">VS</div>
          <div className="text-gray-400 text-xs text-center">
            <p className="font-semibold">{weightClass}</p>
            <p>{scheduledRounds} Rounds</p>
          </div>
          {/* Decorative line */}
          <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
          <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-[#3a3a3a] to-transparent" />
        </div>

        {/* Fighter B */}
        <div className={`flex-1 p-4 transition-all duration-300 ${
          isPredictedWinnerB ? 'bg-green-500/5' : ''
        }`}>
          <div className="flex flex-col items-center">
            {/* Photo */}
            <div className="relative w-28 h-28 mb-3 rounded-lg overflow-hidden bg-[#2a2a2a] group">
              {fighterB.imageUrl ? (
                <img
                  src={fighterB.imageUrl}
                  alt={fighterB.name}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={fighterB.imageUrl ? 'hidden' : ''}>
                <FighterSilhouette />
              </div>
              {/* Champion indicator */}
              {fighterB.isChampion && (
                <div className="absolute top-1 right-1 bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.44.91-5.32-3.87-3.77 5.34-.78L10 2z" />
                  </svg>
                  C
                </div>
              )}
              {/* Ranking */}
              {fighterB.currentRank && !fighterB.isChampion && (
                <div className="absolute top-1 right-1 bg-[#3a3a3a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  #{fighterB.currentRank}
                </div>
              )}
              {/* Predicted winner glow */}
              {isPredictedWinnerB && (
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none" />
              )}
            </div>

            {/* Name & Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className={`font-bold text-lg ${isPredictedWinnerB ? 'text-green-400' : ''}`}>
                  {fighterB.name}
                </span>
                <span className="text-lg">{getFlag(fighterB.nationality)}</span>
              </div>
              {fighterB.nickname && (
                <p className="text-gray-400 text-sm italic mb-1">
                  &quot;{fighterB.nickname}&quot;
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-gray-300 text-sm">{fighterB.record}</p>
                <StreakBadge streak={fighterB.currentStreak} />
              </div>

              {/* Fighter stats */}
              <FighterStats
                stance={fighterB.stance}
                reach={fighterB.reach}
                height={fighterB.height}
              />

              {/* Odds */}
              <p className={`text-xl font-bold mt-2 ${getOddsClass(odds.fighterB)}`}>
                {formatOdds(odds.fighterB)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Bar */}
      {prediction && (
        <div className="px-4 py-4 border-t border-[#3a3a3a]">
          <ProbabilityBar
            fighterAProb={prediction.fighterAWinProb}
            fighterBProb={prediction.fighterBWinProb}
            fighterAName={fighterA.name}
            fighterBName={fighterB.name}
            predictedWinnerId={prediction.predictedWinnerId}
            fighterAId={fighterA.id}
            fighterBId={fighterB.id}
          />
        </div>
      )}

      {/* Method Breakdown Toggle */}
      {hasMethodData && (
        <div className="border-t border-[#3a3a3a]">
          <button
            onClick={() => setShowMethodBreakdown(!showMethodBreakdown)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Method Breakdown
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showMethodBreakdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMethodBreakdown && (
            <div className="px-4 pb-4 method-breakdown-enter">
              <MethodBreakdown
                fighterAName={fighterA.name}
                fighterBName={fighterB.name}
                fighterAByKO={prediction?.fighterAByKO || 0}
                fighterAByTKO={prediction?.fighterAByTKO || 0}
                fighterABySub={prediction?.fighterABySub || 0}
                fighterAByDec={prediction?.fighterAByDec || 0}
                fighterBByKO={prediction?.fighterBByKO || 0}
                fighterBByTKO={prediction?.fighterBByTKO || 0}
                fighterBBySub={prediction?.fighterBBySub || 0}
                fighterBByDec={prediction?.fighterBByDec || 0}
              />
            </div>
          )}
        </div>
      )}

      {/* Statistical Model Insights */}
      {prediction && prediction.insights.length > 0 && (
        <div className="border-t border-[#3a3a3a] px-4 py-3 bg-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#c9a227]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-[#c9a227] text-sm font-semibold">
              Model Insights
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              prediction.confidence >= 0.7
                ? 'bg-green-500/20 text-green-400'
                : prediction.confidence >= 0.55
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {Math.round(prediction.confidence * 100)}% conf
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction.insights.slice(0, 4).map((insight, index) => (
              <span
                key={index}
                className="text-xs bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded border border-[#3a3a3a] insight-badge"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {insight}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Fight Detail Modal */}
    <FightDetailModal
      fightId={id}
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
    />
    </>
  );
}
