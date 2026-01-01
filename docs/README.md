# PoweredByPace Documentation

**Complete guide to understanding and working with PoweredByPace.**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Database](#database)
5. [Development](#development)
6. [API Reference](#api-reference)
7. [Testing](#testing)
8. [Reference Docs](#reference-documentation)

---

## Quick Start

### What It Does

Helps groups of friends track badminton games (doubles or singles) during a session and automatically calculates:
- Wins/losses per player
- Win rates and point statistics (always shown)
- ELO ratings and leaderboard rankings
- Partner synergy and opponent matchups
- Gambling net (from per-game bets, optional)
- Final money settlement (who owes the organizer how much)

### Getting Started

```bash
npm install
npm run dev
# Open http://localhost:3000
```

See [SETUP_BACKEND.md](SETUP_BACKEND.md) for database setup.

---

## Features

### Core Features

**Session Management**
- Create sessions with players and financial settings
- Edit session name and date after creation
- Delete sessions with confirmation
- Search standalone sessions by name

**Game Modes**
- **Doubles**: 4-6 players, team-based gameplay
- **Singles**: 2-6 players, 1v1 matchups
- Simplified UI for singles (player names instead of Team A/B)

**Game Recording**
- Quick game logging with team/player selection
- Round robin scheduling (optional)
- Pre-fill from scheduled games
- Auto-select last player in 4-player doubles mode

**Stats & Calculations**
- Real-time win/loss tracking
- Win rate and point statistics (always shown)
- Automatic settlement calculations
- Shareable summary text

### Groups Feature

**Group Management**
- Create recurring badminton groups
- Shareable links (no accounts required)
- Delete groups with all sessions (confirmation required)

**Player Pool**
- Maintain player pool per group
- Quick-add players when creating sessions
- Link session players to group pool

**Cross-Session Tracking**
- View all sessions within a group
- Aggregated player statistics across sessions
- Track players over time

### Leaderboard & Player Stats (NEW)

**ELO Rating System**
- All players start at 1500 ELO
- Ratings update automatically when games are completed
- Higher-rated players gain less from beating lower-rated opponents
- Upset wins result in larger rating changes

**Leaderboard Tab**
- Ranked view of all group players by ELO
- Shows W-L record, win rate, and trend arrows
- Recent form displayed (last 5 games)
- Click any player to view detailed stats

**Player Profile**
- Comprehensive stats: W-L, win rate, points +/-
- **Partner Synergy**: Win rates with each doubles partner
- **Opponent Matchups**: Win rates against each opponent
- Current streak tracking (win/loss)
- Labels for "Hot Duo", "Nemesis", etc.

### Optional Betting

- **Toggle**: Enable/disable per session (default: OFF)
- **Universal Stats**: Win rate, points always shown
- **Conditional UI**: Betting fields only when enabled
- **Stats-Only Mode**: Use app without betting

### Performance Optimizations

- **Lightweight APIs**: Summary endpoint for dashboard (~80% smaller payload)
- **Batch Queries**: Eliminated N+1 problems
- **Smart Caching**: Duplicate call prevention
- **Lazy Loading**: Data loaded only when needed
- **Instant Tab Switching**: No refresh on tab clicks
- **Smart Refresh**: Only refreshes when returning to page

---

## Architecture

### Frontend vs Backend

This is a **full-stack Next.js application** with clear separation.

**Frontend (Client-Side)**
- **Location**: `app/**/*.tsx` (except `app/api/`), `components/`, `contexts/`
- **Purpose**: UI rendering, user interactions, client-side calculations
- **State**: React Context API with optimistic updates
- **Key Files**:
  - `app/dashboard/page.tsx` - Dashboard
  - `app/create-session/page.tsx` - Create session
  - `app/group/[id]/page.tsx` - Group detail with Leaderboard
  - `app/session/[id]/page.tsx` - Live session
  - `components/PlayerProfileSheet.tsx` - Player profile modal
  - `contexts/SessionContext.tsx` - State management
  - `lib/api/client.ts` - API client

**Backend (Server-Side)**
- **Location**: `app/api/**/*.ts`, `lib/services/**/*.ts`
- **Purpose**: HTTP requests, database operations, business logic
- **Key Files**:
  - `app/api/sessions/route.ts` - Session endpoints
  - `app/api/groups/[id]/stats/route.ts` - Leaderboard endpoint
  - `lib/services/sessionService.ts` - Session operations
  - `lib/services/groupService.ts` - Group operations
  - `lib/services/statsService.ts` - Leaderboard & player stats
  - `lib/services/eloService.ts` - ELO calculations
  - `lib/supabase.ts` - Database client

### Data Flow

```
User Action (Frontend)
    ↓
ApiClient (Frontend)
    ↓ HTTP Request
API Route (Backend)
    ↓
Service Layer (Backend)
    ↓
Supabase Database
    ↓ JSON Response
Frontend Updates UI
```

### Data Model

```typescript
Group {
  id, name, shareableLink, createdAt
}

GroupPlayer {
  id, groupId, name, eloRating, createdAt
}

Session {
  id, name, date, players[], organizerId,
  courtCostType, courtCostValue, birdCostTotal, betPerPlayer,
  gameMode: "doubles" | "singles",
  groupId?: string,
  bettingEnabled: boolean
}

Player {
  id, name,
  groupPlayerId?: string  // Links to group pool
}

Game {
  id, sessionId, gameNumber,
  teamA: [playerId, playerId] | [playerId],
  teamB: [playerId, playerId] | [playerId],
  winningTeam: "A" | "B",
  teamAScore?, teamBScore?
}
```

See [engineering/architecture.md](engineering/architecture.md) for detailed architecture.

---

## Database

### Overview

PoweredByPace uses **PostgreSQL** hosted on **Supabase**.

**Tables:**
- `groups` - Badminton groups with shareable links
- `group_players` - Player pool per group (includes `elo_rating`)
- `sessions` - Badminton sessions (can belong to a group)
- `players` - Session players (can link to group players)
- `games` - Individual games within sessions
- `migrations` - Tracks applied database migrations

### Automatic Migrations

Migrations run **automatically on every Vercel deployment**:

```
Push to GitHub → Vercel builds → postbuild runs → Migrations applied
```

**How it works:**
1. `postbuild` npm script runs after `next build`
2. Scans `scripts/migrations/` for SQL files (001-xxx.sql, 002-xxx.sql, ...)
3. Checks `migrations` table for already-applied versions
4. Runs only pending migrations
5. Records each migration to prevent re-running

**Migration files:**
```
scripts/migrations/
├── 001-add-groups.sql       # Groups feature tables
├── 002-add-elo-rating.sql   # ELO rating column
└── README.md                # Detailed guide
```

See [engineering/database.md](engineering/database.md) for full database documentation.

---

## Development

### Project Structure

```
app/
├── page.tsx              # Home (landing)
├── dashboard/            # Dashboard
├── create-group/         # Create group
├── create-session/       # Create session
├── group/[id]/           # Group detail (Sessions, Leaderboard, Players)
├── session/[id]/         # Live session
└── api/                  # API routes [BACKEND]
    ├── groups/[id]/
    │   ├── stats/        # Leaderboard endpoint
    │   └── players/[id]/stats/  # Player profile endpoint
    └── sessions/

components/               # React components
├── PlayerProfileSheet.tsx  # Player profile modal
└── ...

lib/
├── api/client.ts        # API client [FRONTEND]
├── services/            # Database services [BACKEND]
│   ├── statsService.ts    # Leaderboard & player stats
│   └── eloService.ts      # ELO calculations
├── calculations.ts      # Stats calculations [FRONTEND]
├── migration.ts         # Migration system
└── roundRobin.ts        # Round robin scheduling

scripts/migrations/      # Database migrations (auto-applied)
types/index.ts          # TypeScript type definitions
```

### Key Concepts

- **Groups**: Recurring playing groups with shareable links
- **Sessions**: Individual badminton sessions (can belong to a group or standalone)
- **Players**: Can be linked to group player pool for cross-session tracking
- **ELO**: Skill rating that updates after each game
- **Betting**: Optional per-session feature (default: OFF)
- **Stats**: Universal stats always shown; betting stats when enabled

---

## API Reference

### Endpoints

**Sessions**
- `GET /api/sessions` - Get all sessions (full details)
- `GET /api/sessions/summary` - Get lightweight summaries (dashboard)
- `GET /api/sessions/[id]` - Get one session
- `POST /api/sessions` - Create session
- `DELETE /api/sessions/[id]` - Delete session

**Groups**
- `GET /api/groups` - Get all groups
- `GET /api/groups/[id]` - Get one group
- `GET /api/groups/[id]/sessions` - Get group sessions
- `GET /api/groups/[id]/players` - Get player pool
- `POST /api/groups` - Create group
- `DELETE /api/groups/[id]` - Delete group

**Stats (NEW)**
- `GET /api/groups/[id]/stats` - Get leaderboard
- `GET /api/groups/[id]/players/[playerId]/stats` - Get player detailed stats

**Games**
- `GET /api/sessions/[id]/games` - Get session games
- `POST /api/sessions/[id]/games` - Create game
- `PUT /api/sessions/[id]/games/[gameId]` - Update game (triggers ELO update)
- `DELETE /api/sessions/[id]/games/[gameId]` - Delete game

See [API_ANALYSIS.md](API_ANALYSIS.md) for detailed API documentation and optimization notes.

---

## Testing

### Automated Screenshots
```bash
npm run test:screenshots
```
Captures screenshots of all features. See `screenshots/test-results/`.

### Manual Testing
See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive test scenarios.

---

## Reference Documentation

### Essential
- **[Product Overview](PRODUCT.md)** - Product vision, problem statement, roadmap
- **[Features Log](FEATURES_LOG.md)** - Complete feature development history
- **[Changelog](../CHANGELOG.md)** - Change history
- **[Testing Checklist](TESTING_CHECKLIST.md)** - Manual testing guide
- **[Design Decisions](decisions.md)** - Technical and design decisions

### Setup & Configuration
- **[Backend Setup](SETUP_BACKEND.md)** - Database setup instructions
- **[Migration Guide](../scripts/migrations/README.md)** - Database migration system

### Engineering
- **[Architecture](engineering/architecture.md)** - Frontend/backend separation, data flow
- **[Database](engineering/database.md)** - Schema, tables, relationships, migrations
- **[System Overview](engineering/system_overview.md)** - High-level system design
- **[Frontend Details](engineering/frontend.md)** - React components and state management
- **[User Flows](engineering/flows.md)** - Key interaction flows
- **[Sync Strategy](engineering/sync-strategy.md)** - Event-driven sync (no polling)
- **[Design System](engineering/design-system.md)** - Design tokens and styling
- **[Component System](engineering/component-system.md)** - Component architecture

### API & Performance
- **[API Analysis](API_ANALYSIS.md)** - API endpoint documentation and optimization

### Test Results
- **[Screenshot Test Results](screenshots/test-results/)** - Visual proof of all features

---

## License

MIT
