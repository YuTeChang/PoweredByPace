"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClient } from "@/lib/api/client";
import { Group } from "@/types";

export default function CreateGroup() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await ApiClient.createGroup(groupName.trim());
      setCreatedGroup(result.group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };

  const getShareableUrl = () => {
    if (!createdGroup) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/group/shareable/${createdGroup.shareableLink}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const handleContinue = () => {
    if (createdGroup) {
      router.push(`/group/${createdGroup.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-japandi-background-primary py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link
            href="/"
            className="text-japandi-accent-primary hover:text-japandi-accent-hover text-sm transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-japandi-text-primary mt-4 sm:mt-6">
            Create New Group
          </h1>
          <p className="text-japandi-text-secondary mt-2">
            Create a group for your regular badminton sessions. Share the link with your friends so they can view sessions and stats.
          </p>
        </div>

        {!createdGroup ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-japandi-text-primary mb-3">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Friday Night Badminton"
                className="w-full px-4 py-3 border border-japandi-border-light rounded-card bg-japandi-background-card text-japandi-text-primary focus:ring-2 focus:ring-japandi-accent-primary focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={!groupName.trim() || isLoading}
              className="w-full px-6 py-4 bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 disabled:bg-japandi-text-muted disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold rounded-full transition-all shadow-button touch-manipulation"
            >
              {isLoading ? "Creating..." : "Create Group"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-japandi-background-card rounded-card border border-japandi-border-light p-6 shadow-soft">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-japandi-text-primary mb-2">
                  Group Created!
                </h2>
                <p className="text-japandi-text-secondary">
                  Share this link with your friends to invite them to the group.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-japandi-text-secondary mb-2">
                    Group Name
                  </label>
                  <div className="text-lg font-semibold text-japandi-text-primary">
                    {createdGroup.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-japandi-text-secondary mb-2">
                    Shareable Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getShareableUrl()}
                      readOnly
                      className="flex-1 px-4 py-2 border border-japandi-border-light rounded-card bg-japandi-background-primary text-japandi-text-primary text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white text-sm font-semibold rounded-card transition-all"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-japandi-text-secondary mb-2">
                    Short Code
                  </label>
                  <div className="text-lg font-mono text-japandi-accent-primary">
                    {createdGroup.shareableLink}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-4 bg-japandi-accent-primary hover:bg-japandi-accent-hover active:scale-95 text-white font-semibold rounded-full transition-all shadow-button touch-manipulation"
              >
                Go to Group
              </button>
              <Link
                href="/"
                className="flex-1 px-6 py-4 bg-japandi-background-card hover:bg-japandi-background-primary active:scale-95 text-japandi-text-primary border border-japandi-border-light font-semibold rounded-full transition-all text-center touch-manipulation"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


