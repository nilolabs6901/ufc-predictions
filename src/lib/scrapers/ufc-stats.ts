import axios from 'axios';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';

const BASE_URL = 'http://ufcstats.com/statistics/fighters';
const FIGHTER_URL = 'http://ufcstats.com/fighter-details';

// Rate limiter: 1 request per 2 seconds
const queue = new PQueue({
  intervalCap: 1,
  interval: parseInt(process.env.UFC_STATS_DELAY_MS || '2000')
});

// =============================================
// FIGHTER LIST SCRAPER
// =============================================

export async function scrapeAllFighters(): Promise<string[]> {
  const fighterIds: string[] = [];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const letter of alphabet) {
    console.log(`Scraping fighters starting with: ${letter.toUpperCase()}`);

    const ids = await queue.add(async () => {
      const url = `${BASE_URL}?char=${letter}&page=all`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCPredictions/1.0)' }
      });

      const $ = cheerio.load(response.data);
      const ids: string[] = [];

      $('a.b-link.b-link_style_black').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('fighter-details')) {
          const id = href.split('/').pop();
          if (id) ids.push(id);
        }
      });

      return ids;
    });

    if (ids) fighterIds.push(...ids);
  }

  console.log(`Found ${fighterIds.length} total fighters`);
  return [...new Set(fighterIds)]; // Remove duplicates
}

// =============================================
// INDIVIDUAL FIGHTER SCRAPER
// =============================================

export interface ScrapedFighter {
  ufcStatsId: string;
  name: string;
  nickname?: string;
  record: { wins: number; losses: number; draws: number; nc: number };
  height?: number; // cm
  reach?: number; // cm
  stance?: string;
  dateOfBirth?: Date;

  // Career stats
  slpm: number;
  strAcc: number;
  sapm: number;
  strDef: number;
  tdAvg: number;
  tdAcc: number;
  tdDef: number;
  subAvg: number;

  // Calculated from fight history
  winByKO: number;
  winByTKO: number;
  winBySub: number;
  winByDec: number;
  lossByKO: number;
  lossByTKO: number;
  lossBySub: number;
  lossByDec: number;
}

