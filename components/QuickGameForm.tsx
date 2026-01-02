"use client";

import { useState, useEffect } from "react";
import { Player, Game } from "@/types";
import { useSession } from "@/contexts/SessionContext";

// Score constraints
const SCORE_MIN = 0;
const SCORE_MAX = 30;

interface QuickGameFormProps {
  players: Player[];
  onGameSaved: () => void;
  initialTeamA?: [string, string] | [string];
  initialTeamB?: [string, string] | [string];
  gameToUpdate?: Game | null;
}

export default function QuickGameForm({
  players,
  onGameSaved,
  initialTeamA,
  initialTeamB,
  gameToUpdate,
}: QuickGameFormProps) {
  const { addGame, updateGame, session } = useSession();
  const gameMode = session?.gameMode || "doubles";
  const isSingles = gameMode === "singles";
  const requiredPerTeam = isSingles ? 1 : 2;
  const hasOnlyTwoPlayers = isSingles && players.length === 2;
  
  // Simplified state: arrays instead of tuples with nulls
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [winningTeam, setWinningTeam] = useState<"A" | "B" | null>(null);
  const [teamAScore, setTeamAScore] = useState<string>("");
  const [teamBScore, setTeamBScore] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize teams from props or auto-assign for 2-player singles
  useEffect(() => {
    if (initialTeamA && initialTeamB) {
      setTeamA(initialTeamA.filter(Boolean) as string[]);
      setTeamB(initialTeamB.filter(Boolean) as string[]);
    } else if (hasOnlyTwoPlayers && !gameToUpdate && players.length === 2) {
      setTeamA([players[0].id]);
      setTeamB([players[1].id]);
    }
  }, [initialTeamA, initialTeamB, hasOnlyTwoPlayers, players, gameToUpdate]);

  // Derived state
  const availableForTeamA = players.filter(p => !teamB.includes(p.id));
  const availableForTeamB = players.filter(p => !teamA.includes(p.id));
  const teamsComplete = teamA.length === requiredPerTeam && teamB.length === requiredPerTeam;
  const isUpdatingScheduledGame = !!gameToUpdate;

  // Get player name by ID
  const getPlayerName = (playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    return player?.name || "";
  };

  // Get team display name (e.g., "Darvey & James")
  const getTeamDisplayName = (team: string[]): string => {
    if (team.length === 0) return "";
    if (team.length === 1) return getPlayerName(team[0]);
    return team.map(getPlayerName).join(" & ");
  };

  // Handle selecting a player for a team
  const handleSelectPlayer = (playerId: string, team: "A" | "B") => {
    if (isUpdatingScheduledGame) return;

    if (team === "A") {
      if (teamA.length < requiredPerTeam && !teamA.includes(playerId)) {
        setTeamA([...teamA, playerId]);
      }
    } else {
      if (teamB.length < requiredPerTeam && !teamB.includes(playerId)) {
        setTeamB([...teamB, playerId]);
      }
    }
  };

  // Handle removing a player from a team (click on chip)
  const handleRemovePlayer = (playerId: string, team: "A" | "B") => {
    if (isUpdatingScheduledGame) return;

    if (team === "A") {
      setTeamA(teamA.filter(id => id !== playerId));
    } else {
      setTeamB(teamB.filter(id => id !== playerId));
    }
  };

  // Score validation with constraints
  const handleScoreChange = (value: string, setScore: (val: string) => void) => {
    if (value === "") {
      setScore("");
      return;
    }
    const num = parseInt(value);
    if (isNaN(num)) return;
    if (num < SCORE_MIN) {
      setScore(String(SCORE_MIN));
    } else if (num > SCORE_MAX) {
      setScore(String(SCORE_MAX));
    } else {
      setScore(value);
    }
  };

  // Validate scores: winning team score must be >= losing team score
  const scoresValid = (): boolean => {
    if (!teamAScore && !teamBScore) return true;
    if (!teamAScore || !teamBScore) return true;
    const scoreA = parseInt(teamAScore);
    const scoreB = parseInt(teamBScore);
    if (isNaN(scoreA) || isNaN(scoreB)) return true;
    
    if (winningTeam === 'A') return scoreA >= scoreB;
    if (winningTeam === 'B') return scoreB >= scoreA;
    return true;
  };

  const scoreValidationError = teamsComplete && winningTeam && teamAScore && teamBScore && !scoresValid()
    ? "Winner's score must be ≥ loser's score"
    : null;

  const canSave = teamsComplete && winningTeam !== null && scoresValid();

  const handleSave = async () => {
    if (!canSave) return;

    setIsSubmitting(true);
    try {
      if (gameToUpdate) {
        updateGame(gameToUpdate.id, {
          winningTeam: winningTeam!,
          teamAScore: teamAScore ? parseInt(teamAScore) : undefined,
          teamBScore: teamBScore ? parseInt(teamBScore) : undefined,
        });
      } else {
        addGame({
          teamA: teamA as [string] | [string, string],
          teamB: teamB as [string] | [string, string],
          winningTeam: winningTeam!,
          teamAScore: teamAScore ? parseInt(teamAScore) : undefined,
          teamBScore: teamBScore ? parseInt(teamBScore) : undefined,
        });
      }

      // Reset form
      setTeamA([]);
      setTeamB([]);
      setWinningTeam(null);
      setTeamAScore("");
      setTeamBScore("");
      onGameSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show message if no players exist
  if (players.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-japandi-background-card border-2 border-japandi-accent-primary rounded-card p-6 text-center">
          <h3 className="text-lg font-semibold text-japandi-text-primary mb-2">
            No Players Added
          </h3>
          <p className="text-sm text-japandi-text-secondary mb-4">
            You need to add players to this session before you can record games.
          </p>
          <p className="text-xs text-japandi-text-muted">
            Please add players using the &quot;Edit Session&quot; button in the Stats tab.
          </p>
        </div>
      </div>
    );
  }

  // Chip component for selected players - click to deselect
  const PlayerChip = ({ playerId, team }: { playerId: string; team: "A" | "B" }) => (
    <button
      type="button"
      onClick={() => !isUpdatingScheduledGame && handleRemovePlayer(playerId, team)}
      disabled={isUpdatingScheduledGame}
      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 touch-manipulation bg-japandi-accent-primary text-white ${
        !isUpdatingScheduledGame ? "hover:bg-red-500" : "opacity-75"
      }`}
      title={isUpdatingScheduledGame ? "" : "Click to remove"}
    >
      {getPlayerName(playerId)}
    </button>
  );

  // Available player button
  const PlayerButton = ({ player, team, disabled }: { player: Player; team: "A" | "B"; disabled: boolean }) => (
    <button
      type="button"
      onClick={() => handleSelectPlayer(player.id, team)}
      disabled={disabled || isUpdatingScheduledGame}
      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-95 touch-manipulation ${
        disabled || isUpdatingScheduledGame
          ? "bg-japandi-background-primary text-japandi-text-muted cursor-not-allowed opacity-50"
          : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary hover:border-japandi-accent-primary"
      }`}
    >
      {player.name}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Singles mode with only 2 players - skip selection */}
      {hasOnlyTwoPlayers ? (
        <>
          {/* Show the matchup */}
          <div className="text-center py-4">
            <div className="text-lg font-semibold text-japandi-text-primary">
              {getPlayerName(teamA[0])} vs {getPlayerName(teamB[0])}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Team A Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-japandi-text-primary">
                {isSingles ? "Player 1" : "Team A"}
              </h3>
              <span className="text-xs text-japandi-text-muted">
                {teamA.length}/{requiredPerTeam} selected
              </span>
            </div>

            {/* Selected players - click to deselect */}
            {teamA.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {teamA.map(id => (
                  <PlayerChip key={id} playerId={id} team="A" />
                ))}
              </div>
            )}

            {/* Available players */}
            {teamA.length < requiredPerTeam && (
              <div className="flex flex-wrap gap-2">
                {availableForTeamA.map(player => {
                  const alreadySelected = teamA.includes(player.id);
                  return (
                    <PlayerButton
                      key={player.id}
                      player={player}
                      team="A"
                      disabled={alreadySelected}
                    />
                  );
                })}
              </div>
            )}

            {teamA.length === requiredPerTeam && (
              <div className="text-xs text-japandi-text-muted">
                ✓ {isSingles ? "Player" : "Team"} selected
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-japandi-border-light" />
            <span className="text-sm font-medium text-japandi-text-muted">vs</span>
            <div className="flex-1 h-px bg-japandi-border-light" />
          </div>

          {/* Team B Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-japandi-text-primary">
                {isSingles ? "Player 2" : "Team B"}
              </h3>
              <span className="text-xs text-japandi-text-muted">
                {teamB.length}/{requiredPerTeam} selected
              </span>
            </div>

            {/* Selected players - click to deselect */}
            {teamB.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {teamB.map(id => (
                  <PlayerChip key={id} playerId={id} team="B" />
                ))}
              </div>
            )}

            {/* Available players */}
            {teamB.length < requiredPerTeam && (
              <div className="flex flex-wrap gap-2">
                {availableForTeamB.map(player => {
                  const alreadySelected = teamB.includes(player.id);
                  return (
                    <PlayerButton
                      key={player.id}
                      player={player}
                      team="B"
                      disabled={alreadySelected}
                    />
                  );
                })}
              </div>
            )}

            {teamB.length === requiredPerTeam && (
              <div className="text-xs text-japandi-text-muted">
                ✓ {isSingles ? "Player" : "Team"} selected
              </div>
            )}
          </div>
        </>
      )}

      {/* Winner Selection - Shows player names */}
      {teamsComplete && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-semibold text-japandi-text-primary">
            Winner
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWinningTeam("A")}
              className={`px-4 py-3 rounded-xl font-medium transition-all active:scale-95 touch-manipulation text-center ${
                winningTeam === "A"
                  ? "bg-japandi-accent-primary text-white shadow-button ring-2 ring-japandi-accent-primary ring-offset-2"
                  : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary hover:border-japandi-accent-primary"
              }`}
            >
              <span className="block text-sm sm:text-base truncate">
                {getTeamDisplayName(teamA)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWinningTeam("B")}
              className={`px-4 py-3 rounded-xl font-medium transition-all active:scale-95 touch-manipulation text-center ${
                winningTeam === "B"
                  ? "bg-japandi-accent-primary text-white shadow-button ring-2 ring-japandi-accent-primary ring-offset-2"
                  : "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary hover:border-japandi-accent-primary"
              }`}
            >
              <span className="block text-sm sm:text-base truncate">
                {getTeamDisplayName(teamB)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Scores - Shows player names */}
      {teamsComplete && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-japandi-text-primary">
            Scores <span className="font-normal text-japandi-text-muted">(Optional)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-japandi-text-muted mb-2 truncate">
                {getTeamDisplayName(teamA)}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={SCORE_MIN}
                max={SCORE_MAX}
                value={teamAScore}
                onChange={(e) => handleScoreChange(e.target.value, setTeamAScore)}
                placeholder="Score"
                className="w-full px-4 py-3 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary text-base focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                aria-label={`${getTeamDisplayName(teamA)} score`}
              />
            </div>
            <div>
              <label className="block text-sm text-japandi-text-muted mb-2 truncate">
                {getTeamDisplayName(teamB)}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={SCORE_MIN}
                max={SCORE_MAX}
                value={teamBScore}
                onChange={(e) => handleScoreChange(e.target.value, setTeamBScore)}
                placeholder="Score"
                className="w-full px-4 py-3 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary text-base focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                aria-label={`${getTeamDisplayName(teamB)} score`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Score Validation Error */}
      {scoreValidationError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {scoreValidationError}
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

