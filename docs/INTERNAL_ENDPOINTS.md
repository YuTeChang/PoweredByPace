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

These endpoints help diagnose issues with data and stats. They are read-only and don't affect app performance.

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

**Response:**
```json
{
  "groupId": "group-1704000000000",
  "summary": {
    "totalGroupPlayers": 8,
    "activeGroupPlayers": 7,
    "inactiveGroupPlayers": 1,
    "totalSessions": 5,
    "totalSessionPlayers": 32,
    "linkedPlayers": 28,
    "unlinkedPlayers": 4,
    "totalGames": 20
  },
  "groupPlayers": [
    {
      "id": "gp-123",
      "name": "Alice",
      "isActive": true,
      "storedStats": { "wins": 15, "losses": 10, "total_games": 25, "elo_rating": 1125 }
    }
  ],
  "unlinkedSessionPlayers": [
    { "id": "session-123-player-5", "name": "Guest Bob", "sessionId": "session-123" }
  ],
  "recentGames": [
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
- `inactiveGroupPlayers` > 0 → Players that were removed (soft-deleted) but stats preserved
- `unlinkedPlayers` > 0 → These players' stats won't count (likely guests)
- `allLinked: false` in `recentGames` → That game didn't update stats for unlinked players
- `isActive: false` → Player was removed from group but can be re-added with stats restored

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

**Response (healthy):**
```json
{
  "ok": true,
  "db": "connected",
  "sessionsCount": 42
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

---

### 3. Migration Status

**Endpoint:** `GET /api/migrate`

**Purpose:** Check which migrations have been applied.

**Usage:**
```javascript
fetch('/api/migrate').then(r => r.json()).then(console.log)
```

---

### 4. Run Migrations

**Endpoint:** `POST /api/migrate`

**Purpose:** Apply pending database migrations.

**When to use:**
- After deployment if automatic migration failed
- When adding new features that require schema changes

**Usage:**
```javascript
fetch('/api/migrate', { method: 'POST' }).then(r => r.json()).then(console.log)
```

---

## Admin Operations

### 1. Recalculate Player Stats (ELO, W/L)

**Endpoint:** `POST /api/groups/{id}/stats`

**Purpose:** Recalculate all player ELO ratings and win/loss records from game history.

**When to use:**
- Stats seem incorrect
- After bulk game imports
- After fixing data issues

**Rate Limit:** Once per 5 minutes per group

**Usage:**
```javascript
fetch('/api/groups/YOUR_GROUP_ID/stats', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

---

### 2. Recalculate Pairing Stats

**Endpoint:** `POST /api/groups/{id}/pairings`

**Purpose:** Recalculate all pairing (doubles team) statistics.

**When to use:**
- Pairing stats seem incorrect
- After recalculating player stats

**Rate Limit:** Once per 5 minutes per group

**Usage:**
```javascript
fetch('/api/groups/YOUR_GROUP_ID/pairings', { method: 'POST' })
  .then(r => r.json()).then(console.log)
```

---

### 3. Delete Group

**Endpoint:** `DELETE /api/groups/{id}`

**Purpose:** Permanently delete a group and all its data (sessions, games, players).

**⚠️ WARNING:** This action cannot be undone!

**Usage:**
```javascript
fetch('/api/groups/YOUR_GROUP_ID', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

---

### 4. Delete Session

**Endpoint:** `DELETE /api/sessions/{id}`

**Purpose:** Permanently delete a session and all its games.

**Usage:**
```javascript
fetch('/api/sessions/YOUR_SESSION_ID', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

---

### 5. Delete Game

**Endpoint:** `DELETE /api/sessions/{sessionId}/games/{gameId}`

**Purpose:** Delete a specific game from a session.

**Usage:**
```javascript
fetch('/api/sessions/SESSION_ID/games/GAME_ID', { method: 'DELETE' })
  .then(r => r.json()).then(console.log)
```

---

### 6. Remove Player from Group

**Endpoint:** `DELETE /api/groups/{id}/players/{playerId}`

**Purpose:** Remove a player from a group's player pool (soft-delete).

**Note:** Players are soft-deleted to preserve historical data. If the same player is re-added later, their stats are restored automatically.

**Usage:**
```javascript
fetch('/api/groups/GROUP_ID/players/PLAYER_ID', { method: 'DELETE' })
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
| `/api/groups/{id}/players/{pid}` | DELETE | None | Remove player (soft-delete) |

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
3. **Debug endpoints are read-only** - They don't modify data
4. **Delete operations are permanent** - No undo, use with caution
5. **Rate limiting** on recalculation prevents abuse

---

## See Also

- [ADMIN.md](./ADMIN.md) - General admin guide (can be shared)
- [Database Schema](./engineering/database.md) - Full database documentation
- [Architecture](./engineering/architecture.md) - System architecture
