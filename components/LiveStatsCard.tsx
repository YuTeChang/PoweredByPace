"use client";

import { PlayerStats } from "@/lib/calculations";
import { Player } from "@/types";
import { formatCurrency } from "@/lib/calculations";

interface LiveStatsCardProps {
  stats: PlayerStats;
  player: Player;
}

export default function LiveStatsCard({ stats, player }: LiveStatsCardProps) {
  const isPositive = stats.gamblingNet > 0;
  const isNegative = stats.gamblingNet < 0;
  const isNeutral = stats.gamblingNet === 0;

  return (
    <div className="bg-japandi-background-card rounded-card border border-japandi-border-light p-4 sm:p-6 shadow-soft transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-japandi-text-primary truncate">
            {player.name}
          </h3>
          <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
            <div className="text-sm sm:text-base">
              <span className="text-japandi-text-secondary">W/L: </span>
              <span className="font-medium text-japandi-text-primary">
                {stats.wins}-{stats.losses}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className={`text-lg sm:text-xl font-bold ${
              isPositive
                ? "text-japandi-accent-primary"
                : isNegative
                ? "text-japandi-text-secondary"
                : "text-japandi-text-muted"
            }`}
          >
            {isPositive && "+"}
            {formatCurrency(stats.gamblingNet)}
          </div>
          <div className="text-xs sm:text-sm text-japandi-text-muted mt-1">
            Net
          </div>
        </div>
      </div>
    </div>
  );
}

