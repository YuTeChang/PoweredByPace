"use client";

import { Game, Player } from "@/types";
import { useSession } from "@/contexts/SessionContext";

interface GameHistoryListProps {
  games: Game[];
  players: Player[];
}

export default function GameHistoryList({
  games,
  players,
}: GameHistoryListProps) {
  const { removeLastGame } = useSession();
  
  // Only show played games in history (filter out unplayed round robin games)
  const playedGames = games.filter(game => game.winningTeam !== null);

  const getPlayerName = (playerId: string): string => {
    return players.find((p) => p.id === playerId)?.name || "Unknown";
  };

  const formatGameResult = (game: Game): string => {
    const teamANames = game.teamA.map(getPlayerName).join(" & ");
    const teamBNames = game.teamB.map(getPlayerName).join(" & ");
    
    if (game.winningTeam === null) {
      return `${teamANames} vs ${teamBNames}`;
    }
    
    const winnerNames =
      game.winningTeam === "A" ? teamANames : teamBNames;
    const loserNames = game.winningTeam === "A" ? teamBNames : teamANames;

    let result = `${winnerNames} def. ${loserNames}`;
    
    // Add scores if available
    if (game.teamAScore !== undefined && game.teamBScore !== undefined) {
      const winnerScore = game.winningTeam === "A" ? game.teamAScore : game.teamBScore;
      const loserScore = game.winningTeam === "A" ? game.teamBScore : game.teamAScore;
      result += ` (${winnerScore}-${loserScore})`;
    }

    return result;
  };

  return (
    <div className="space-y-6">
      {playedGames.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-japandi-text-primary">
            Game History ({playedGames.length})
          </h3>
          <button
            onClick={removeLastGame}
            className="px-4 py-2 text-sm bg-japandi-background-card text-japandi-text-secondary hover:bg-japandi-background-primary border border-japandi-border-light rounded-full transition-colors"
          >
            Undo Last Game
          </button>
        </div>
      )}

      {playedGames.length === 0 ? (
        <div className="text-center py-16 text-japandi-text-muted">
          <p className="text-base">No games played yet.</p>
          <p className="text-sm mt-3">Switch to Record tab to log your first game!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...playedGames].reverse().map((game) => (
            <div
              key={game.id}
              className="bg-japandi-background-card border border-japandi-border-light rounded-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-japandi-text-primary">
                    Game {game.gameNumber}
                  </div>
                  <div className="text-base text-japandi-text-secondary mt-2">
                    {formatGameResult(game)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

