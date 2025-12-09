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
    <div className="bg-japandi-background-card rounded-card border border-japandi-border-light p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-japandi-text-primary">
            {player.name}
          </h3>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-base">
              <span className="text-japandi-text-secondary">W/L: </span>
              <span className="font-medium text-japandi-text-primary">
                {stats.wins}-{stats.losses}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-xl font-bold ${
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
          <div className="text-sm text-japandi-text-muted mt-1">
            Net
          </div>
        </div>
      </div>
    </div>
  );
}

