"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore, USERS, UserRole } from "@/lib/auth-store";

const roleBadgeConfig: Record<UserRole, { label: string; className: string; dotClass: string }> = {
  user: {
    label: "Engineer",
    className: "bg-badge-submitted/15 text-badge-submitted",
    dotClass: "bg-badge-submitted",
  },
  leader: {
    label: "Leader",
    className: "bg-badge-pending/15 text-badge-pending",
    dotClass: "bg-badge-pending",
  },
};

export function UserMenu() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!currentUser) return null;

  const badge = roleBadgeConfig[currentUser.role];
  const otherUsers = USERS.filter((u) => u.id !== currentUser.id);

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        data-tour="user-menu-trigger"
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-semibold">
          {currentUser.avatar}
        </div>

        {/* Name + role */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">
            {currentUser.name}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded-full ${badge.className}`}
          >
            <span className={`w-1 h-1 rounded-full ${badge.dotClass}`} />
            {badge.label}
          </span>
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-tertiary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-surface border border-sidebar-border shadow-lg z-50 overflow-hidden animate-slide-in">
          {/* Current user info */}
          <div className="px-3 py-2.5 border-b border-sidebar-border">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
              Signed in as
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                {currentUser.avatar}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {currentUser.role === "leader"
                    ? "Can approve submissions"
                    : "Can submit changes"}
                </span>
              </div>
            </div>
          </div>

          {/* Switch user section */}
          {otherUsers.length > 0 && (
            <div className="px-1.5 py-1.5 border-b border-sidebar-border">
              <p className="px-2 py-1 text-[10px] text-text-tertiary uppercase tracking-wider">
                Switch user
              </p>
              {otherUsers.map((user) => {
                const otherBadge = roleBadgeConfig[user.role];
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      login(user.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {user.avatar}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-medium text-foreground">
                        {user.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded-full w-fit ${otherBadge.className}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${otherBadge.dotClass}`}
                        />
                        {otherBadge.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Logout */}
          <div className="px-1.5 py-1.5">
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span className="text-xs font-medium text-red-500">
                Log out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
