import axios from 'axios';
import { prisma } from '../database/prisma';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;

// UFC/MMA sport key
const SPORT_KEY = 'mma_mixed_martial_arts';

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number; // American odds
}

// =============================================
// FETCH LIVE UFC ODDS
// =============================================

export async function fetchLiveOdds(): Promise<OddsApiEvent[]> {
  if (!API_KEY) {
    console.warn('ODDS_API_KEY not set, skipping odds fetch');
    return [];
  }

  try {
    const response = await axios.get(`${ODDS_API_BASE}/sports/${SPORT_KEY}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h', // Head-to-head (moneyline)
        oddsFormat: 'american',
      },
    });

    console.log(`Fetched odds for ${response.data.length} UFC events`);
    console.log(`Remaining API requests: ${response.headers['x-requests-remaining']}`);

    return response.data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

// =============================================
// MATCH ODDS TO FIGHTS IN DATABASE
// =============================================

export async function syncOddsToDatabase(): Promise<{ updated: number; errors: number; predictionsCleared: number }> {
  const oddsEvents = await fetchLiveOdds();
  let updated = 0;
  let errors = 0;
  const updatedFightIds: string[] = [];

  for (const event of oddsEvents) {
    try {
      // Find matching fight in database
      const fighterAName = event.home_team;
      const fighterBName = event.away_team;

      // Extract last names for matching
      const aLastName = fighterAName.split(' ').pop()?.toLowerCase() || '';
      const bLastName = fighterBName.split(' ').pop()?.toLowerCase() || '';

      // Try to find the fight by fighter names
      const fights = await prisma.fight.findMany({
        where: {
          isCompleted: false,
        },
        include: {
          fighterA: true,
          fighterB: true,
        },
      });

      // Find best match
      const fight = fights.find(f => {
        const fAName = f.fighterA.name.toLowerCase();
        const fBName = f.fighterB.name.toLowerCase();

        return (fAName.includes(aLastName) && fBName.includes(bLastName)) ||
               (fAName.includes(bLastName) && fBName.includes(aLastName));
      });

      if (!fight) {
        console.log(`No match found for: ${fighterAName} vs ${fighterBName}`);
        continue;
      }

      // Get consensus odds (median across bookmakers)
      const consensusOdds = calculateConsensusOdds(event.bookmakers, fighterAName, fighterBName);

      if (!consensusOdds) continue;

      // Determine which fighter is A and B in our database
      const aIsFirst = fight.fighterA.name.toLowerCase().includes(aLastName);

      const fighterAOdds = aIsFirst ? consensusOdds.fighter1 : consensusOdds.fighter2;
      const fighterBOdds = aIsFirst ? consensusOdds.fighter2 : consensusOdds.fighter1;

      // Update fight with odds
      await prisma.fight.update({
        where: { id: fight.id },
        data: {
          fighterAOdds,
          fighterBOdds,
          // Store opening odds if not set
          openingAOdds: fight.openingAOdds ?? fighterAOdds,
          openingBOdds: fight.openingBOdds ?? fighterBOdds,
        },
      });

      // Record odds history
      await prisma.oddsHistory.create({
        data: {
          fightId: fight.id,
          source: 'consensus',
          fighterAOdds,
          fighterBOdds,
        },
      });

      // Also record individual bookmaker odds
      for (const bookmaker of event.bookmakers.slice(0, 3)) { // Limit to top 3 bookmakers
        const market = bookmaker.markets.find(m => m.key === 'h2h');
        if (!market) continue;

        const outcome1 = market.outcomes.find(o => o.name === fighterAName);
        const outcome2 = market.outcomes.find(o => o.name === fighterBName);

        if (outcome1 && outcome2) {
          await prisma.oddsHistory.create({
            data: {
              fightId: fight.id,
              source: bookmaker.key,
              fighterAOdds: aIsFirst ? outcome1.price : outcome2.price,
              fighterBOdds: aIsFirst ? outcome2.price : outcome1.price,
            },
          });
        }
      }

      console.log(`Updated odds for ${fight.fighterA.name} vs ${fight.fighterB.name}: ${fighterAOdds} / ${fighterBOdds}`);
      updated++;
      updatedFightIds.push(fight.id);
    } catch (error) {
      console.error(`Error processing odds for ${event.home_team} vs ${event.away_team}:`, error);
      errors++;
    }
  }

  // Odds feed the model's market-signal factor, so any fight whose line changed
  // has a stale cached prediction + analysis. Clear them so they regenerate with
  // the fresh odds on next view (keeps the model current with the market).
  let predictionsCleared = 0;
  if (updatedFightIds.length) {
    const [p] = await Promise.all([
      prisma.prediction.deleteMany({ where: { fightId: { in: updatedFightIds } } }),
      prisma.matchupAnalysis.deleteMany({ where: { fightId: { in: updatedFightIds } } }),
    ]);
    predictionsCleared = p.count;
  }

  return { updated, errors, predictionsCleared };
}

function calculateConsensusOdds(
  bookmakers: OddsBookmaker[],
  fighter1Name: string,
  fighter2Name: string
): { fighter1: number; fighter2: number } | null {
  const odds1: number[] = [];
  const odds2: number[] = [];

  for (const bookmaker of bookmakers) {
    const market = bookmaker.markets.find(m => m.key === 'h2h');
    if (!market) continue;

    const outcome1 = market.outcomes.find(o => o.name === fighter1Name);
    const outcome2 = market.outcomes.find(o => o.name === fighter2Name);

    if (outcome1 && outcome2) {
      odds1.push(outcome1.price);
      odds2.push(outcome2.price);
    }
  }

  if (odds1.length === 0) return null;

  // Return median odds
  odds1.sort((a, b) => a - b);
  odds2.sort((a, b) => a - b);

  const mid = Math.floor(odds1.length / 2);

  return {
    fighter1: odds1[mid],
    fighter2: odds2[mid],
  };
}

// =============================================
// DETECT LINE MOVEMENT (Sharp Money)
// =============================================

export async function detectLineMovement(fightId: string): Promise<{
  movement: 'fighterA' | 'fighterB' | 'none';
  magnitude: number;
  isSharpMoney: boolean;
  description: string;
} | null> {
  const history = await prisma.oddsHistory.findMany({
    where: { fightId, source: 'consensus' },
    orderBy: { timestamp: 'asc' },
  });

  if (history.length < 2) return null;

  const first = history[0];
  const last = history[history.length - 1];

  // Convert to implied probability for comparison
  const impliedFirst = {
    a: americanToImplied(first.fighterAOdds),
    b: americanToImplied(first.fighterBOdds),
  };

  const impliedLast = {
    a: americanToImplied(last.fighterAOdds),
    b: americanToImplied(last.fighterBOdds),
  };

  const movementA = impliedLast.a - impliedFirst.a;

  const magnitude = Math.abs(movementA);

  if (magnitude < 0.02) {
    return { movement: 'none', magnitude: 0, isSharpMoney: false, description: 'No significant movement' };
  }

  const direction = movementA > 0 ? 'fighterA' : 'fighterB';

  // Sharp money indicator: 5%+ movement is notable
  const isSharpMoney = magnitude > 0.05;

  return {
    movement: direction,
    magnitude,
    isSharpMoney,
    description: isSharpMoney
      ? `Significant line movement toward ${direction === 'fighterA' ? 'Fighter A' : 'Fighter B'} - possible sharp action`
      : `Line moved ${(magnitude * 100).toFixed(1)}% toward ${direction === 'fighterA' ? 'Fighter A' : 'Fighter B'}`,
  };
}

function americanToImplied(odds: number): number {
  if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
  return 100 / (odds + 100);
}

// =============================================
// ODDS UTILITIES
// =============================================

export function americanToDecimal(american: number): number {
  if (american < 0) return 1 + (100 / Math.abs(american));
  return 1 + (american / 100);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

export function impliedProbability(american: number): number {
  return americanToImplied(american);
}
