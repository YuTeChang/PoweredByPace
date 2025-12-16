"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";
import SessionHeader from "@/components/SessionHeader";
import LiveStatsCard from "@/components/LiveStatsCard";
import QuickGameForm from "@/components/QuickGameForm";
import GameHistoryList from "@/components/GameHistoryList";
import BottomTabNav from "@/components/BottomTabNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import { calculatePlayerStats } from "@/lib/calculations";
import { Game } from "@/types";

type Tab = "stats" | "record" | "history";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { session, games, setSession } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  // Wait a moment for localStorage to load, then check if session exists
  useEffect(() => {
    if (params.id) {
      // Give localStorage time to load (SessionContext loads on mount)
      const timer = setTimeout(() => {
        if (!session || session.id !== params.id) {
          router.push("/create-session");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session, params.id, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-japandi-background-primary">
        <p className="text-japandi-text-secondary">Loading session...</p>
      </div>
    );
  }

  const playerStats = calculatePlayerStats(
    games,
    session.players,
    session.betPerPlayer
  );

  const [prefillGame, setPrefillGame] = useState<Game | null>(null);

  const handleGameSaved = () => {
    // Switch to stats tab to show updated stats
    setActiveTab("stats");
    setPrefillGame(null); // Clear prefill
  };

  const handleFABClick = () => {
    setActiveTab("record");
  };

  // Get all unplayed scheduled games
  const scheduledGames = games.filter(game => game.winningTeam === null);
  
  // Get first unplayed round robin game (next game)
  const nextUnplayedGame = scheduledGames[0] || null;
  
  // Get upcoming games (excluding the next game, show up to 10 for better visibility)
  const upcomingGames = scheduledGames.slice(1, 11);
  
  // Get only played games for Recent Games section
  const playedGames = games.filter(game => game.winningTeam !== null);

  return (
    <div className="min-h-screen bg-japandi-background-primary pb-20">
      <SessionHeader session={session} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-japandi-text-primary">
              Live Stats
            </h2>
            <div className="space-y-4">
              {session.players.map((player) => {
                const stats = playerStats.find(
                  (s) => s.playerId === player.id
                );
                if (!stats) return null;
                return (
                  <LiveStatsCard
                    key={player.id}
                    stats={stats}
                    player={player}
                  />
                );
              })}
            </div>

            {/* Next Game - Show first unplayed round robin game */}
            {nextUnplayedGame && (
              <div className="mt-8">
                <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
                  Next Game
                </h3>
                <div className="bg-japandi-background-card border-2 border-japandi-accent-primary rounded-card p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-japandi-text-primary mb-1">
                        Game {nextUnplayedGame.gameNumber}
                      </div>
                      <div className="text-base text-japandi-text-secondary">
                        {session.players.find(p => p.id === nextUnplayedGame.teamA[0])?.name} & {session.players.find(p => p.id === nextUnplayedGame.teamA[1])?.name}
                        {" vs "}
                        {session.players.find(p => p.id === nextUnplayedGame.teamB[0])?.name} & {session.players.find(p => p.id === nextUnplayedGame.teamB[1])?.name}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPrefillGame(nextUnplayedGame);
                        setActiveTab("record");
                      }}
                      className="ml-4 px-5 py-2.5 bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white font-semibold rounded-full transition-colors shadow-button whitespace-nowrap"
                    >
                      Record Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Games - Show next few scheduled games */}
            {scheduledGames.length > 1 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-japandi-text-primary">
                    Upcoming Games
                  </h3>
                  {scheduledGames.length > 11 && (
                    <button
                      onClick={() => setActiveTab("record")}
                      className="text-sm text-japandi-accent-primary hover:text-japandi-accent-hover transition-colors"
                    >
                      View All ({scheduledGames.length})
                    </button>
                  )}
                </div>
                {upcomingGames.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingGames.map((game) => {
                      const getPlayerName = (id: string) =>
                        session.players.find((p) => p.id === id)?.name || "";
                      const teamA = game.teamA.map(getPlayerName).join(" & ");
                      const teamB = game.teamB.map(getPlayerName).join(" & ");

                      return (
                        <div
                          key={game.id}
                          className="bg-japandi-background-card border border-japandi-border-light rounded-card p-3.5 shadow-soft hover:border-japandi-border transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-japandi-text-primary whitespace-nowrap">
                                  Game {game.gameNumber}
                                </span>
                              </div>
                              <div className="text-sm text-japandi-text-secondary truncate">
                                {teamA} vs {teamB}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setPrefillGame(game);
                                setActiveTab("record");
                              }}
                              className="ml-3 px-3 py-1.5 text-xs font-medium bg-japandi-background-primary text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-card rounded-full transition-colors whitespace-nowrap flex-shrink-0"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-japandi-text-muted py-2">
                    No more scheduled games.
                  </div>
                )}
              </div>
            )}

            {/* Recent Games - Only show played games */}
            {playedGames.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
                  Recent Games
                </h3>
                <div className="space-y-3">
                  {playedGames
                    .slice(-5)
                    .reverse()
                    .map((game) => {
                      const getPlayerName = (id: string) =>
                        session.players.find((p) => p.id === id)?.name || "";
                      const teamA = game.teamA.map(getPlayerName).join(" & ");
                      const teamB = game.teamB.map(getPlayerName).join(" & ");
                      const winner = game.winningTeam === "A" ? teamA : teamB;

                      return (
                        <div
                          key={game.id}
                          className="bg-japandi-background-card border border-japandi-border-light rounded-card p-4 text-base shadow-soft"
                        >
                          <span className="font-medium text-japandi-text-primary">
                            Game {game.gameNumber}:
                          </span>{" "}
                          <span className="text-japandi-text-secondary">
                            {winner} won
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* FAB for quick record */}
            <FloatingActionButton
              onClick={handleFABClick}
              label="Record Game"
            />
          </div>
        )}

        {/* Record Tab */}
        {activeTab === "record" && (
          <div>
            <h2 className="text-2xl font-bold text-japandi-text-primary mb-8">
              Record Game
            </h2>
            
            {/* Scheduled Games Section */}
            {scheduledGames.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-japandi-text-primary mb-4">
                  Scheduled Games ({scheduledGames.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scheduledGames.map((game) => {
                    const getPlayerName = (id: string) =>
                      session.players.find((p) => p.id === id)?.name || "";
                    const teamA = game.teamA.map(getPlayerName).join(" & ");
                    const teamB = game.teamB.map(getPlayerName).join(" & ");
                    const isPrefilled = prefillGame?.id === game.id;

                    return (
                      <div
                        key={game.id}
                        className={`bg-japandi-background-card border rounded-card p-4 transition-all ${
                          isPrefilled
                            ? "border-2 border-japandi-accent-primary shadow-soft"
                            : "border-japandi-border-light hover:border-japandi-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-base font-medium text-japandi-text-primary">
                              Game {game.gameNumber}
                            </div>
                            <div className="text-sm text-japandi-text-secondary mt-1">
                              {teamA} vs {teamB}
                            </div>
                          </div>
                          <button
                            onClick={() => setPrefillGame(game)}
                            className={`ml-4 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                              isPrefilled
                                ? "bg-japandi-accent-primary text-white"
                                : "bg-japandi-background-primary text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-card"
                            }`}
                          >
                            {isPrefilled ? "Selected" : "Use This"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {prefillGame && (
                  <div className="mt-4 p-3 bg-japandi-background-primary rounded-card border border-japandi-border-light">
                    <p className="text-sm text-japandi-text-secondary">
                      Teams pre-filled below. Fill in the winner and scores, then save.
                    </p>
                  </div>
                )}
              </div>
            )}

            <QuickGameForm
              players={session.players}
              onGameSaved={handleGameSaved}
              initialTeamA={prefillGame?.teamA}
              initialTeamB={prefillGame?.teamB}
              gameToUpdate={prefillGame || undefined}
            />
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            <GameHistoryList games={games} players={session.players} />
          </div>
        )}
      </div>

      <BottomTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        gameCount={games.length}
      />
    </div>
  );
}

