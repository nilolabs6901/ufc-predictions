// Backtest runner — pure logic shared by the CLI script and the /admin API route.
// Runs the REAL prediction engine over a historical dataset (CSV text) and
// returns accuracy / calibration / ROI metrics. No fs / console / process here.
import {
  predictFight,
  MODEL_VERSION,
  type FighterData,
  type FightContext,
  type Stance,
  type FightingStyle,
} from '../prediction-engine';

export interface CalibrationBucket { rangeLabel: string; predicted: number; actual: number; n: number; }
export interface TierResult { label: string; accuracy: number | null; n: number; }
export interface BacktestResult {
  modelVersion: string;
  fights: number;
  accuracy: number;
  favoriteAccuracy: number;
  edgeVsMarketPts: number;
  brier: number;
  logLoss: number;
  tiers: TierResult[];
  calibration: CalibrationBucket[];
  roiAll: number;
  roiAllN: number;
  roiValue: number | null;
  roiValueN: number;
  // raw counts (for persisting a ModelPerformance row)
  correct: number;
  high: { t: number; c: number };
  med: { t: number; c: number };
  low: { t: number; c: number };
}

// ---- minimal quote-aware CSV parser ----
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  if (!header) return [];
  return rows.filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (s: string | undefined): number | undefined => {
  if (s == null) return undefined;
  const t = s.trim();
  if (t === '' || t === 'NA' || t === 'nan') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};
const pct = (s: string | undefined): number => { const n = num(s); return n == null ? 0 : (n <= 1 ? n * 100 : n); };
const decimalToAmerican = (d: number): number => d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
const mapStance = (s: string | undefined): Stance => { const t = (s || '').toLowerCase(); return t.includes('south') ? 'southpaw' : t.includes('switch') ? 'switch' : 'orthodox'; };
const deriveStyle = (slpm: number, tdAvg: number): FightingStyle => tdAvg >= 2 ? 'Grappler' : (slpm >= 3.5 && tdAvg < 1 ? 'Striker' : 'MMA');
const hashBit = (s: string): number => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) & 1; };

function buildFighter(row: Record<string, string>, p: 'fighter1' | 'fighter2'): FighterData {
  const slpm = num(row[`${p}_sig_strikes_landed_pm`]) ?? 0;
  const tdAvg = num(row[`${p}_takedown_avg_per15m`]) ?? 0;
  const dob = row[`${p}_dob`], eventDate = row['event_date'];
  let age: number | undefined;
  if (dob && eventDate) { const a = (new Date(eventDate).getTime() - new Date(dob).getTime()) / 3.15576e10; if (a > 15 && a < 60) age = Math.round(a); }
  return {
    id: p, name: row[p] || p, stance: mapStance(row[`${p}_stance`]), fightingStyle: deriveStyle(slpm, tdAvg),
    height: num(row[`${p}_height`]), reach: num(row[`${p}_reach`]), age,
    stats: { slpm, strAcc: pct(row[`${p}_sig_strikes_accuracy`]), sapm: num(row[`${p}_sig_strikes_absorbed_pm`]) ?? 0, strDef: pct(row[`${p}_sig_strikes_defended`]), tdAvg, tdAcc: pct(row[`${p}_takedown_accuracy`]), tdDef: pct(row[`${p}_takedown_defence`]), subAvg: num(row[`${p}_submission_avg_attempted_per15m`]) ?? 0 },
    history: { currentStreak: 0, last5Record: '0-0', finishRateLast5: 0, careerFinishRate: 0, daysSinceLastFight: 120, timesKOd: 0, timesSubmitted: 0, fiveRoundFights: 0, winsInLateRounds: 0 },
    stancePerformance: { vsOrthodox: { wins: 0, losses: 0 }, vsSouthpaw: { wins: 0, losses: 0 }, vsSwitch: { wins: 0, losses: 0 } },
    stylePerformance: { vsMMA: { wins: 0, losses: 0 }, vsStriker: { wins: 0, losses: 0 }, vsGrappler: { wins: 0, losses: 0 } },
    isChampion: false,
  };
}

