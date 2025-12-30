"use client";

import Link from "next/link";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { session, games } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-japandi-text-primary">
          VibeBadminton
        </h1>
        <p className="text-base sm:text-lg text-japandi-text-secondary px-4">
          Track your badminton doubles games and automatically calculate who owes what
        </p>
        
        {/* Continue Session Card */}
        {isLoaded && session && (
          <div className="bg-japandi-background-card border border-japandi-border-light rounded-card p-6 text-left shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-japandi-text-primary">
                Active Session
              </h2>
              <span className="text-xs text-japandi-accent-primary bg-japandi-background-primary px-3 py-1 rounded-full">
                {games.length} {games.length === 1 ? "game" : "games"}
              </span>
            </div>
            <div className="text-base text-japandi-text-primary mb-2">
              {session.name || "Untitled Session"}
            </div>
            <div className="text-sm text-japandi-text-muted mb-4">
              {formatDate(session.date)} • {session.players.length} players
            </div>
            <Link
              href={`/session/${session.id}`}
              className="block w-full bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white font-semibold py-3 px-6 rounded-full transition-all text-center shadow-button touch-manipulation"
            >
              Continue Session
            </Link>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <Link
            href="/create-session"
            className="inline-block w-full bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white font-semibold py-3 px-6 rounded-full transition-all shadow-button touch-manipulation"
          >
            {session ? "Create New Session" : "Create New Session"}
          </Link>
        </div>
      </div>
    </main>
  );
}

