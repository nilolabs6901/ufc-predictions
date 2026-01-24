import AccuracyDashboard from '@/components/accuracy/AccuracyDashboard';
import Link from 'next/link';

export const metadata = {
  title: 'Model Accuracy | UFC Predictions',
  description: 'Track prediction accuracy with calibration analysis and performance metrics',
};

export default function AccuracyPage() {
  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              &larr; Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Model Accuracy</h1>
              <p className="text-sm text-gray-400">
                Calibration analysis, Brier score, and performance tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AccuracyDashboard />

        {/* Methodology Section */}
        <div className="mt-8 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Methodology</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Prediction Model</h4>
              <p>
                Our 14-factor model analyzes fighting styles, historical performance, physical
                attributes, and contextual factors like venue altitude and referee tendencies.
                Each factor is weighted based on historical UFC fight outcome analysis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Monte Carlo Simulation</h4>
              <p>
                Each prediction runs 10,000 fight simulations, modeling health decay, cardio
                depletion, and finish probability per round to generate probability distributions
                and confidence intervals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
