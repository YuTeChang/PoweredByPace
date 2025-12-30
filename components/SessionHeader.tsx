"use client";

import Link from "next/link";
import { Session } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { useSession } from "@/contexts/SessionContext";
import { useRouter } from "next/navigation";

interface SessionHeaderProps {
  session: Session;
}

export default function SessionHeader({ session }: SessionHeaderProps) {
  const router = useRouter();
  const { clearSession } = useSession();
  const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleEndSession = () => {
    const confirmed = window.confirm("Are you sure you want to end this session? This will clear all data.");
    if (confirmed) {
      clearSession();
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        router.push("/");
      }, 100);
    }
  };

  return (
    <div className="bg-japandi-background-card border-b border-japandi-border-light sticky top-0 z-10 shadow-soft">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-start justify-between mb-3">
          <Link
            href="/"
            className="text-japandi-accent-primary hover:text-japandi-accent-hover active:opacity-70 text-sm transition-all flex items-center gap-1 touch-manipulation"
          >
            ← Back to Home
          </Link>
          <button
            type="button"
            onClick={handleEndSession}
            className="text-sm text-japandi-text-secondary hover:text-japandi-text-primary active:opacity-70 transition-all touch-manipulation"
          >
            End Session
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-japandi-text-primary">
              {session.name || "Badminton Session"}
            </h1>
            <p className="text-sm sm:text-base text-japandi-text-secondary mt-1 sm:mt-2">
              {formattedDate}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-japandi-text-muted">
                {session.players.length} players
              </span>
              <span className="text-sm text-japandi-text-muted">
                •
              </span>
              <span className="text-sm text-japandi-text-muted">
                {formatCurrency(session.betPerPlayer)} per game
              </span>
            </div>
          </div>
          <Link
            href={`/session/${session.id}/summary`}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white text-xs sm:text-sm font-semibold rounded-full transition-colors shadow-button whitespace-nowrap"
          >
            View Summary
          </Link>
        </div>
      </div>
    </div>
  );
}