export async function scrapeFighter(ufcStatsId: string): Promise<ScrapedFighter | null> {
  return queue.add(async () => {
    try {
      const url = `${FIGHTER_URL}/${ufcStatsId}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCPredictions/1.0)' }
      });

      const $ = cheerio.load(response.data);

      // Name
      const name = $('span.b-content__title-highlight').text().trim();
      if (!name) return null;

      // Nickname
      const nickname = $('p.b-content__Nickname').text().trim() || undefined;

      // Record (e.g., "Record: 20-5-0 (1 NC)")
      const recordText = $('span.b-content__title-record').text().trim();
      const recordMatch = recordText.match(/(\d+)-(\d+)-(\d+)/);
      const ncMatch = recordText.match(/\((\d+) NC\)/);

      const record = {
        wins: recordMatch ? parseInt(recordMatch[1]) : 0,
        losses: recordMatch ? parseInt(recordMatch[2]) : 0,
        draws: recordMatch ? parseInt(recordMatch[3]) : 0,
        nc: ncMatch ? parseInt(ncMatch[1]) : 0,
      };

      // Bio info
      const bioItems = $('ul.b-list__box-list li');
      let height: number | undefined;
      let reach: number | undefined;
      let stance: string | undefined;
      let dateOfBirth: Date | undefined;

      bioItems.each((_, el) => {
        const text = $(el).text().trim();

        if (text.includes('Height:')) {
          const heightMatch = text.match(/(\d+)' (\d+)"/);
          if (heightMatch) {
            const feet = parseInt(heightMatch[1]);
            const inches = parseInt(heightMatch[2]);
            height = Math.round((feet * 12 + inches) * 2.54); // Convert to cm
          }
        }

        if (text.includes('Reach:')) {
          const reachMatch = text.match(/(\d+)"/);
          if (reachMatch) {
            reach = Math.round(parseInt(reachMatch[1]) * 2.54); // Convert to cm
          }
        }

        if (text.includes('STANCE:')) {
          stance = text.replace('STANCE:', '').trim().toLowerCase();
        }

        if (text.includes('DOB:')) {
          const dobText = text.replace('DOB:', '').trim();
          const dobParsed = new Date(dobText);
          if (!isNaN(dobParsed.getTime())) {
            dateOfBirth = dobParsed;
          }
        }
      });

      // Career stats from the box
      const statBoxes = $('div.b-list__info-box-left li, div.b-list__info-box li');
      let slpm = 0, strAcc = 0, sapm = 0, strDef = 0;
      let tdAvg = 0, tdAcc = 0, tdDef = 0, subAvg = 0;

      statBoxes.each((_, el) => {
        const text = $(el).text().trim();

        if (text.includes('SLpM:')) {
          const match = text.match(/SLpM:\s*([\d.]+)/);
          if (match) slpm = parseFloat(match[1]);
        }
        if (text.includes('Str. Acc.:')) {
          const match = text.match(/Str\. Acc\.:\s*([\d.]+)/);
          if (match) strAcc = parseFloat(match[1]);
        }
        if (text.includes('SApM:')) {
          const match = text.match(/SApM:\s*([\d.]+)/);
          if (match) sapm = parseFloat(match[1]);
        }
        if (text.includes('Str. Def:')) {
          const match = text.match(/Str\. Def:\s*([\d.]+)/);
          if (match) strDef = parseFloat(match[1]);
        }
        if (text.includes('TD Avg.:')) {
          const match = text.match(/TD Avg\.:\s*([\d.]+)/);
          if (match) tdAvg = parseFloat(match[1]);
        }
        if (text.includes('TD Acc.:')) {
          const match = text.match(/TD Acc\.:\s*([\d.]+)/);
          if (match) tdAcc = parseFloat(match[1]);
        }
        if (text.includes('TD Def.:')) {
          const match = text.match(/TD Def\.:\s*([\d.]+)/);
          if (match) tdDef = parseFloat(match[1]);
        }
        if (text.includes('Sub. Avg.:')) {
          const match = text.match(/Sub\. Avg\.:\s*([\d.]+)/);
          if (match) subAvg = parseFloat(match[1]);
        }
      });

      // Scrape fight history for win/loss methods
      const fightRows = $('tr.b-fight-details__table-row');
      let winByKO = 0, winByTKO = 0, winBySub = 0, winByDec = 0;
      let lossByKO = 0, lossByTKO = 0, lossBySub = 0, lossByDec = 0;

      fightRows.each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length < 8) return;

        const result = $(cols[0]).text().trim().toLowerCase();
        const method = $(cols[7]).text().trim().toUpperCase();

        if (result === 'win') {
          if (method.includes('KO') && !method.includes('TKO')) winByKO++;
          else if (method.includes('TKO')) winByTKO++;
          else if (method.includes('SUB')) winBySub++;
          else if (method.includes('DEC') || method.includes('U-DEC') || method.includes('S-DEC') || method.includes('M-DEC')) winByDec++;
        } else if (result === 'loss') {
          if (method.includes('KO') && !method.includes('TKO')) lossByKO++;
          else if (method.includes('TKO')) lossByTKO++;
          else if (method.includes('SUB')) lossBySub++;
          else if (method.includes('DEC') || method.includes('U-DEC') || method.includes('S-DEC') || method.includes('M-DEC')) lossByDec++;
        }
      });

      return {
        ufcStatsId,
        name,
        nickname,
        record,
        height,
        reach,
        stance,
        dateOfBirth,
        slpm,
        strAcc,
        sapm,
        strDef,
        tdAvg,
        tdAcc,
        tdDef,
        subAvg,
        winByKO,
        winByTKO,
        winBySub,
        winByDec,
        lossByKO,
        lossByTKO,
        lossBySub,
        lossByDec,
      };
    } catch (error) {
      console.error(`Error scraping fighter ${ufcStatsId}:`, error);
      return null;
    }
  });
}

// =============================================
// FIGHT HISTORY SCRAPER
// =============================================

export interface ScrapedFightHistory {
  eventDate: Date;
  eventName: string;
  opponent: string;
  opponentId?: string;
  outcome: 'win' | 'loss' | 'draw' | 'nc';
  method: string;
  methodDetail?: string;
  round: number;
  time: string;
  scheduledRounds: number;

  // Fight stats
  sigStrikesLanded?: number;
  sigStrikesAttempted?: number;
  takedownsLanded?: number;
  takedownsAttempted?: number;
  submissionAttempts?: number;
}

export async function scrapeFighterHistory(ufcStatsId: string): Promise<ScrapedFightHistory[]> {
  return queue.add(async () => {
    try {
      const url = `${FIGHTER_URL}/${ufcStatsId}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCPredictions/1.0)' }
      });

      const $ = cheerio.load(response.data);
      const history: ScrapedFightHistory[] = [];

      $('tr.b-fight-details__table-row').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length < 10) return;

        const resultText = $(cols[0]).text().trim().toLowerCase();
        let outcome: 'win' | 'loss' | 'draw' | 'nc';

        if (resultText === 'win') outcome = 'win';
        else if (resultText === 'loss') outcome = 'loss';
        else if (resultText === 'draw') outcome = 'draw';
        else outcome = 'nc';

        // Get opponent info
        const fighterLinks = $(cols[1]).find('a');
        const opponentLink = fighterLinks.length > 1 ? $(fighterLinks[1]) : $(fighterLinks[0]);
        const opponent = opponentLink.text().trim();
        const opponentHref = opponentLink.attr('href');
        const opponentId = opponentHref?.split('/').pop();

        // Event info
        const eventLink = $(cols[2]).find('a');
        const eventName = eventLink.text().trim();
        const dateSpan = $(cols[2]).find('span');
        const dateText = dateSpan.text().trim();
        const eventDate = new Date(dateText);

        // Method
        const methodPs = $(cols[7]).find('p');
        const method = $(methodPs[0]).text().trim();
        const methodDetail = methodPs.length > 1 ? $(methodPs[1]).text().trim() : undefined;

        // Round and time
        const round = parseInt($(cols[8]).text().trim()) || 1;
        const time = $(cols[9]).text().trim();

        // Determine scheduled rounds (main events and title fights are 5 rounds)
        const isTitleFight = eventName.toLowerCase().includes('title') ||
                           $(cols[6]).text().toLowerCase().includes('title');
        const scheduledRounds = isTitleFight ? 5 : 3;

        if (opponent && eventName && !isNaN(eventDate.getTime())) {
          history.push({
            eventDate,
            eventName,
            opponent,
            opponentId,
            outcome,
            method,
            methodDetail,
            round,
            time,
            scheduledRounds,
          });
        }
      });

      return history;
    } catch (error) {
      console.error(`Error scraping fight history for ${ufcStatsId}:`, error);
      return [];
    }
  }) || [];
}

