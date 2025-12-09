"use client";

import { useState } from "react";
import { Player } from "@/types";
import { useSession } from "@/contexts/SessionContext";

interface QuickGameFormProps {
  players: Player[];
  onGameSaved: () => void;
}

export default function QuickGameForm({
  players,
  onGameSaved,
}: QuickGameFormProps) {
  const { addGame } = useSession();
  const [teamA, setTeamA] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [teamB, setTeamB] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
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
      addGame({
        teamA: [teamA[0]!, teamA[1]!],
        teamB: [teamB[0]!, teamB[1]!],
        winningTeam: winningTeam!,
        teamAScore: teamAScore ? parseInt(teamAScore) : undefined,
        teamBScore: teamBScore ? parseInt(teamBScore) : undefined,
      });

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

  return (
    <div className="space-y-8">
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
                      disabled={isDisabled}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-japandi-accent-primary text-white shadow-button"
                          : isDisabled
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
                      disabled={isDisabled}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-japandi-accent-primary text-white shadow-button"
                          : isDisabled
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
              className={`flex-1 px-5 py-4 rounded-full font-semibold transition-colors ${
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
              className={`flex-1 px-5 py-4 rounded-full font-semibold transition-colors ${
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
          className="w-full px-6 py-4 bg-japandi-accent-primary hover:bg-japandi-accent-hover disabled:bg-japandi-text-muted disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors shadow-button"
        >
          {isSubmitting ? "Saving..." : "Save Game"}
        </button>
      )}
    </div>
  );
}

