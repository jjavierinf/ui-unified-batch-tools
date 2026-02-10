"use client";

import { type ReactNode } from "react";
import { useToastStore, type ToastType } from "@/lib/toast-store";

const iconMap: Record<ToastType, ReactNode> = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const styleMap: Record<ToastType, string> = {
  success: "text-badge-approved bg-badge-approved/10 border-badge-approved/30",
  error: "text-red-500 bg-red-500/10 border-red-500/30",
  info: "text-accent bg-accent/10 border-accent/30",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-xs font-medium backdrop-blur-sm animate-slide-in ${styleMap[toast.type]}`}
        >
          <span className="shrink-0">{iconMap[toast.type]}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Dismiss"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