export function runBacktest(csvText: string): BacktestResult {
  const rows = parseCSV(csvText);
  let n = 0, correct = 0, favCorrect = 0, brier = 0, logloss = 0;
  const tiers = { high: { t: 0, c: 0 }, med: { t: 0, c: 0 }, low: { t: 0, c: 0 } };
  const calib = Array.from({ length: 10 }, () => ({ sumP: 0, win: 0, n: 0 }));
  let modelStake = 0, modelProfit = 0, valueStake = 0, valueProfit = 0;

  for (const row of rows) {
    if (row['outcome'] !== 'fighter1' && row['outcome'] !== 'fighter2') continue;
    const favOddsDec = num(row['favourite_odds']), dogOddsDec = num(row['underdog_odds']);
    if (favOddsDec == null || dogOddsDec == null) continue;
    if (num(row['fighter1_sig_strikes_landed_pm']) == null || num(row['fighter2_sig_strikes_landed_pm']) == null) continue;

    const f1 = buildFighter(row, 'fighter1'); // winner-first dataset
    const f2 = buildFighter(row, 'fighter2');
    const f1OddsDec = row['favourite'] === row['fighter1'] ? favOddsDec : dogOddsDec;
    const f2OddsDec = row['favourite'] === row['fighter2'] ? favOddsDec : dogOddsDec;
    const swap = hashBit(`${row['event_date']}|${row['fighter1']}|${row['fighter2']}`) === 1;
    const A = swap ? f2 : f1, B = swap ? f1 : f2;
    const aOddsDec = swap ? f2OddsDec : f1OddsDec, bOddsDec = swap ? f1OddsDec : f2OddsDec;
    const aWon = !swap;
    const favIsA = row['favourite'] === A.name;

    const ctx: FightContext = { weightClass: row['weight_class'] || 'Unknown', isTitleFight: false, scheduledRounds: 3, fighterAOdds: decimalToAmerican(aOddsDec), fighterBOdds: decimalToAmerican(bOddsDec), cageSize: 'standard' };
    const pred = predictFight(A, B, ctx);
    const pA = pred.fighterAWinProb;
    const modelPicksA = pA >= 0.5;
    const modelRight = modelPicksA === aWon;

    n++;
    if (modelRight) correct++;
    if ((favIsA && aWon) || (!favIsA && !aWon)) favCorrect++;
    const y = aWon ? 1 : 0;
    brier += (pA - y) ** 2;
    const pc = Math.min(0.999, Math.max(0.001, pA));
    logloss += -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
    const bin = Math.min(9, Math.floor(pA * 10));
    calib[bin].sumP += pA; calib[bin].win += y; calib[bin].n++;
    const conf = Math.max(pA, 1 - pA);
    const tier = conf > 0.70 ? tiers.high : conf >= 0.55 ? tiers.med : tiers.low;
    tier.t++; if (modelRight) tier.c++;
    const pickOddsDec = modelPicksA ? aOddsDec : bOddsDec;
    modelStake += 1; modelProfit += modelRight ? (pickOddsDec - 1) : -1;
    const modelPicksFav = modelPicksA === favIsA;
    if (!modelPicksFav) { valueStake += 1; valueProfit += modelRight ? (pickOddsDec - 1) : -1; }
  }

  const acc = n ? correct / n : 0, favAcc = n ? favCorrect / n : 0;
  return {
    modelVersion: MODEL_VERSION, fights: n,
    accuracy: acc, favoriteAccuracy: favAcc, edgeVsMarketPts: (acc - favAcc) * 100,
    brier: n ? brier / n : 0, logLoss: n ? logloss / n : 0,
    tiers: [
      { label: 'High >70%', accuracy: tiers.high.t ? tiers.high.c / tiers.high.t : null, n: tiers.high.t },
      { label: 'Med 55-70%', accuracy: tiers.med.t ? tiers.med.c / tiers.med.t : null, n: tiers.med.t },
      { label: 'Low <55%', accuracy: tiers.low.t ? tiers.low.c / tiers.low.t : null, n: tiers.low.t },
    ],
    calibration: calib.map((b, i) => ({ rangeLabel: `${i * 10}-${i * 10 + 10}%`, predicted: b.n ? b.sumP / b.n : 0, actual: b.n ? b.win / b.n : 0, n: b.n })).filter(b => b.n > 0),
    roiAll: modelStake ? modelProfit / modelStake : 0, roiAllN: modelStake,
    roiValue: valueStake ? valueProfit / valueStake : null, roiValueN: valueStake,
    correct, high: tiers.high, med: tiers.med, low: tiers.low,
  };
}
