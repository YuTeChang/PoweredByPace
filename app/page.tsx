"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-japandi-text-primary">
          PoweredByPace
        </h1>
        <p className="text-base sm:text-lg text-japandi-text-secondary px-4">
          Track your badminton games and automatically calculate who owes what
        </p>

        <div className="pt-4 space-y-3">
          <Link
            href="/dashboard"
            className="inline-block w-full bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white font-semibold py-3 px-6 rounded-full transition-all shadow-button touch-manipulation"
          >
            View Sessions & Groups
          </Link>
          <Link
            href="/create-group"
            className="inline-block w-full bg-japandi-background-card hover:bg-japandi-background-primary active:scale-95 text-japandi-text-primary border border-japandi-border-light font-semibold py-3 px-6 rounded-full transition-all touch-manipulation"
          >
            Create New Group
          </Link>
          <Link
            href="/create-session"
            className="inline-block w-full bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white font-semibold py-3 px-6 rounded-full transition-all shadow-button touch-manipulation"
          >
            Quick Session (No Group)
          </Link>
        </div>
      </div>
    </main>
  );
}
