import Link from 'next/link';
import { prisma } from '@/lib/database/prisma';
import { format } from 'date-fns';
import CountdownTimer from '@/components/ui/CountdownTimer';
import AccuracyTracker from '@/components/ui/AccuracyTracker';

async function getUpcomingEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: { gte: new Date() },
        isCompleted: false,
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        fights: {
          orderBy: { fightOrder: 'desc' },
          take: 1,
          include: {
            fighterA: {
              select: { name: true, isChampion: true, imageUrl: true },
            },
            fighterB: {
              select: { name: true, isChampion: true, imageUrl: true },
            },
          },
        },
        _count: { select: { fights: true } },
      },
    });
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}


async function getRecentEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isCompleted: true,
      },
      orderBy: { date: 'desc' },
      take: 3,
      include: {
        _count: { select: { fights: true } },
      },
    });
    return events;
  } catch (error) {
    console.error('Failed to fetch recent events:', error);
    return [];
  }
}

const factors = [
  {
    title: 'Style Analysis',
    description: 'Grapplers vs Strikers, pressure vs counter fighters',
    weight: '15%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Striking Stats',
    description: 'SLPM, accuracy, defense, absorption rate',
    weight: '12%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Grappling Stats',
    description: 'Takedown avg, accuracy, defense, submissions',
    weight: '12%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    title: 'Historical Form',
    description: 'Win streaks, recent performance, ring rust',
    weight: '12%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Market Signal',
    description: 'Betting odds implied probability',
    weight: '10%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Durability',
    description: 'Times KOd, times submitted, chin status',
    weight: '8%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Championship Exp',
    description: '5-round fight experience and late round wins',
    weight: '4%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    title: 'Environment',
    description: 'Altitude, cage size, travel distance',
    weight: '8%',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const [upcomingEvents, recentEvents] = await Promise.all([
    getUpcomingEvents(),
    getRecentEvents(),
  ]);

  const nextEvent = upcomingEvents[0];
  const mainEventFight = nextEvent?.fights[0];
  const fighterAImage = mainEventFight?.fighterA?.imageUrl;
  const fighterBImage = mainEventFight?.fighterB?.imageUrl;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Hero Section */}
      <header className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d20a0a]/30 via-[#1a1a1a] to-[#0d0d0d]" />

        {/* Fighter images on sides */}
        {fighterAImage && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 bg-contain bg-left bg-no-repeat opacity-40 hidden md:block"
            style={{
              backgroundImage: `url(${fighterAImage})`,
              maskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
            }}
          />
        )}
        {fighterBImage && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-contain bg-right bg-no-repeat opacity-40 hidden md:block"
            style={{
              backgroundImage: `url(${fighterBImage})`,
              maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
            }}
          />
        )}

        {/* Center gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0d0d0d]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]/70" />

        {/* Animated glow effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(210,10,10,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(210,10,10,0.4) 0%, transparent 40%)'
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#d20a0a] rounded-lg flex items-center justify-center shadow-lg shadow-red-900/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">UFC Predictions</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mb-8">
            AI-powered fight predictions based on comprehensive fighter analysis,
            historical performance, and advanced statistics.
          </p>
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="bg-[#1a1a1a]/80 backdrop-blur border border-[#3a3a3a] rounded-lg px-4 py-3">
              <p className="text-gray-400 text-sm">Analysis Factors</p>
              <p className="text-white text-2xl font-bold">14+</p>
            </div>
            <div className="bg-[#1a1a1a]/80 backdrop-blur border border-[#3a3a3a] rounded-lg px-4 py-3">
              <p className="text-gray-400 text-sm">Including</p>
              <p className="text-white text-lg font-semibold">Style, Streak, Altitude</p>
            </div>
            <div className="bg-[#1a1a1a]/80 backdrop-blur border border-[#3a3a3a] rounded-lg px-4 py-3">
              <p className="text-gray-400 text-sm">Research-Backed</p>
              <p className="text-[#c9a227] text-lg font-semibold">Data-Driven</p>
            </div>
          </div>

          {/* Next Event Countdown */}
          {nextEvent && (
            <div className="bg-[#1a1a1a]/80 backdrop-blur border border-[#3a3a3a] rounded-lg p-6 max-w-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#c9a227] text-sm font-semibold">NEXT EVENT</span>
                {nextEvent.isPPV && (
                  <span className="bg-[#c9a227] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PPV
                  </span>
                )}
              </div>
              <h3 className="text-white text-xl font-bold mb-3">{nextEvent.name}</h3>
              <CountdownTimer targetDate={new Date(nextEvent.date)} compact />
              <Link
                href={`/events/${nextEvent.id}`}
                className="mt-4 inline-flex items-center gap-2 text-[#d20a0a] hover:text-red-400 transition-colors font-semibold"
              >
                View Predictions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-[#d20a0a] rounded-full"></span>
            Upcoming Events
          </h2>

          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event: typeof upcomingEvents[0], index: number) => {
                const mainEvent = event.fights[0];
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="fight-card event-card p-4"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {event.isPPV && (
                        <span className="bg-[#c9a227] text-black text-xs font-bold px-2 py-0.5 rounded">
                          PPV
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {event.name}
                    </h3>
                    {mainEvent && (
                      <div className="bg-[#1a1a1a] rounded p-2 mb-2">
                        <p className="text-sm text-gray-400 mb-1">Main Event</p>
                        <p className="text-white font-semibold">
                          {mainEvent.fighterA.isChampion && (
                            <span className="text-[#c9a227]">(C) </span>
                          )}
                          {mainEvent.fighterA.name}
                          <span className="text-[#d20a0a] mx-2">vs</span>
                          {mainEvent.fighterB.isChampion && (
                            <span className="text-[#c9a227]">(C) </span>
                          )}
                          {mainEvent.fighterB.name}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {event._count.fights} fights
                      </span>
                      <span className="text-[#d20a0a] font-semibold flex items-center gap-1">
                        View Predictions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-lg mb-4">
                No upcoming events found.
              </p>
              <p className="text-gray-500 mb-4">
                Run the seeding script to add sample events.
              </p>
              <code className="block bg-[#0d0d0d] text-green-400 px-4 py-2 rounded font-mono text-sm">
                npm run seed
              </code>
            </div>
          )}
        </section>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-gray-500 rounded-full"></span>
              Recent Events
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {recentEvents.map((event: typeof recentEvents[0]) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4 hover:border-gray-500 transition-all hover:bg-[#1f1f1f]"
                >
                  <span className="text-gray-500 text-sm">
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </span>
                  <h3 className="text-white font-semibold mt-1">
                    {event.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    {event._count.fights} fights
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
            Tools
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/parlay"
              className="bg-gradient-to-br from-[#1a1a1a] to-[#2a1a2a] border border-purple-900/50 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-900/50 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Parlay Builder</h3>
                  <p className="text-gray-400 text-sm">Build parlays with correlation analysis and edge calculation</p>
                </div>
              </div>
            </Link>
            <Link
              href="/accuracy"
              className="bg-gradient-to-br from-[#1a1a1a] to-[#1a2a1a] border border-green-900/50 rounded-xl p-6 hover:border-green-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-900/50 transition-colors">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Model Accuracy</h3>
                  <p className="text-gray-400 text-sm">Calibration charts, Brier score, and performance tracking</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Accuracy Tracker */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-green-500 rounded-full"></span>
            Model Performance
          </h2>
          <AccuracyTracker />
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-[#c9a227] rounded-full"></span>
            How It Works
          </h2>
          <p className="text-gray-400 mb-6 max-w-2xl">
            Our prediction model analyzes 14+ factors to calculate win probabilities.
            Each factor is weighted based on research and historical accuracy.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {factors.map((factor, index) => (
              <div
                key={index}
                className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4 hover:border-[#c9a227]/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-gray-400 group-hover:text-[#c9a227] transition-colors">
                    {factor.icon}
                  </div>
                  <span className="text-[#c9a227] text-sm font-bold bg-[#c9a227]/10 px-2 py-0.5 rounded">
                    {factor.weight}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{factor.title}</h3>
                <p className="text-gray-400 text-sm">{factor.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Model Info */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#c9a227]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#c9a227]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#c9a227] font-semibold text-lg mb-2">About the Model</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Version 1.0.0 uses research-backed weights derived from academic studies
                  on MMA fight outcomes. Key findings include:
                </p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c9a227] rounded-full"></span>
                    UFC favorites win ~66% of the time (not 75% as commonly cited)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c9a227] rounded-full"></span>
                    Southpaws have ~3% advantage vs orthodox fighters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c9a227] rounded-full"></span>
                    Grapplers beat strikers ~60% of the time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c9a227] rounded-full"></span>
                    High altitude (&gt;1500m) significantly impacts cardio
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-yellow-500 font-semibold mb-2">Disclaimer</h3>
              <p className="text-gray-400 text-sm">
                These predictions are generated using AI and historical data analysis.
                They are for informational purposes only and should not be considered
                financial advice. Past performance does not guarantee future results.
                Please gamble responsibly.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3a3a3a] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>UFC Predictions - Model Version 1.0.0</p>
          <p className="mt-1">Built with Next.js, Prisma, and AI</p>
        </div>
      </footer>
    </div>
  );
}
