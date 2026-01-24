import { notFound } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';
import FightCard from '@/components/fight-card/FightCard';
import CountdownTimer from '@/components/ui/CountdownTimer';
import Link from 'next/link';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      fights: {
        orderBy: { fightOrder: 'desc' },
        include: {
          fighterA: {
            include: { stats: true },
          },
          fighterB: {
            include: { stats: true },
          },
          predictions: {
            where: { modelVersion: '1.0.0' },
            take: 1,
          },
        },
      },
    },
  });

  return event;
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  // Group fights by card section
  const mainCard = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'main');
  const prelims = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'prelims');
  const earlyPrelims = event.fights.filter((f: typeof event.fights[0]) => f.cardSection === 'early_prelims');

  const formatFight = (fight: typeof event.fights[0], index: number) => {
    const prediction = fight.predictions[0];
    return {
      id: fight.id,
      weightClass: fight.weightClass,
      isTitleFight: fight.isTitleFight,
      isMainEvent: fight.isMainEvent,
      isCoMain: fight.isCoMain,
      scheduledRounds: fight.scheduledRounds,
      index,
      fighterA: {
        id: fight.fighterA.id,
        name: fight.fighterA.name,
        nickname: fight.fighterA.nickname,
        imageUrl: fight.fighterA.imageUrl,
        nationality: fight.fighterA.nationality,
        stance: fight.fighterA.stance,
        fightingStyle: fight.fighterA.fightingStyle,
        record: `${fight.fighterA.wins}-${fight.fighterA.losses}${fight.fighterA.draws > 0 ? `-${fight.fighterA.draws}` : ''}`,
        currentRank: fight.fighterA.currentRank,
        isChampion: fight.fighterA.isChampion,
        reach: fight.fighterA.reach,
        height: fight.fighterA.height,
        currentStreak: fight.fighterA.currentStreak,
      },
      fighterB: {
        id: fight.fighterB.id,
        name: fight.fighterB.name,
        nickname: fight.fighterB.nickname,
        imageUrl: fight.fighterB.imageUrl,
        nationality: fight.fighterB.nationality,
        stance: fight.fighterB.stance,
        fightingStyle: fight.fighterB.fightingStyle,
        record: `${fight.fighterB.wins}-${fight.fighterB.losses}${fight.fighterB.draws > 0 ? `-${fight.fighterB.draws}` : ''}`,
        currentRank: fight.fighterB.currentRank,
        isChampion: fight.fighterB.isChampion,
        reach: fight.fighterB.reach,
        height: fight.fighterB.height,
        currentStreak: fight.fighterB.currentStreak,
      },
      odds: {
        fighterA: fight.fighterAOdds,
        fighterB: fight.fighterBOdds,
      },
      prediction: prediction ? {
        fighterAWinProb: prediction.fighterAWinProb,
        fighterBWinProb: prediction.fighterBWinProb,
        predictedWinnerId: prediction.predictedWinnerId,
        confidence: prediction.confidence,
        insights: prediction.insights,
        fighterAByKO: prediction.fighterAByKO,
        fighterAByTKO: prediction.fighterAByTKO,
        fighterABySub: prediction.fighterABySub,
        fighterAByDec: prediction.fighterAByDec,
        fighterBByKO: prediction.fighterBByKO,
        fighterBByTKO: prediction.fighterBByTKO,
        fighterBBySub: prediction.fighterBBySub,
        fighterBByDec: prediction.fighterBByDec,
      } : null,
    };
  };

  const isUpcoming = new Date(event.date) > new Date();

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#3a3a3a]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>
        </div>
      </header>

      {/* Event Header */}
      <div className="bg-gradient-to-r from-[#d20a0a] to-[#a00808] py-8 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {event.isPPV && (
              <span className="bg-[#c9a227] text-black text-xs font-bold px-2 py-1 rounded">
                PPV
              </span>
            )}
            {event.isCompleted && (
              <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">
                COMPLETED
              </span>
            )}
            {!event.isCompleted && isUpcoming && (
              <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                UPCOMING
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {event.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-gray-200 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.venue}
                {event.city && `, ${event.city}`}
                {event.country && `, ${event.country}`}
              </span>
            )}
            {event.altitude > 1000 && (
              <span className="flex items-center gap-1 text-yellow-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 17h14L10 2zm0 3.5l4.5 9.5h-9L10 5.5z"/>
                </svg>
                High Altitude ({event.altitude}m)
              </span>
            )}
          </div>

          {/* Countdown for upcoming events */}
          {isUpcoming && (
            <CountdownTimer
              targetDate={new Date(event.date)}
              label="Event starts in"
            />
          )}
        </div>
      </div>

      {/* Fight Stats Summary */}
      <div className="bg-[#1a1a1a] border-b border-[#3a3a3a]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-400">Total Fights: </span>
              <span className="text-white font-semibold">{event.fights.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Title Fights: </span>
              <span className="text-[#c9a227] font-semibold">
                {event.fights.filter((f: typeof event.fights[0]) => f.isTitleFight).length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Cage Size: </span>
              <span className="text-white font-semibold capitalize">{event.cageSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fight Cards */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Card */}
        {mainCard.length > 0 && (
          <section className="mb-8">
            <h2 className="section-header rounded-t-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.44.91-5.32-3.87-3.77 5.34-.78L10 2z" />
              </svg>
              Main Card
            </h2>
            <div className="space-y-4 mt-4">
              {mainCard.map((fight: typeof event.fights[0], index: number) => (
                <FightCard key={fight.id} {...formatFight(fight, index)} />
              ))}
            </div>
          </section>
        )}

        {/* Prelims */}
        {prelims.length > 0 && (
          <section className="mb-8">
            <h2 className="bg-[#2a2a2a] text-white py-2 px-4 rounded-t-lg font-bold uppercase tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Preliminary Card
            </h2>
            <div className="space-y-4 mt-4">
              {prelims.map((fight: typeof event.fights[0], index: number) => (
                <FightCard key={fight.id} {...formatFight(fight, mainCard.length + index)} />
              ))}
            </div>
          </section>
        )}

        {/* Early Prelims */}
        {earlyPrelims.length > 0 && (
          <section className="mb-8">
            <h2 className="bg-[#2a2a2a] text-gray-300 py-2 px-4 rounded-t-lg font-bold uppercase tracking-wide">
              Early Prelims
            </h2>
            <div className="space-y-4 mt-4">
              {earlyPrelims.map((fight: typeof event.fights[0], index: number) => (
                <FightCard key={fight.id} {...formatFight(fight, mainCard.length + prelims.length + index)} />
              ))}
            </div>
          </section>
        )}

        {/* No fights message */}
        {event.fights.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-lg">
              No fights announced yet for this event.
            </p>
            <p className="text-gray-500 mt-2">
              Check back later for the full fight card.
            </p>
          </div>
        )}

        {/* Model info */}
        <div className="mt-8 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#c9a227]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-[#c9a227] font-semibold">About These Predictions</span>
          </div>
          <p className="text-gray-400 text-sm">
            Predictions are generated using a 14-factor AI model analyzing fighting styles,
            historical performance, physical attributes, and environmental conditions.
            Model Version: 1.0.0
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3a3a3a] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>
            Predictions are generated using AI and historical data analysis.
            Not financial advice. Gamble responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: `${event.name} - UFC Predictions`,
    description: `AI-powered fight predictions for ${event.name}`,
  };
}
