import { Player, Game, Session } from "@/types";

export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  gamblingNet: number;
}

export interface NonBettingStats {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  pointDifferential: number;
}

export interface FinalSettlement {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  pointDifferential: number;
  gamblingNet: number;
  evenSharePerPlayer: number;
  fairTotal: number;
  amountToPayOrganizer: number;
}

/**
 * Calculate wins, losses, and gambling net for each player
 */
export function calculatePlayerStats(
  games: Game[],
  players: Player[],
  betPerPlayer: number
): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  // Initialize stats for all players
  players.forEach((player) => {
    statsMap.set(player.id, {
      playerId: player.id,
      wins: 0,
      losses: 0,
      gamblingNet: 0,
    });
  });

  // Process each game (skip unplayed games with null winningTeam)
  games.forEach((game) => {
    if (game.winningTeam === null) return; // Skip unplayed round robin games

    const winningTeam = game.winningTeam === "A" ? game.teamA : game.teamB;
    const losingTeam = game.winningTeam === "A" ? game.teamB : game.teamA;

    // Update stats for winning team
    winningTeam.forEach((playerId) => {
      const stats = statsMap.get(playerId);
      if (stats) {
        stats.wins += 1;
        stats.gamblingNet += betPerPlayer;
      }
    });

    // Update stats for losing team
    losingTeam.forEach((playerId) => {
      const stats = statsMap.get(playerId);
      if (stats) {
        stats.losses += 1;
        stats.gamblingNet -= betPerPlayer;
      }
    });
  });

  return Array.from(statsMap.values());
}

/**
 * Calculate non-betting stats (universal stats shown regardless of betting toggle)
 */
export function calculateNonBettingStats(
  games: Game[],
  players: Player[]
): NonBettingStats[] {
  const statsMap = new Map<string, NonBettingStats>();

  // Initialize stats for all players
  players.forEach((player) => {
    statsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      winRate: 0,
      pointsScored: 0,
      pointsConceded: 0,
      pointDifferential: 0,
    });
  });

  // Process each game (skip unplayed games with null winningTeam)
  games.forEach((game) => {
    if (game.winningTeam === null) return; // Skip unplayed round robin games

    const teamAScore = game.teamAScore || 0;
    const teamBScore = game.teamBScore || 0;

    // Process team A
    game.teamA.forEach((playerId) => {
      const stats = statsMap.get(playerId);
      if (stats) {
        stats.gamesPlayed += 1;
        stats.pointsScored += teamAScore;
        stats.pointsConceded += teamBScore;
        if (game.winningTeam === "A") {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
      }
    });

    // Process team B
    game.teamB.forEach((playerId) => {
      const stats = statsMap.get(playerId);
      if (stats) {
        stats.gamesPlayed += 1;
        stats.pointsScored += teamBScore;
        stats.pointsConceded += teamAScore;
        if (game.winningTeam === "B") {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
      }
    });
  });

  // Calculate win rate and point differential
  return Array.from(statsMap.values()).map((stats) => ({
    ...stats,
    winRate: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
    pointDifferential: stats.pointsScored - stats.pointsConceded,
  }));
}

/**
 * Calculate total shared cost
 */
export function calculateTotalSharedCost(session: Session): number {
  let courtCostTotal: number;

  if (session.courtCostType === "per_person") {
    courtCostTotal = session.courtCostValue * session.players.length;
  } else {
    courtCostTotal = session.courtCostValue;
  }

  return courtCostTotal + session.birdCostTotal;
}

/**
 * Calculate final settlement for all players (includes both betting and non-betting stats)
 */
export function calculateFinalSettlement(
  session: Session,
  games: Game[]
): FinalSettlement[] {
  const totalSharedCost = calculateTotalSharedCost(session);
  const evenSharePerPlayer = totalSharedCost / session.players.length;
  const playerStats = calculatePlayerStats(
    games,
    session.players,
    session.bettingEnabled ? session.betPerPlayer : 0
  );
  const nonBettingStats = calculateNonBettingStats(games, session.players);

  return session.players.map((player) => {
    const stats = playerStats.find((s) => s.playerId === player.id)!;
    const nbStats = nonBettingStats.find((s) => s.playerId === player.id)!;
    const fairTotal = evenSharePerPlayer - stats.gamblingNet;
    const amountToPayOrganizer =
      player.id === session.organizerId ? 0 : fairTotal;

    return {
      playerId: player.id,
      playerName: player.name,
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed: nbStats.gamesPlayed,
      winRate: nbStats.winRate,
      pointsScored: nbStats.pointsScored,
      pointsConceded: nbStats.pointsConceded,
      pointDifferential: nbStats.pointDifferential,
      gamblingNet: stats.gamblingNet,
      evenSharePerPlayer,
      fairTotal,
      amountToPayOrganizer,
    };
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Generate shareable text snippet for final settlement
 */
export function generateShareableText(
  settlement: FinalSettlement[],
  bettingEnabled: boolean = true
): string {
  if (bettingEnabled) {
    return settlement
      .map((s) => `${s.playerName} → ${formatCurrency(s.amountToPayOrganizer)}`)
      .join("\n");
  } else {
    // Non-betting mode: show stats summary
    return settlement
      .map((s) => `${s.playerName}: ${s.wins}W-${s.losses}L (${formatPercentage(s.winRate)})`)
      .join("\n");
  }
}

