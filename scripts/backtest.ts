/**
 * Backtest CLI — thin wrapper around src/lib/backtest/runner (the same logic the
 * /admin backtest view uses). Runs the REAL prediction engine over historical
 * fights and prints accuracy / calibration / ROI. Re-run after any model change.
 *
 * Run:  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backtest.ts [--save]
 *       (--save writes a ModelPerformance row; use `railway run --service Postgres ...` for DB)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { runBacktest } from '../src/lib/backtest/runner';

function main() {
  const save = process.argv.includes('--save');
  const csv = fs.readFileSync(path.join(__dirname, '../data/historical/complete_ufc_data.csv'), 'utf8');
  const r = runBacktest(csv);

  console.log(`\n===== BACKTEST — model ${r.modelVersion} =====`);
  console.log(`Fights evaluated: ${r.fights}`);
  console.log(`\nACCURACY`);
  console.log(`  Model:               ${(r.accuracy * 100).toFixed(1)}%`);
  console.log(`  Favorite (baseline): ${(r.favoriteAccuracy * 100).toFixed(1)}%`);
  console.log(`  Edge vs market:      ${r.edgeVsMarketPts.toFixed(1)} pts`);
  console.log(`\nPROPER SCORES (lower=better)`);
  console.log(`  Brier:   ${r.brier.toFixed(4)}   (0.25=coinflip)`);
  console.log(`  LogLoss: ${r.logLoss.toFixed(4)}   (0.693=coinflip)`);
  console.log(`\nACCURACY BY CONFIDENCE TIER`);
  for (const t of r.tiers) console.log(`  ${t.label.padEnd(11)}: ${t.accuracy == null ? '—' : (t.accuracy * 100).toFixed(1) + '%'}  (n=${t.n})`);
  console.log(`\nCALIBRATION (fighter-A prob -> actual A win%)`);
  for (const b of r.calibration) console.log(`  ${b.rangeLabel.padStart(7)}: predicted ${(b.predicted * 100).toFixed(0)}% -> actual ${(b.actual * 100).toFixed(0)}%  (n=${b.n})`);
  console.log(`\nBETTING ROI (flat 1u, closing odds)`);
  console.log(`  Every pick:            ${(r.roiAll * 100).toFixed(1)}%  (n=${r.roiAllN})`);
  console.log(`  Value (fades favorite): ${r.roiValue == null ? '—' : (r.roiValue * 100).toFixed(1) + '%'}  (n=${r.roiValueN})`);
  console.log(`\nNote: dataset lacks streak/record history, so historicalPerformance / experienceFactor / durability ran neutral — measures the model's core.`);

  if (save) saveResult(r).catch((e: Error) => console.error('save failed:', e.message));
}

async function saveResult(r: Awaited<ReturnType<typeof runBacktest>>) {
  const { PrismaClient } = await import('@prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const periodStart = new Date('1994-01-01');
  const row = { modelVersion: `${r.modelVersion}-backtest`, totalPredictions: r.fights, correctPredictions: r.correct, accuracy: r.accuracy, highConfidenceTotal: r.high.t, highConfidenceCorrect: r.high.c, medConfidenceTotal: r.med.t, medConfidenceCorrect: r.med.c, lowConfidenceTotal: r.low.t, lowConfidenceCorrect: r.low.c, periodEnd: new Date() };
  await prisma.modelPerformance.upsert({ where: { modelVersion_periodStart: { modelVersion: row.modelVersion, periodStart } }, update: row, create: { ...row, periodStart } });
  console.log(`\nSaved ModelPerformance row (${row.modelVersion}).`);
  await prisma.$disconnect(); await pool.end();
}

main();
