"use client";

import { useEffect, useState } from "react";

export function BranchIndicator() {
  const [branch, setBranch] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchBranch() {
      try {
        const res = await fetch("/api/git/status");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (mounted) {
          setBranch(data.branch);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      }
    }

    fetchBranch();
    const interval = setInterval(fetchBranch, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return (
      <span className="text-[10px] text-text-tertiary flex items-center gap-1 px-2 py-1 rounded bg-surface-hover/50" title="Git repo not connected">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        no repo
      </span>
    );
  }

  if (!branch) return null;

  return (
    <span className="text-[10px] text-text-secondary flex items-center gap-1 px-2 py-1 rounded bg-surface-hover/50" title={`Current branch: ${branch}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
      {branch.length > 25 ? `...${branch.slice(-22)}` : branch}
    </span>
  );
}
