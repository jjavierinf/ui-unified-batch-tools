"use client";

import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/lib/toast-store";

interface SupportModalProps {
  onClose: () => void;
}

export function SupportModal({ onClose }: SupportModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Bug Report");
  const addToast = useToastStore((s) => s.addToast);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Autofocus subject on mount
  useEffect(() => {
    const timeout = setTimeout(() => subjectRef.current?.focus(), 50);
    return () => clearTimeout(timeout);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    const ticketId = `DATA-${Math.floor(1000 + Math.random() * 9000)}`;
    addToast(`Ticket ${ticketId} created and notified to #help-data`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-sidebar-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-foreground">
            Submit Support Request
          </h2>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-foreground cursor-pointer transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="support-subject"
              className="block text-xs font-medium text-text-secondary"
            >
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              ref={subjectRef}
              id="support-subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full px-3 py-2 text-sm bg-background border border-sidebar-border rounded-md text-foreground placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="support-description"
              className="block text-xs font-medium text-text-secondary"
            >
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="support-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-background border border-sidebar-border rounded-md text-foreground placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors resize-none"
              spellCheck={false}
            />
          </div>

          {/* Priority + Category row */}
          <div className="flex gap-3">
            {/* Priority */}
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="support-priority"
                className="block text-xs font-medium text-text-secondary"
              >
                Priority
              </label>
              <select
                id="support-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-sidebar-border rounded-md text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors cursor-pointer appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="support-category"
                className="block text-xs font-medium text-text-secondary"
              >
                Category
              </label>
              <select
                id="support-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-sidebar-border rounded-md text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors cursor-pointer appearance-none"
              >
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Data Issue">Data Issue</option>
                <option value="Access Request">Access Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-md text-white bg-accent hover:bg-accent/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-sidebar-border bg-surface-hover/50">
          <p className="text-[10px] text-text-tertiary text-center">
            Press <kbd className="inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 text-[10px] font-medium bg-surface border border-sidebar-border rounded text-text-secondary">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
