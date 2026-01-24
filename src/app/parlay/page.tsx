import { prisma } from '@/lib/database/prisma';
import ParlayBuilder from '@/components/parlay/ParlayBuilder';
import Link from 'next/link';

export const metadata = {
  title: 'Parlay Builder | UFC Predictions',
  description: 'Build smart parlays with correlation analysis and edge calculation',
};

export default async function ParlayPage() {
  // Get upcoming fights with predictions
  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: { gte: new Date() },
      isCompleted: false,
    },
    include: {
      fights: {
        include: {
          fighterA: {
            select: {
              id: true,
              name: true,
              trainingCamp: true,
            },
          },
          fighterB: {
            select: {
              id: true,
              name: true,
              trainingCamp: true,
            },
          },
          predictions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { fightOrder: 'desc' },
      },
    },
    orderBy: { date: 'asc' },
    take: 3,
  });

  // Transform fights for the parlay builder
  const fights = upcomingEvents.flatMap(event =>
    event.fights.map(fight => ({
      id: fight.id,
      fighterA: {
        name: fight.fighterA.name,
        trainingCamp: fight.fighterA.trainingCamp || undefined,
      },
      fighterB: {
        name: fight.fighterB.name,
        trainingCamp: fight.fighterB.trainingCamp || undefined,
      },
      fighterAOdds: fight.fighterAOdds,
      fighterBOdds: fight.fighterBOdds,
      weightClass: fight.weightClass,
      prediction: fight.predictions[0]
        ? {
            fighterAWinProb: fight.predictions[0].fighterAWinProb,
            fighterBWinProb: fight.predictions[0].fighterBWinProb,
          }
        : undefined,
    }))
  );

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Parlay Builder</h1>
              <p className="text-sm text-gray-400">Build parlays with correlation analysis and edge calculation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {fights.length > 0 ? (
          <ParlayBuilder fights={fights} />
        ) : (
          <div className="text-center py-16 bg-gray-900/50 border border-gray-700 rounded-xl">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-white mb-2">No Upcoming Fights</h2>
            <p className="text-gray-400">Check back when new events are added.</p>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">How the Parlay Builder Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-red-500 font-bold mb-1">1. Select Fighters</div>
              <p className="text-gray-400">Click on fighters from the available fights to add them to your parlay. Minimum 2 legs required.</p>
            </div>
            <div>
              <div className="text-red-500 font-bold mb-1">2. Correlation Detection</div>
              <p className="text-gray-400">The system detects correlations between your picks (same camp, same style) that affect true probability.</p>
            </div>
            <div>
              <div className="text-red-500 font-bold mb-1">3. Edge Analysis</div>
              <p className="text-gray-400">See expected value, Kelly stake recommendations, and risk assessment for your parlay.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
