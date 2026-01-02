# Internal & Debug Endpoints

> ⚠️ **CONFIDENTIAL**: This document contains internal API endpoints for administration and debugging. Do not share publicly.

---

## Table of Contents

1. [Debug Endpoints](#debug-endpoints)
2. [Health & System Endpoints](#health--system-endpoints)
3. [Admin Operations](#admin-operations)
4. [Quick Reference](#quick-reference)

---

## How to Use These Endpoints

### Method 1: Browser Console (Easiest)

1. Go to your app: `https://poweredbypace.vercel.app`
2. Open DevTools: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Go to **Console** tab
4. Paste the JavaScript and press Enter

### Method 2: curl (Command Line)

```bash
curl https://poweredbypace.vercel.app/api/endpoint
```

---

## Debug Endpoints

These endpoints help diagnose issues with data and stats.

### 1. List All Sessions

**Endpoint:** `GET /api/debug/sessions`

**Purpose:** View all sessions with their `group_id` to check if sessions are properly linked to groups.

**When to use:**
- Sessions not appearing in a group
- Stats not updating after games
- Verifying session-to-group relationships

**Usage:**
```javascript
// Browser Console
fetch('/api/debug/sessions').then(r => r.json()).then(console.log)
```

```bash
# curl
curl https://poweredbypace.vercel.app/api/debug/sessions
```

**Response:**
```json
{
  "total": 12,
  "sessions": [
    {
      "id": "session-1704067200000",
      "name": "Monday Night",
      "group_id": "group-1704000000000",
      "group_id_type": "string",
      "created_at": "2025-01-01T00:00:00Z",
      "date": "2025-01-01T19:00:00Z"
    }
  ]
}
```

**What to look for:**
- `group_id: null` → Session not linked to any group (stats won't count)
- `group_id_type: "string"` → Correct
- Sessions listed by most recent first

---

### 2. Group Stats Debug

**Endpoint:** `GET /api/debug/group-stats?groupId={GROUP_ID}`

**Purpose:** Investigate why group stats might be wrong - shows game counts, completed vs unplayed games.

**When to use:**
- Leaderboard shows wrong W/L counts
- Total games count seems off
- Need to see breakdown by session

**Usage:**
```javascript
// Browser Console
fetch('/api/debug/group-stats?groupId=group-1704000000000')
  .then(r => r.json()).then(console.log)
```

```bash
# curl
curl "https://poweredbypace.vercel.app/api/debug/group-stats?groupId=group-1704000000000"
```

**Response:**
```json
{
  "groupId": "group-1704000000000",
  "totalSessions": 5,
  "totalGamesInDb": 45,
  "completedGamesCount": 42,
  "unplayedGamesCount": 3,
  "gamesBySession": [
    {
      "sessionId": "session-123",
      "sessionName": "Monday Night",
      "sessionDate": "2025-01-01",
      "totalGames": 10,
      "completedGames": 10,
      "unplayedGames": 0
    }
  ],
  "sampleGames": [...]
}
```

**What to look for:**
- `unplayedGamesCount` > 0 → Some games have no winner set
- `completedGamesCount` should match what you expect
- Check `gamesBySession` to find problematic sessions

---

### 3. Player Links Debug

**Endpoint:** `GET /api/debug/player-links?groupId={GROUP_ID}`

**Purpose:** Check if session players are properly linked to group players (required for stats tracking).

**When to use:**
- Player's games aren't counting toward their stats
- ELO not updating after games
- Need to verify player linking

**Usage:**
```javascript
// Browser Console
fetch('/api/debug/player-links?groupId=group-1704000000000')
  .then(r => r.json()).then(console.log)
```

```bash
# curl
curl "https://poweredbypace.vercel.app/api/debug/player-links?groupId=group-1704000000000"
```

**Response:**
```json
{
  "groupId": "group-1704000000000",
  "summary": {
    "totalGroupPlayers": 8,
    "totalSessions": 5,
    "totalSessionPlayers": 32,
    "linkedPlayers": 28,
    "unlinkedPlayers": 4,
    "totalGames": 20
  },
  "unlinkedPlayersList": [
    { "id": "session-123-player-5", "name": "Guest Bob", "session_id": "session-123" }
  ],
  "gameAnalysis": [
    {
      "gameId": "session-123-game-1",
      "winningTeam": "A",
      "teamA": [
        { "name": "Alice", "linked": true, "groupPlayerId": "gp-123" },
        { "name": "Bob", "linked": true, "groupPlayerId": "gp-456" }
      ],
      "teamB": [...],
      "allLinked": true
    }
  ]
}
```

**What to look for:**
- `unlinkedPlayers` > 0 → These players' stats won't count
- `allLinked: false` in `gameAnalysis` → That game didn't update stats for unlinked players
- Check `unlinkedPlayersList` to see who needs to be linked

---

## Health & System Endpoints

### 1. Database Health Check

**Endpoint:** `GET /api/health/db`

**Purpose:** Verify database connectivity.

**When to use:**
- App seems slow or unresponsive
- Checking if Supabase is up
- After deployment to verify DB connection

**Usage:**
```javascript
fetch('/api/health/db').then(r => r.json()).then(console.log)
```

```bash
curl https://poweredbypace.vercel.app/api/health/db
```

**Response (healthy):**
```json
{
  "ok": true,
  "db": "connected",
  "sessionsCount": 42
}
```

**Response (error):**
```json
{
  "ok": false,
  "db": "error",
  "error": "Connection refused"
}
```

---

### 2. Database Initialization

**Endpoint:** `POST /api/init`

**Purpose:** Initialize database schema for new installations.

**When to use:**
- First time setup
- After creating a new Supabase project
- If tables are missing

**Usage:**
```javascript
fetch('/api/init', { method: 'POST' }).then(r => r.json()).then(console.log)
```

```bash
curl -X POST https://poweredbypace.vercel.app/api/init
```

---

### 3. Database Migrations

**Endpoint:** `GET /api/migrate` (check status) | `POST /api/migrate` (run migrations)

**Purpose:** Run database migrations to update schema.

**When to use:**
- After deployment with new features
- If new tables/columns are needed
- To check which migrations have been applied

**Check Status:**
```javascript
fetch('/api/migrate').then(r => r.json()).then(console.log)
```

**Run Migrations:**
```javascript
fetch('/api/migrate', { method: 'POST' }).then(r => r.json()).then(console.log)
```

**Response:**
```json
{
  "success": true,
  "message": "Migrations completed",
  "applied": ["001-add-groups", "002-add-elo-rating", "003-add-player-stats", "004-add-pairing-stats"]
}
```

---

## Admin Operations

### 1. Recalculate Individual Player Stats

**Endpoint:** `POST /api/groups/{GROUP_ID}/stats`

**Purpose:** Rebuild all ELO ratings and W/L records from game history.

**When to use:**
- Stats appear out of sync with actual games
- After manually editing database
- After fixing a bug that affected stats

**Rate Limit:** 1 request per 5 minutes per group

**Usage:**
```javascript
fetch('/api/groups/group-1704000000000/stats', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

```bash
curl -X POST https://poweredbypace.vercel.app/api/groups/group-1704000000000/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Stats recalculated successfully",
  "playersReset": 8,
  "gamesProcessed": 45,
  "playersUpdated": ["Alice", "Bob", "Charlie"]
}
```

---

### 2. Recalculate Pairing Stats

**Endpoint:** `POST /api/groups/{GROUP_ID}/pairings`

**Purpose:** Rebuild all partner stats and head-to-head matchup records.

**When to use:**
- Pairings tab shows wrong data
- After running individual stats recalculation
- Partnership records seem incorrect

**Rate Limit:** 1 request per 5 minutes per group

**Usage:**
```javascript
fetch('/api/groups/group-1704000000000/pairings', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

```bash
curl -X POST https://poweredbypace.vercel.app/api/groups/group-1704000000000/pairings
```

---

### 3. Delete Operations

#### Delete a Group (⚠️ Destructive)
```javascript
// Deletes group AND all sessions, players, games, stats
fetch('/api/groups/group-1704000000000', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

#### Delete a Session (⚠️ Destructive)
```javascript
// Deletes session AND all its players and games
fetch('/api/sessions/session-1704067200000', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

#### Delete a Game
```javascript
// Deletes game and reverses its stats impact
fetch('/api/sessions/session-123/games/session-123-game-5', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

#### Delete a Player from Group Pool
```javascript
fetch('/api/groups/group-123/players/gp-456', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

---

## Quick Reference

### Debug Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/debug/sessions` | GET | List all sessions with group links |
| `/api/debug/group-stats?groupId=xxx` | GET | Game counts and breakdown by session |
| `/api/debug/player-links?groupId=xxx` | GET | Check player linking status |

### Health Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health/db` | GET | Database connectivity check |
| `/api/init` | POST | Initialize database schema |
| `/api/migrate` | GET | Check migration status |
| `/api/migrate` | POST | Run pending migrations |

### Admin Operations

| Endpoint | Method | Rate Limit | Purpose |
|----------|--------|------------|---------|
| `/api/groups/{id}/stats` | POST | 5 min | Recalculate ELO/W-L |
| `/api/groups/{id}/pairings` | POST | 5 min | Recalculate pairing stats |
| `/api/groups/{id}` | DELETE | None | Delete entire group |
| `/api/sessions/{id}` | DELETE | None | Delete session |
| `/api/sessions/{sid}/games/{gid}` | DELETE | None | Delete game |
| `/api/groups/{id}/players/{pid}` | DELETE | None | Remove player from pool |

---

## Troubleshooting Workflow

### "Stats are wrong"

1. **Check group stats:**
   ```javascript
   fetch('/api/debug/group-stats?groupId=YOUR_GROUP_ID').then(r=>r.json()).then(console.log)
   ```

2. **Check player links:**
   ```javascript
   fetch('/api/debug/player-links?groupId=YOUR_GROUP_ID').then(r=>r.json()).then(console.log)
   ```

3. **If issues found, recalculate:**
   ```javascript
   fetch('/api/groups/YOUR_GROUP_ID/stats', {method:'POST'}).then(r=>r.json()).then(console.log)
   fetch('/api/groups/YOUR_GROUP_ID/pairings', {method:'POST'}).then(r=>r.json()).then(console.log)
   ```

### "Session not appearing in group"

1. **Check sessions:**
   ```javascript
   fetch('/api/debug/sessions').then(r=>r.json()).then(console.log)
   ```

2. **Look for `group_id: null`** - Session not linked

### "Database issues"

1. **Check health:**
   ```javascript
   fetch('/api/health/db').then(r=>r.json()).then(console.log)
   ```

2. **Run migrations:**
   ```javascript
   fetch('/api/migrate', {method:'POST'}).then(r=>r.json()).then(console.log)
   ```

---

## Security Notes

1. **No authentication** - Anyone with endpoint URLs can access them
2. **Keep this document private** - Don't share with regular users
3. **Debug endpoints expose internal data** - Session IDs, player IDs, etc.
4. **Delete operations are permanent** - No undo, use with caution
5. **Rate limiting** on recalculation prevents abuse

---

## See Also

- [ADMIN.md](./ADMIN.md) - General admin guide (can be shared)
- [Database Schema](./engineering/database.md) - Full database documentation
- [Architecture](./engineering/architecture.md) - System architecture
