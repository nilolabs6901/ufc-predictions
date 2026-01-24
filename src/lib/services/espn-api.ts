/**
 * ESPN MMA API Service
 * Fetches real UFC data from ESPN's public API
 */

const ESPN_BASE_URL = 'https://site.api.espn.com/apis';

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  venue?: {
    fullName: string;
    city: string;
    state?: string;
    country: string;
  };
  competitions: ESPNFight[];
}

export interface ESPNFight {
  id: string;
  weightClass: string;
  competitors: ESPNCompetitor[];
  status: {
    type: {
      completed: boolean;
    };
  };
}

export interface ESPNCompetitor {
  id: string;
  athlete: {
    id: string;
    fullName: string;
    displayName: string;
    shortName: string;
  };
  winner?: boolean;
}

export interface ESPNAthlete {
  id: string;
  fullName: string;
  displayName: string;
  nickname?: string;
  dateOfBirth?: string;
  height?: number; // inches
  weight?: number; // lbs
  reach?: number; // inches
  citizenship?: string;
  stance?: string;
  fightingStyle?: string;
  record?: {
    wins: number;
    losses: number;
    draws: number;
    knockouts?: number;
    submissions?: number;
    decisions?: number;
  };
  team?: {
    displayName: string;
  };
}

/**
 * Fetch upcoming UFC events from ESPN
 */
export async function getUpcomingEvents(): Promise<ESPNEvent[]> {
  const response = await fetch(
    `${ESPN_BASE_URL}/site/v2/sports/mma/ufc/scoreboard`
  );

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = await response.json();
  return data.events || [];
}

/**
 * Fetch detailed athlete/fighter information
 */
export async function getAthlete(athleteId: string): Promise<ESPNAthlete | null> {
  try {
    const response = await fetch(
      `${ESPN_BASE_URL}/common/v3/sports/mma/ufc/athletes/${athleteId}`
    );

    if (!response.ok) {
      console.error(`Failed to fetch athlete ${athleteId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const athlete = data.athlete;

    if (!athlete) return null;

    // Parse height from string like "5'11\"" to inches
    const parseHeight = (heightStr?: string): number | undefined => {
      if (!heightStr) return undefined;
      const match = heightStr.match(/(\d+)'(\d+)/);
      if (match) {
        return parseInt(match[1]) * 12 + parseInt(match[2]);
      }
      return undefined;
    };

    // Parse reach from string like "70\"" to inches
    const parseReach = (reachStr?: string): number | undefined => {
      if (!reachStr) return undefined;
      const match = reachStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    };

    // Extract record from statistics
    const stats = athlete.statistics || [];
    const recordStat = stats.find((s: any) => s.name === 'record');
    let record = { wins: 0, losses: 0, draws: 0 };

    if (recordStat?.displayValue) {
      const parts = recordStat.displayValue.split('-').map((n: string) => parseInt(n));
      record = {
        wins: parts[0] || 0,
        losses: parts[1] || 0,
        draws: parts[2] || 0,
      };
    }

    // Get KO/Sub/Dec breakdown
    const koStat = stats.find((s: any) => s.name === 'koTkoWins');
    const subStat = stats.find((s: any) => s.name === 'submissionWins');
    const decStat = stats.find((s: any) => s.name === 'decisionWins');

    return {
      id: athlete.id,
      fullName: athlete.fullName || athlete.displayName,
      displayName: athlete.displayName,
      nickname: athlete.nickname,
      dateOfBirth: athlete.dateOfBirth,
      height: parseHeight(athlete.displayHeight),
      weight: athlete.weight,
      reach: parseReach(athlete.displayReach),
      citizenship: athlete.citizenship?.country?.name,
      stance: athlete.stance?.toLowerCase(),
      fightingStyle: athlete.style,
      record: {
        ...record,
        knockouts: koStat ? parseInt(koStat.displayValue) : undefined,
        submissions: subStat ? parseInt(subStat.displayValue) : undefined,
        decisions: decStat ? parseInt(decStat.displayValue) : undefined,
      },
      team: athlete.team,
    };
  } catch (error) {
    console.error(`Error fetching athlete ${athleteId}:`, error);
    return null;
  }
}

/**
 * Fetch all fighters for an event
 */
export async function getEventFighters(eventId: string): Promise<Map<string, ESPNAthlete>> {
  const fighters = new Map<string, ESPNAthlete>();

  // First get the event details
  const response = await fetch(
    `${ESPN_BASE_URL}/site/v2/sports/mma/ufc/scoreboard`
  );

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = await response.json();
  const event = data.events?.find((e: any) => e.id === eventId);

  if (!event) {
    throw new Error(`Event ${eventId} not found`);
  }

  // Extract all athlete IDs from the event
  const athleteIds: string[] = [];
  for (const competition of event.competitions || []) {
    for (const competitor of competition.competitors || []) {
      if (competitor.athlete?.id) {
        athleteIds.push(competitor.athlete.id);
      }
    }
  }

  // Fetch detailed info for each athlete
  for (const athleteId of athleteIds) {
    const athlete = await getAthlete(athleteId);
    if (athlete) {
      fighters.set(athleteId, athlete);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return fighters;
}

/**
 * Convert ESPN height (inches) to cm
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

/**
 * Determine fighting style from ESPN data
 */
export function determineFightingStyle(espnStyle?: string, record?: ESPNAthlete['record']): string {
  if (espnStyle) {
    const style = espnStyle.toLowerCase();
    if (style.includes('striker') || style.includes('boxing') || style.includes('muay thai')) {
      return 'Striker';
    }
    if (style.includes('grappl') || style.includes('wrestling')) {
      return 'Grappler';
    }
    if (style.includes('jiu') || style.includes('bjj') || style.includes('submission')) {
      return 'Grappler';
    }
  }

  // Infer from record if no style specified
  if (record) {
    const total = (record.knockouts || 0) + (record.submissions || 0) + (record.decisions || 0);
    if (total > 0) {
      const koPercent = (record.knockouts || 0) / total;
      const subPercent = (record.submissions || 0) / total;

      if (koPercent > 0.5) return 'Striker';
      if (subPercent > 0.4) return 'Grappler';
    }
  }

  return 'MMA';
}
