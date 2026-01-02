"use client";

import { RecentGame } from "@/types";
import { formatPercentage } from "@/lib/calculations";

interface PlayerMatchupDetailSheetProps {
  playerName: string;
  matchupName: string;
  matchupType: 'partner' | 'opponent';
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  games: RecentGame[];
  onClose: () => void;
}

export function PlayerMatchupDetailSheet({ 
  playerName,
  matchupName, 
  matchupType,
  wins,
  losses,
  gamesPlayed,
  winRate,
  games,
  onClose 
}: PlayerMatchupDetailSheetProps) {
  const title = matchupType === 'partner' 
    ? `Playing with ${matchupName}` 
    : `Playing against ${matchupName}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-japandi-background-card rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-japandi-background-card border-b border-japandi-border-light px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-japandi-background-primary rounded-full transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-japandi-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center px-4">
              <h2 className="text-lg font-bold text-japandi-text-primary">
                {title}
              </h2>
              <p className="text-sm text-japandi-text-muted">
                {playerName}&apos;s {matchupType === 'partner' ? 'partnership' : 'matchup'} stats
              </p>
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {/* Matchup Summary */}
          <div>
            <h3 className="text-sm font-semibold text-japandi-text-muted uppercase tracking-wide mb-3">
              {matchupType === 'partner' ? 'Partnership Record' : 'Head-to-Head Record'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-japandi-background-primary rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-japandi-text-primary">
                  {wins}-{losses}
                </div>
                <div className="text-xs text-japandi-text-muted mt-1">W-L</div>
              </div>
              <div className="bg-japandi-background-primary rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-japandi-text-primary">
                  {formatPercentage(winRate)}
                </div>
                <div className="text-xs text-japandi-text-muted mt-1">Win Rate</div>
              </div>
              <div className="bg-japandi-background-primary rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-japandi-text-primary">
                  {gamesPlayed}
                </div>
                <div className="text-xs text-japandi-text-muted mt-1">Games</div>
              </div>
            </div>

            {/* Dominance indicator */}
            {gamesPlayed >= 2 && (
              <div className="mt-4 p-3 rounded-xl bg-japandi-background-primary">
                {winRate >= 70 ? (
                  <p className="text-sm text-green-600 text-center">
                    {matchupType === 'partner' 
                      ? `💪 Great chemistry with ${matchupName}!`
                      : `💪 ${playerName} dominates this matchup!`
                    }
                  </p>
                ) : winRate <= 30 ? (
                  <p className="text-sm text-red-500 text-center">
                    {matchupType === 'partner'
                      ? `😰 Struggles when paired with ${matchupName}`
                      : `😰 ${matchupName} has ${playerName}'s number`
                    }
                  </p>
                ) : (
                  <p className="text-sm text-japandi-text-muted text-center">
                    {matchupType === 'partner'
                      ? `⚖️ Balanced partnership`
                      : `⚖️ Evenly matched rivalry`
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Game History */}
          <div>
            <h3 className="text-sm font-semibold text-japandi-text-muted uppercase tracking-wide mb-3">
              Game History ({games.length})
            </h3>
            {games.length > 0 ? (
              <div className="space-y-2">
                {games.map((game, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border ${
                      game.won 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-japandi-text-primary truncate">
                          {game.teamANames.join(' & ')}
                        </div>
                        <div className="text-xs text-japandi-text-muted">vs</div>
                        <div className="text-sm text-japandi-text-primary truncate">
                          {game.teamBNames.join(' & ')}
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        {game.teamAScore !== undefined && game.teamBScore !== undefined ? (
                          <div className="text-lg font-bold text-japandi-text-primary">
                            {game.teamAScore}-{game.teamBScore}
                          </div>
                        ) : (
                          <div className={`text-sm font-bold ${game.won ? 'text-green-600' : 'text-red-600'}`}>
                            {game.won ? 'WIN' : 'LOSS'}
                          </div>
                        )}
                        {game.date && (
                          <div className="text-xs text-japandi-text-muted mt-1">
                            {new Date(game.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-japandi-text-muted">
                No games recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
