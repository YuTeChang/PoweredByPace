export interface Group {
  id: string;
  name: string;
  shareableLink: string;
  createdAt?: Date;
}

export interface GroupPlayer {
  id: string;
  groupId: string;
  name: string;
  eloRating?: number; // ELO rating, defaults to 1500
  createdAt?: Date;
}

export interface Player {
  id: string;
  name: string;
  groupPlayerId?: string; // Links to group player pool
}

export interface Session {
  id: string;
  name?: string;
  date: Date;
  players: Player[];
  organizerId: string;
  courtCostType: "per_person" | "total";
  courtCostValue: number;
  birdCostTotal: number;
  betPerPlayer: number;
  gameMode: "doubles" | "singles";
  groupId?: string; // Optional - null for standalone sessions
  bettingEnabled: boolean; // Per-session toggle
}

export interface Game {
  id: string;
  sessionId: string;
  gameNumber: number;
  teamA: [string, string] | [string]; // player IDs - doubles: [string, string], singles: [string]
  teamB: [string, string] | [string]; // player IDs - doubles: [string, string], singles: [string]
  winningTeam: "A" | "B" | null; // null for unplayed round robin games
  teamAScore?: number;
  teamBScore?: number;
  createdAt?: Date; // When the game was recorded
  updatedAt?: Date; // When the game was last updated
}

// Leaderboard entry for group stats
export interface LeaderboardEntry {
  groupPlayerId: string;
  playerName: string;
  eloRating: number;
  rank: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: ('W' | 'L')[]; // Last 5 games
  trend: 'up' | 'down' | 'stable'; // ELO trend direction
}

// Partner statistics
export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

// Opponent statistics
export interface OpponentStats {
  opponentId: string;
  opponentName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

// Detailed player statistics for player profile
export interface PlayerDetailedStats {
  groupPlayerId: string;
  playerName: string;
  eloRating: number;
  rank: number;
  totalPlayers: number;
  
  // Core stats
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  pointDifferential: number;
  
  // Sessions
  sessionsPlayed: number;
  
  // Form & streaks
  recentForm: ('W' | 'L')[]; // Last 5-10 games
  currentStreak: number; // Positive = wins, negative = losses
  
  // Partner synergy (doubles only)
  partnerStats: PartnerStats[];
  
  // Opponent matchups
  opponentStats: OpponentStats[];
}
