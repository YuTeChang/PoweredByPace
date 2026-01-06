# Real-Time Sync Strategy

## Current Approach: Event-Driven Sync with Manual Refresh

The app uses an **event-driven sync strategy** with optimistic updates and manual refresh capabilities for multi-user scenarios.

## Strategy Overview

### 1. Optimistic Updates (Immediate UI Response)
- User action → UI updates **immediately** (optimistic)
- API call happens in **background**
- If API fails → Rollback optimistic update and show error

### 2. Always Fetch Fresh Data
- **Page loads**: Always fetch from API (no stale cache)
- **Multi-user sync**: Users see latest data from all participants
- **Manual refresh**: "Sync" button to pull latest data on demand

### 3. Minimal Local Storage
- **sessionStorage**: Current session ID only (for navigation)
- **localStorage**: Recent groups only (user preference, max 3)
- **No caching**: Sessions, games, and stats always fetched fresh from API

## Implementation

### Current: Event-Driven with Optimistic Updates

```typescript
// In SessionContext.tsx
const addGame = async (game) => {
  // 1. Optimistic update
  const tempId = `game-${Date.now()}-${Math.random()}`;
  const newGame = { id: tempId, ...game };
  setGames(prev => [...prev, newGame]);
  
  // 2. Sync to server (background)
  try {
    const createdGame = await ApiClient.createGame(sessionId, game);
    // Replace temp with real game from API
    setGames(prev => prev.map(g => g.id === tempId ? createdGame : g));
  } catch (error) {
    // Rollback on error
    setGames(prev => prev.filter(g => g.id !== tempId));
    throw error;
  }
};
```

### Manual Refresh for Multi-User Sync

```typescript
// In session page
const handleRefresh = async () => {
  setIsRefreshing(true);
  try {
    // Reload session and games from API
    await loadSession(sessionId);
    setLastRefreshed(new Date());
  } catch (error) {
    console.error('Failed to refresh:', error);
  } finally {
    setIsRefreshing(false);
  }
};
```

## Why No localStorage Caching?

### Problems with localStorage Caching:
1. **Stale Data**: Users see outdated games when others record new ones
2. **Multi-User Issues**: Each user's cache is independent, causing sync problems
3. **Complexity**: ~300 lines of sync logic, hard to debug
4. **False Offline Support**: API required anyway, so "offline" mode doesn't work
5. **Inconsistent State**: Cache can diverge from database

### Benefits of API-First Approach:
- ✅ **Always Fresh**: Users see latest data from all participants
- ✅ **Simpler Code**: 50% less code in SessionContext
- ✅ **Multi-User Works**: No stale cache issues
- ✅ **Easier Debugging**: One source of truth (database)
- ✅ **Better UX**: Manual sync button gives users control

## Sync Triggers

```typescript
// Sync happens on these events:
1. Page load → GET /api/sessions/[id] + GET games
2. User creates session → POST /api/sessions
3. User adds game → POST /api/sessions/[id]/games
4. User updates game → PUT /api/sessions/[id]/games/[id]
5. User deletes game → DELETE /api/sessions/[id]/games/[id]
6. User clicks "Sync" → GET /api/sessions/[id] + GET games
```

## Error Handling

```typescript
// If API call fails:
1. Rollback optimistic update
2. Show error message to user
3. Throw error for caller to handle
4. User can retry action
```

## Multi-User Conflict Resolution

```typescript
// If multiple users edit simultaneously:
1. Last write wins (simple approach)
2. Manual "Sync" button to pull latest changes
3. Users can see "Last synced" timestamp
```

## Performance Considerations

### API Call Frequency
- **Event-driven**: 1-3 calls per user action
- **Page load**: 2 calls (session + games)
- **Manual sync**: 2 calls (session + games)

### Database Load
- **Event-driven**: Only on user actions
- **No polling**: Zero background queries
- **Efficient**: Minimal API calls, maximum freshness

## User Experience

### Current Implementation
- ✅ Instant UI updates (optimistic)
- ✅ Always shows fresh data on load
- ✅ Manual "Sync" button for multi-user scenarios
- ✅ "Last synced" timestamp for transparency
- ✅ Fast and responsive
- ✅ Multi-user sessions work correctly
- ✅ No stale data issues

## Future Enhancements

### Smart Polling (Optional)
Only add if users request automatic sync:
- Poll only when session is active
- Detect multiple users (based on activity)
- Poll interval: 5-10 seconds
- Stop when inactive

### WebSockets (Optional)
Only add for high concurrent usage:
- Real-time bidirectional communication
- Server pushes updates to clients
- Requires WebSocket infrastructure
- Best for 10+ simultaneous users

## Recommendation

**For PoweredByPace's current usage:**
- ✅ **Use event-driven sync** (current approach)
- ✅ **Manual "Sync" button** (implemented)
- ✅ **Optimistic updates** (instant feedback)
- ✅ **Always fetch fresh** (no stale cache)
- ❌ **Don't add polling** (not needed yet)

**When to add smart polling:**
- Multiple users editing same session regularly
- Users request "auto-sync" feature
- Usage justifies the added complexity

**When to add WebSockets:**
- High concurrent usage (10+ simultaneous users)
- Real-time collaboration is critical
- Budget allows for WebSocket infrastructure
