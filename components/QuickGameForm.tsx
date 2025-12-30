"use client";

import { useState, useEffect } from "react";
import { Player, Game } from "@/types";
import { useSession } from "@/contexts/SessionContext";

interface QuickGameFormProps {
  players: Player[];
  onGameSaved: () => void;
  initialTeamA?: [string, string];
  initialTeamB?: [string, string];
  gameToUpdate?: Game | null;
}

export default function QuickGameForm({
  players,
  onGameSaved,
  initialTeamA,
  initialTeamB,
  gameToUpdate,
}: QuickGameFormProps) {
  const { addGame, updateGame } = useSession();
  const [teamA, setTeamA] = useState<[string | null, string | null]>(
    initialTeamA || [null, null]
  );
  const [teamB, setTeamB] = useState<[string | null, string | null]>(
    initialTeamB || [null, null]
  );
  
  // Reset form when initial teams change
  useEffect(() => {
    if (initialTeamA && initialTeamB) {
      setTeamA(initialTeamA);
      setTeamB(initialTeamB);
    }
  }, [initialTeamA, initialTeamB]);
  const [winningTeam, setWinningTeam] = useState<"A" | "B" | null>(null);
  const [teamAScore, setTeamAScore] = useState<string>("");
  const [teamBScore, setTeamBScore] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlayerSelect = (
    team: "A" | "B",
    position: 0 | 1,
    playerId: string
  ) => {
    if (team === "A") {
      const newTeamA: [string | null, string | null] = [...teamA];
      newTeamA[position] = newTeamA[position] === playerId ? null : playerId;
      setTeamA(newTeamA);
    } else {
      const newTeamB: [string | null, string | null] = [...teamB];
      newTeamB[position] = newTeamB[position] === playerId ? null : playerId;
      setTeamB(newTeamB);
    }
  };

  const isPlayerSelected = (playerId: string): boolean => {
    return (
      teamA.includes(playerId) ||
      teamB.includes(playerId) ||
      false
    );
  };

  const teamsComplete =
    teamA[0] &&
    teamA[1] &&
    teamB[0] &&
    teamB[1] &&
    teamA[0] !== teamA[1] &&
    teamB[0] !== teamB[1] &&
    !teamA.includes(teamB[0] as string) &&
    !teamA.includes(teamB[1] as string);

  const canSave = teamsComplete && winningTeam !== null;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSubmitting(true);
    try {
      // If we're updating an existing game (from round robin schedule)
      if (gameToUpdate) {
        updateGame(gameToUpdate.id, {
          winningTeam: winningTeam!,
          teamAScore: teamAScore ? parseInt(teamAScore) : undefined,
          teamBScore: teamBScore ? parseInt(teamBScore) : undefined,
        });
      } else {
        // Create a new game
        addGame({
          teamA: [teamA[0]!, teamA[1]!],
          teamB: [teamB[0]!, teamB[1]!],
          winningTeam: winningTeam!,
          teamAScore: teamAScore ? parseInt(teamAScore) : undefined,
          teamBScore: teamBScore ? parseInt(teamBScore) : undefined,
        });
      }

      // Reset form
      setTeamA([null, null]);
      setTeamB([null, null]);
      setWinningTeam(null);
      setTeamAScore("");
      setTeamBScore("");
      onGameSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdatingScheduledGame = !!gameToUpdate;

  return (
    <div className="space-y-8">
      {isUpdatingScheduledGame && (
        <div className="bg-japandi-background-primary border border-japandi-border-light rounded-card p-4 mb-4">
          <p className="text-sm text-japandi-text-secondary">
            Recording result for scheduled Game {gameToUpdate.gameNumber}. Teams are set - just select the winner and scores.
          </p>
        </div>
      )}
      
      {/* Team A */}
      <div>
        <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
          Team A
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((position) => (
            <div key={position}>
              <div className="text-sm text-japandi-text-muted mb-2">
                Player {position + 1}
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((player) => {
                  const isSelected = teamA[position] === player.id;
                  const isDisabled =
                    isPlayerSelected(player.id) && !isSelected;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        handlePlayerSelect("A", position as 0 | 1, player.id)
                      }
                      disabled={isDisabled || isUpdatingScheduledGame}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                        isSelected
                          ? "bg-japandi-accent-primary text-white shadow-button"
                          : isDisabled || isUpdatingScheduledGame
                          ? "bg-japandi-background-primary text-japandi-text-muted cursor-not-allowed opacity-50"
                          : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary"
                      }`}
                    >
                      {player.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team B */}
      <div>
        <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
          Team B
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((position) => (
            <div key={position}>
              <div className="text-sm text-japandi-text-muted mb-2">
                Player {position + 1}
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((player) => {
                  const isSelected = teamB[position] === player.id;
                  const isDisabled =
                    isPlayerSelected(player.id) && !isSelected;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        handlePlayerSelect("B", position as 0 | 1, player.id)
                      }
                      disabled={isDisabled || isUpdatingScheduledGame}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                        isSelected
                          ? "bg-japandi-accent-primary text-white shadow-button"
                          : isDisabled || isUpdatingScheduledGame
                          ? "bg-japandi-background-primary text-japandi-text-muted cursor-not-allowed opacity-50"
                          : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary"
                      }`}
                    >
                      {player.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Selection - Show when teams are complete */}
      {teamsComplete && (
        <div>
          <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
            Winner
          </h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setWinningTeam("A")}
              className={`flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-full font-semibold transition-all active:scale-95 touch-manipulation ${
                winningTeam === "A"
                  ? "bg-japandi-accent-primary text-white shadow-button"
                  : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary"
              }`}
            >
              Team A
            </button>
            <button
              type="button"
              onClick={() => setWinningTeam("B")}
              className={`flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-full font-semibold transition-all active:scale-95 touch-manipulation ${
                winningTeam === "B"
                  ? "bg-japandi-accent-primary text-white shadow-button"
                  : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary"
              }`}
            >
              Team B
            </button>
          </div>
        </div>
      )}

      {/* Scores - Show when teams are complete */}
      {teamsComplete && (
        <div>
          <h3 className="text-base font-semibold text-japandi-text-primary mb-4">
            Scores (Optional)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-japandi-text-muted mb-2">
                Team A Score
              </label>
              <input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                placeholder="e.g., 21"
                className="w-full px-4 py-3 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                aria-label="Team A score"
              />
            </div>
            <div>
              <label className="block text-sm text-japandi-text-muted mb-2">
                Team B Score
              </label>
              <input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                placeholder="e.g., 19"
                className="w-full px-4 py-3 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                aria-label="Team B score"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {canSave && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 disabled:bg-japandi-text-muted disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold rounded-full transition-all shadow-button touch-manipulation"
        >
          {isSubmitting ? "Saving..." : "Save Game"}
        </button>
      )}
    </div>
  );
}

