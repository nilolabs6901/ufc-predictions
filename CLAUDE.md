# UFC Prediction Platform - Knowledge Base

## Project Overview

AI-powered UFC fight prediction platform that calculates win probabilities using 14+ research-backed factors.

**Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Supabase)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database (see Supabase Setup below)
# Update .env with DATABASE_URL

# 3. Push schema to database
npm run db:push

# 4. Generate Prisma client
npm run db:generate

# 5. Seed mock data
npm run seed

# 6. Start dev server
npm run dev
```

## Supabase Setup

1. Go to https://supabase.com and sign in/create account
2. Click "New Project" > Choose organization > Name it "ufc-predictions"
3. Set a strong database password (SAVE THIS!)
4. Select region closest to you > Wait for provisioning (~2 min)
5. Go to Settings > Database > Connection string > URI
6. Copy the URI and replace `[YOUR-PASSWORD]` with your password
7. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
   ```

## Key Research Findings

- **UFC favorite win rate**: ~66% (NOT 75% as commonly cited)
- **Southpaw advantage**: ~3% edge vs orthodox (unfamiliarity)
- **Small cage (25ft)**: Favors grapplers and pressure fighters
- **High altitude (>1500m)**: Significantly impacts cardio
- **Grapplers vs Strikers**: ~60% win rate for grapplers

## Model Weights (v1.0.0)

| Factor | Weight | Description |
|--------|--------|-------------|
| Style Matchup | 15% | Grappler vs Striker advantages |
| Striking | 12% | SLPM, accuracy, defense |
| Grappling | 12% | Takedowns, submissions, defense |
| Historical | 12% | Streak, recent form, ring rust |
| Market Signal | 10% | Betting odds implied probability |
| Durability | 8% | Times KO'd/submitted |
| Style History | 8% | Record vs opponent's style |
| Stance Matchup | 5% | Orthodox vs southpaw dynamics |
| Championship Rounds | 4% | 5-round experience |
| Weight Class | 4% | Natural vs moved up/down |
| Altitude | 3% | High altitude acclimation |
| Cage Size | 3% | Small cage advantages |
| Physical | 2% | Reach, height advantages |
| Travel | 2% | Home country advantage |

## Data Sources

- **Primary**: UFCStats.com (0.5 req/sec rate limit for scraping)
- **Fighter images**: UFC.com CDN (licensing required for production)
- **Betting odds**: Manual entry or API integration needed

## Project Structure

```
ufc-predictions/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed/
│       └── index.ts           # Mock data seeder
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── events/
│   │   │   ├── fighters/
│   │   │   └── predictions/
│   │   ├── events/[id]/       # Event pages
│   │   ├── globals.css        # UFC-themed styles
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   └── fight-card/        # Fight card component
│   └── lib/
│       ├── database/
│       │   └── prisma.ts      # Prisma singleton
│       ├── prediction-engine/
│       │   ├── types.ts       # Type definitions
│       │   ├── config.ts      # Factor weights, matchups
│       │   ├── calculator.ts  # Main prediction logic
│       │   └── index.ts       # Public exports
│       └── services/
│           └── prediction-service.ts  # DB integration
└── CLAUDE.md                  # This file
```

## Key Files

- **Prediction Engine**: `src/lib/prediction-engine/calculator.ts`
  - Main `predictFight()` function
  - 14 factor calculations
  - Method probability calculations (KO/TKO/Sub/Dec)
  - Confidence scoring
  - Insight generation

- **Config Constants**: `src/lib/prediction-engine/config.ts`
  - Factor weights
  - Style matchup matrix
  - Streak impact values
  - Weight class KO multipliers
  - Venue altitudes

- **Database Schema**: `prisma/schema.prisma`
  - Fighter model with 40+ fields
  - FighterStats for detailed metrics
  - StancePerformance & StylePerformance
  - Event, Fight, Prediction models

## Known Issues / TODO

- [ ] Fighter images need licensing for production
- [ ] Weight class movement data not fully tracked
- [ ] Missing detailed control time metrics
- [ ] Need odds API integration for real-time data
- [ ] Backtest system not yet implemented

## Prediction Insights

The model generates up to 6 insights per fight:
- Win/loss streaks (3+ triggers insight)
- Style matchup advantages
- Striking/grappling edges
- Durability concerns (3+ KOs)
- Ring rust (12+ months off)
- Championship rounds experience

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/events` | List events (supports `?upcoming=true`) |
| `GET /api/events/[id]` | Single event with fights |
| `GET /api/predictions/[fightId]` | Generate/retrieve prediction |
| `GET /api/fighters` | Fighter list with search |
| `GET /api/fighters/[id]` | Full fighter profile |

## Environment Variables

```env
DATABASE_URL="postgresql://..."    # Supabase connection string
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Patterns & Conventions

- Calculate predictions client-side when possible to reduce load
- Cache fighter data (only changes after fights)
- Show confidence intervals for transparency
- Display factor breakdown for educational value
- Use American odds format (-150, +200)

## Styling

UFC-themed design:
- **Red**: #d20a0a (primary brand)
- **Gold**: #c9a227 (title fights, highlights)
- **Dark**: #0d0d0d (background)
- **Gray**: #1a1a1a, #2a2a2a, #3a3a3a (cards, borders)

## Model Version History

- **v1.0.0** (Current): Initial release with 14 factors