// =============================================
// UPCOMING EVENTS SCRAPER
// =============================================

export interface ScrapedEvent {
  ufcStatsId: string;
  name: string;
  date: Date;
  location: string;
}

export async function scrapeUpcomingEvents(): Promise<ScrapedEvent[]> {
  return queue.add(async () => {
    try {
      const url = 'http://ufcstats.com/statistics/events/upcoming';
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCPredictions/1.0)' }
      });

      const $ = cheerio.load(response.data);
      const events: ScrapedEvent[] = [];

      $('tr.b-statistics__table-row').each((_, row) => {
        const link = $(row).find('a.b-link').first();
        const href = link.attr('href');
        const name = link.text().trim();

        const cols = $(row).find('td');
        const dateText = $(cols[0]).find('span').text().trim();
        const location = $(cols[1]).text().trim();

        if (href && name && dateText) {
          const ufcStatsId = href.split('/').pop() || '';
          const date = new Date(dateText);

          if (!isNaN(date.getTime())) {
            events.push({
              ufcStatsId,
              name,
              date,
              location,
            });
          }
        }
      });

      return events;
    } catch (error) {
      console.error('Error scraping upcoming events:', error);
      return [];
    }
  }) || [];
}

// =============================================
// EVENT DETAILS SCRAPER
// =============================================

export interface ScrapedEventFight {
  fighterAId: string;
  fighterAName: string;
  fighterBId: string;
  fighterBName: string;
  weightClass: string;
  isTitleFight: boolean;
  method?: string;
  round?: number;
  time?: string;
  winnerId?: string;
}

export async function scrapeEventDetails(eventId: string): Promise<ScrapedEventFight[]> {
  return queue.add(async () => {
    try {
      const url = `http://ufcstats.com/event-details/${eventId}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UFCPredictions/1.0)' }
      });

      const $ = cheerio.load(response.data);
      const fights: ScrapedEventFight[] = [];

      $('tr.b-fight-details__table-row').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length < 7) return;

        const fighterLinks = $(cols[1]).find('a');
        if (fighterLinks.length < 2) return;

        const fighterALink = $(fighterLinks[0]);
        const fighterBLink = $(fighterLinks[1]);

        const fighterAId = fighterALink.attr('href')?.split('/').pop() || '';
        const fighterBId = fighterBLink.attr('href')?.split('/').pop() || '';
        const fighterAName = fighterALink.text().trim();
        const fighterBName = fighterBLink.text().trim();

        const weightClass = $(cols[6]).text().trim();

        // Check for title fight (belt icon or text)
        const fightTypeText = $(cols[6]).text().toLowerCase();
        const isTitleFight = fightTypeText.includes('title') ||
                           $(row).find('img[src*="belt"]').length > 0;

        // Result info (for completed events)
        const resultCol = $(cols[0]).text().trim().toLowerCase();
        let winnerId: string | undefined;
        if (resultCol === 'win') {
          winnerId = fighterAId;
        }

        const method = $(cols[7])?.text().trim() || undefined;
        const round = parseInt($(cols[8])?.text().trim()) || undefined;
        const time = $(cols[9])?.text().trim() || undefined;

        if (fighterAId && fighterBId) {
          fights.push({
            fighterAId,
            fighterAName,
            fighterBId,
            fighterBName,
            weightClass: weightClass || 'Unknown',
            isTitleFight,
            method,
            round,
            time,
            winnerId,
          });
        }
      });

      return fights;
    } catch (error) {
      console.error(`Error scraping event ${eventId}:`, error);
      return [];
    }
  }) || [];
}

// =============================================
// HELPER: CLASSIFY FIGHTING STYLE
// =============================================

export function classifyFightingStyle(data: {
  tdAvg: number;
  subAvg: number;
  slpm: number;
}): string {
  const { tdAvg, subAvg, slpm } = data;

  // Wrestler: High takedown average
  if (tdAvg >= 3.0) return 'Wrestler';

  // Grappler: High submission average or combined grappling
  if (subAvg >= 1.0 || (tdAvg >= 2.0 && subAvg >= 0.5)) return 'Grappler';

  // Striker: High striking output with low grappling
  if (slpm >= 4.0 && tdAvg < 1.5) return 'Striker';

  // MMA (balanced)
  return 'MMA';
}
