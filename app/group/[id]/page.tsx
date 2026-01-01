"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Group, GroupPlayer, Session, LeaderboardEntry, PlayerDetailedStats } from "@/types";
import { ApiClient } from "@/lib/api/client";
import { formatPercentage } from "@/lib/calculations";
import { PlayerProfileSheet } from "@/components/PlayerProfileSheet";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [players, setPlayers] = useState<GroupPlayer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "leaderboard" | "players">("sessions");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Player profile modal state
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerDetailedStats | null>(null);
  const [isLoadingPlayerStats, setIsLoadingPlayerStats] = useState(false);

  // Load group and sessions immediately (fast initial render)
  const loadGroupData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Only load group and sessions initially - players/leaderboard load lazily
      const [fetchedGroup, fetchedSessions] = await Promise.all([
        ApiClient.getGroup(groupId),
        ApiClient.getGroupSessions(groupId).catch(() => []),
      ]);
      
      setGroup(fetchedGroup);
      setSessions(fetchedSessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Lazy load players only when Players tab is clicked
  const loadPlayers = useCallback(async () => {
    if (playersLoadedRef.current) return;
    
    playersLoadedRef.current = true;
    setIsLoadingPlayers(true);
    try {
      const fetchedPlayers = await ApiClient.getGroupPlayers(groupId);
      setPlayers(fetchedPlayers || []);
    } catch (err) {
      console.error('[GroupPage] Error fetching players:', err);
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [groupId]);

  // Lazy load leaderboard only when Leaderboard tab is clicked
  const loadLeaderboard = useCallback(async () => {
    if (leaderboardLoadedRef.current) return;
    
    leaderboardLoadedRef.current = true;
    setIsLoadingLeaderboard(true);
    try {
      const fetchedLeaderboard = await ApiClient.getGroupLeaderboard(groupId);
      setLeaderboard(fetchedLeaderboard || []);
    } catch (err) {
      console.error('[GroupPage] Error fetching leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [groupId]);

  // Load player detailed stats
  const loadPlayerStats = async (playerId: string) => {
    setIsLoadingPlayerStats(true);
    try {
      const stats = await ApiClient.getPlayerDetailedStats(groupId, playerId);
      setSelectedPlayerStats(stats);
    } catch (err) {
      console.error('[GroupPage] Error fetching player stats:', err);
    } finally {
      setIsLoadingPlayerStats(false);
    }
  };

  // Track last load time to prevent duplicate calls
  const lastLoadRef = useRef<number>(0);
  const REFRESH_DEBOUNCE_MS = 500;
  
  // Track if data has been loaded
  const playersLoadedRef = useRef<boolean>(false);
  const leaderboardLoadedRef = useRef<boolean>(false);

  // Single effect to load data on mount and when groupId changes
  useEffect(() => {
    const needsRefreshKey = `group_${groupId}_needs_refresh`;
    const needsRefresh = typeof window !== "undefined" && sessionStorage.getItem(needsRefreshKey) !== null;
    
    if (needsRefresh) {
      sessionStorage.removeItem(needsRefreshKey);
      setTimeout(() => {
        loadGroupData();
        // Reset lazy load flags on refresh
        leaderboardLoadedRef.current = false;
      }, 500);
      return;
    }
    
    const now = Date.now();
    if (now - lastLoadRef.current >= REFRESH_DEBOUNCE_MS) {
      lastLoadRef.current = now;
      loadGroupData();
    }
  }, [groupId, loadGroupData]);

  // Lazy load data when tabs are clicked
  useEffect(() => {
    if (activeTab === 'players') {
      loadPlayers();
    } else if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, loadPlayers, loadLeaderboard]);

  // Track navigation for refresh handling
  const hasNavigatedAwayRef = useRef(false);
  const prevPathnameRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (pathname === `/group/${groupId}`) {
      const prevPath = prevPathnameRef.current;
      if (prevPath !== null && prevPath !== pathname) {
        const isReturningFromCreateSession = prevPath === '/create-session' || prevPath?.startsWith('/create-session');
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadRef.current;
        
        if (isReturningFromCreateSession || timeSinceLastLoad > REFRESH_DEBOUNCE_MS) {
          lastLoadRef.current = now;
          leaderboardLoadedRef.current = false; // Reset leaderboard on return
          if (isReturningFromCreateSession) {
            setTimeout(() => loadGroupData(), 500);
          } else {
            loadGroupData();
          }
        }
      }
      prevPathnameRef.current = pathname;
    } else {
      if (prevPathnameRef.current === `/group/${groupId}`) {
        hasNavigatedAwayRef.current = true;
      }
      prevPathnameRef.current = pathname;
    }
  }, [pathname, groupId, loadGroupData]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    setIsAddingPlayer(true);
    try {
      const result = await ApiClient.addGroupPlayer(groupId, newPlayerName.trim());
      // Add player with default stats
      const newPlayer = {
        ...result.player,
        wins: 0,
        losses: 0,
        totalGames: 0,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      // Reset leaderboard cache so it reloads with new player
      leaderboardLoadedRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await ApiClient.removeGroupPlayer(groupId, playerId);
      setPlayers(players.filter((p) => p.id !== playerId));
      // Reset leaderboard cache
      leaderboardLoadedRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove player");
    }
  };

  const handleRefreshLeaderboard = () => {
    leaderboardLoadedRef.current = false;
    loadLeaderboard();
  };

  const getShareableUrl = () => {
    if (!group) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/group/shareable/${group.shareableLink}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formatDateWithTime = (date: Date) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} ${timeStr}`;
  };

  // Render trend indicator
  const renderTrend = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <span className="text-green-500 text-sm">↑</span>;
    if (trend === 'down') return <span className="text-red-500 text-sm">↓</span>;
    return <span className="text-japandi-text-muted text-sm">-</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-japandi-background-primary flex items-center justify-center">
        <div className="text-japandi-text-secondary">Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-japandi-background-primary py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-japandi-text-primary mb-4">Group Not Found</h1>
          <p className="text-japandi-text-secondary mb-6">{error || "This group does not exist."}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white font-semibold rounded-full transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-japandi-background-primary pb-24">
      {/* Header */}
      <div className="bg-japandi-background-card border-b border-japandi-border-light py-4 sm:py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-japandi-accent-primary hover:text-japandi-accent-hover text-sm transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="flex items-start justify-between mt-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-japandi-text-primary">
                {group.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-japandi-text-muted">Share:</span>
                <code className="text-sm text-japandi-accent-primary bg-japandi-background-primary px-2 py-1 rounded">
                  {group.shareableLink}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="text-sm text-japandi-accent-primary hover:text-japandi-accent-hover transition-colors"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
            <button
              onClick={async () => {
                const confirmed = window.confirm("Are you sure you want to delete this group? This will also delete all sessions in this group. This action cannot be undone.");
                if (!confirmed) return;
                setIsDeleting(true);
                try {
                  await ApiClient.deleteGroup(groupId);
                  router.push("/");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to delete group");
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50 touch-manipulation"
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-japandi-background-card border-b border-japandi-border-light">
        <div className="max-w-2xl mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-japandi-accent-primary text-japandi-accent-primary"
                : "border-transparent text-japandi-text-muted hover:text-japandi-text-primary"
            }`}
          >
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "leaderboard"
                ? "border-japandi-accent-primary text-japandi-accent-primary"
                : "border-transparent text-japandi-text-muted hover:text-japandi-text-primary"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("players")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "players"
                ? "border-japandi-accent-primary text-japandi-accent-primary"
                : "border-transparent text-japandi-text-muted hover:text-japandi-text-primary"
            }`}
          >
            Players
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-japandi-text-primary">Sessions</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => loadGroupData()}
                  className="px-3 py-2 bg-japandi-background-card hover:bg-japandi-background-primary text-japandi-text-primary text-sm font-medium rounded-full border border-japandi-border-light transition-all"
                  title="Refresh sessions list"
                >
                  ↻ Refresh
                </button>
                <Link
                  href={`/create-session?groupId=${groupId}`}
                  className="px-4 py-2 bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white text-sm font-semibold rounded-full transition-all"
                >
                  + New Session
                </Link>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12 text-japandi-text-muted">
                <p className="mb-4">No sessions yet</p>
                <Link
                  href={`/create-session?groupId=${groupId}`}
                  className="text-japandi-accent-primary hover:text-japandi-accent-hover"
                >
                  Create your first session
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    prefetch={false}
                    className="block bg-japandi-background-card border border-japandi-border-light rounded-card p-4 shadow-soft hover:border-japandi-accent-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-japandi-text-primary">
                        {session.name || formatDateWithTime(session.date)}
                      </h3>
                      <span className="text-xs text-japandi-accent-primary bg-japandi-background-primary px-2 py-1 rounded-full">
                        {session.players.length} players
                      </span>
                    </div>
                    <div className="text-sm text-japandi-text-muted">
                      {formatDateWithTime(session.date)} • {session.gameMode === "singles" ? "Singles" : "Doubles"}
                      {session.bettingEnabled && " • Betting"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-japandi-text-primary">Leaderboard</h2>
              <button
                onClick={handleRefreshLeaderboard}
                className="px-3 py-2 bg-japandi-background-card hover:bg-japandi-background-primary text-japandi-text-primary text-sm font-medium rounded-full border border-japandi-border-light transition-all"
                title="Refresh leaderboard"
              >
                ↻ Refresh
              </button>
            </div>

            {isLoadingLeaderboard ? (
              <div className="text-center py-12 text-japandi-text-muted">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-japandi-text-muted">
                <p className="mb-2">No players yet</p>
                <p className="text-sm">Add players and play some games to see the leaderboard!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <button
                    key={entry.groupPlayerId}
                    onClick={() => loadPlayerStats(entry.groupPlayerId)}
                    className="w-full text-left bg-japandi-background-card border border-japandi-border-light rounded-xl p-4 shadow-soft hover:border-japandi-accent-primary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-japandi-background-primary text-japandi-text-muted'
                      }`}>
                        #{entry.rank}
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-japandi-text-primary truncate">
                            {entry.playerName}
                          </span>
                          {renderTrend(entry.trend)}
                        </div>
                        <div className="text-sm text-japandi-text-muted">
                          {entry.wins}-{entry.losses} • {formatPercentage(entry.winRate)}
                        </div>
                      </div>
                      
                      {/* ELO */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-japandi-text-primary">
                          {entry.eloRating}
                        </div>
                        <div className="text-xs text-japandi-text-muted">ELO</div>
                      </div>
                      
                      {/* Recent Form */}
                      {entry.recentForm.length > 0 && (
                        <div className="hidden sm:flex gap-1 flex-shrink-0">
                          {entry.recentForm.slice(0, 5).map((result, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                                result === 'W'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {result}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-center text-xs text-japandi-text-muted pt-4">
              Tap a player to see detailed stats
            </p>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === "players" && (
          <div className="space-y-4">
            {isLoadingPlayers && (
              <div className="text-center py-8 text-japandi-text-muted">
                Loading players...
              </div>
            )}
            <h2 className="text-lg font-semibold text-japandi-text-primary">Player Pool</h2>
            <p className="text-sm text-japandi-text-muted">
              Add players to your group. They will appear as suggestions when creating sessions.
            </p>

            {/* Add player form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 px-4 py-2 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              />
              <button
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim() || isAddingPlayer}
                className="px-4 py-2 bg-japandi-accent-primary hover:bg-japandi-accent-hover disabled:bg-japandi-text-muted text-white text-sm font-semibold rounded-card transition-all"
              >
                {isAddingPlayer ? "..." : "Add"}
              </button>
            </div>

            {/* Players list */}
            {players.length === 0 && !isLoadingPlayers ? (
              <div className="text-center py-8 text-japandi-text-muted">
                No players yet. Add your first player above!
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-japandi-background-card border border-japandi-border-light rounded-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-japandi-text-primary font-medium">{player.name}</span>
                      {(player.totalGames ?? 0) > 0 ? (
                        <span className="text-sm text-japandi-text-muted">
                          <span className="text-green-600">{player.wins ?? 0}W</span>
                          {" - "}
                          <span className="text-red-500">{player.losses ?? 0}L</span>
                        </span>
                      ) : (
                        <span className="text-xs text-japandi-text-muted">No games yet</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Profile Sheet */}
      {selectedPlayerStats && (
        <PlayerProfileSheet
          stats={selectedPlayerStats}
          onClose={() => setSelectedPlayerStats(null)}
        />
      )}

      {/* Loading overlay for player stats */}
      {isLoadingPlayerStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-japandi-background-card rounded-xl px-6 py-4 shadow-lg">
            <div className="text-japandi-text-secondary">Loading player stats...</div>
          </div>
        </div>
      )}
    </div>
  );
}
