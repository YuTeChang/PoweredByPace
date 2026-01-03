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
 * Extended shareable text options
 */
export interface ShareableTextOptions {
  sessionName?: string;
  groupName?: string | null;
  sessionLink?: string | null;
  games?: Game[];
  players?: Player[];
  costPerPerson?: number;
}

interface ClutchUnluckyResult {
  player: { name: string; count: number } | null;
  pair: { name: string; count: number } | null;
}

/**
 * Find unluckiest player AND pair (most games lost by 1-2 points)
 */
function findUnluckiestFromGames(games: Game[], players: Player[]): ClutchUnluckyResult {
  const playerMap = new Map(players.map(p => [p.id, p.name]));
  const playerCount = new Map<string, number>(); // individual player counts
  const pairCount = new Map<string, number>(); // pair counts

  games.forEach(game => {
    if (!game.winningTeam || game.teamAScore === undefined || game.teamBScore === undefined) return;
    
    const margin = Math.abs(game.teamAScore - game.teamBScore);
    if (margin >= 1 && margin <= 2) {
      const losingTeam = game.winningTeam === 'A' ? game.teamB : game.teamA;
      
      // Always track individual players
      losingTeam.forEach(id => {
        playerCount.set(id, (playerCount.get(id) || 0) + 1);
      });
      
      // Track pairs for doubles
      if (losingTeam.length === 2) {
        const pairKey = [...losingTeam].sort().join('|');
        pairCount.set(pairKey, (pairCount.get(pairKey) || 0) + 1);
      }
    }
  });

  // Find most unlucky player
  let maxPlayerKey = '';
  let maxPlayerCount = 0;
  playerCount.forEach((count, key) => {
    if (count > maxPlayerCount) {
      maxPlayerCount = count;
      maxPlayerKey = key;
    }
  });

  // Find most unlucky pair
  let maxPairKey = '';
  let maxPairCount = 0;
  pairCount.forEach((count, key) => {
    if (count > maxPairCount) {
      maxPairCount = count;
      maxPairKey = key;
    }
  });

  return {
    player: maxPlayerCount > 0 ? { name: playerMap.get(maxPlayerKey) || 'Unknown', count: maxPlayerCount } : null,
    pair: maxPairCount > 0 ? { 
      name: maxPairKey.split('|').map(id => playerMap.get(id) || 'Unknown').join(' & '), 
      count: maxPairCount 
    } : null,
  };
}

/**
 * Find most clutch player AND pair (most games won by 1-2 points)
 */
function findClutchFromGames(games: Game[], players: Player[]): ClutchUnluckyResult {
  const playerMap = new Map(players.map(p => [p.id, p.name]));
  const playerCount = new Map<string, number>();
  const pairCount = new Map<string, number>();

  games.forEach(game => {
    if (!game.winningTeam || game.teamAScore === undefined || game.teamBScore === undefined) return;
    
    const margin = Math.abs(game.teamAScore - game.teamBScore);
    if (margin >= 1 && margin <= 2) {
      const winningTeam = game.winningTeam === 'A' ? game.teamA : game.teamB;
      
      // Always track individual players
      winningTeam.forEach(id => {
        playerCount.set(id, (playerCount.get(id) || 0) + 1);
      });
      
      // Track pairs for doubles
      if (winningTeam.length === 2) {
        const pairKey = [...winningTeam].sort().join('|');
        pairCount.set(pairKey, (pairCount.get(pairKey) || 0) + 1);
      }
    }
  });

  // Find most clutch player
  let maxPlayerKey = '';
  let maxPlayerCount = 0;
  playerCount.forEach((count, key) => {
    if (count > maxPlayerCount) {
      maxPlayerCount = count;
      maxPlayerKey = key;
    }
  });

  // Find most clutch pair
  let maxPairKey = '';
  let maxPairCount = 0;
  pairCount.forEach((count, key) => {
    if (count > maxPairCount) {
      maxPairCount = count;
      maxPairKey = key;
    }
  });

  return {
    player: maxPlayerCount > 0 ? { name: playerMap.get(maxPlayerKey) || 'Unknown', count: maxPlayerCount } : null,
    pair: maxPairCount > 0 ? { 
      name: maxPairKey.split('|').map(id => playerMap.get(id) || 'Unknown').join(' & '), 
      count: maxPairCount 
    } : null,
  };
}

/**
 * Generate shareable text snippet for final settlement
 */
export function generateShareableText(
  settlement: FinalSettlement[],
  bettingEnabled: boolean = true,
  options: ShareableTextOptions = {}
): string {
  const lines: string[] = [];
  
  // Session header
  if (options.sessionName) {
    lines.push(`📊 ${options.sessionName}`);
    if (options.groupName) {
      lines.push(`🏸 ${options.groupName}`);
    }
    lines.push('');
  }

  // Player results
  if (bettingEnabled) {
    lines.push('💰 Settlement:');
    settlement.forEach(s => {
      lines.push(`${s.playerName} → ${formatCurrency(s.amountToPayOrganizer)}`);
    });
  } else {
    lines.push('📈 Results:');
    settlement.forEach(s => {
      lines.push(`${s.playerName}: ${s.wins}W-${s.losses}L (${formatPercentage(s.winRate)})`);
    });
    
    // Show cost breakdown if betting is disabled but there are costs
    if (options.costPerPerson !== undefined && options.costPerPerson > 0) {
      lines.push('');
      lines.push(`💵 Cost: ${formatCurrency(options.costPerPerson)} per person`);
    }
  }

  // Add clutch and unlucky info if games are provided
  if (options.games && options.players && options.games.length > 0) {
    const unlucky = findUnluckiestFromGames(options.games, options.players);
    const clutch = findClutchFromGames(options.games, options.players);
    
    const hasClutchOrUnlucky = clutch.player || clutch.pair || unlucky.player || unlucky.pair;
    
    if (hasClutchOrUnlucky) {
      lines.push('');
      
      // Clutch - show pair first if exists, then player
      if (clutch.pair && clutch.pair.count > 0) {
        lines.push(`🎯 Clutch Pair: ${clutch.pair.name} (${clutch.pair.count} close win${clutch.pair.count > 1 ? 's' : ''})`);
      }
      if (clutch.player && clutch.player.count > 0) {
        lines.push(`🎯 Clutch Player: ${clutch.player.name} (${clutch.player.count} close win${clutch.player.count > 1 ? 's' : ''})`);
      }
      
      // Unlucky - show pair first if exists, then player
      if (unlucky.pair && unlucky.pair.count > 0) {
        lines.push(`😰 Unlucky Pair: ${unlucky.pair.name} (${unlucky.pair.count} close loss${unlucky.pair.count > 1 ? 'es' : ''})`);
      }
      if (unlucky.player && unlucky.player.count > 0) {
        lines.push(`😰 Unlucky Player: ${unlucky.player.name} (${unlucky.player.count} close loss${unlucky.player.count > 1 ? 'es' : ''})`);
      }
    }
  }

  // Add session link
  if (options.sessionLink) {
    lines.push('');
    lines.push(`🔗 ${options.sessionLink}`);
  }

  return lines.join('\n');
}

