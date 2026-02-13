"use client";

import { useEffect, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useWhatsNewStore } from "@/lib/whats-new-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import { useEditorStore } from "@/lib/store";

const WHATS_NEW_VERSION = "2026-02-12-phase19-guide-v1";
type PlanStatus = "done" | "current" | "future" | "out";

interface PlanItem {
  label: string;
  status: PlanStatus;
  note?: string;
}

const planItems: PlanItem[] = [
  { label: "1. Base navigation UX and layout", status: "done" },
  { label: "2. Stage folders in mock/test repo", status: "done" },
  { label: "3. SQL Explorer + Pipelines Simple/Pro", status: "done" },
  { label: "4. YAML task config + DAG/task cohesion", status: "done" },
  { label: "5. Save/Push workflow", status: "done" },
  { label: "6. Pipeline creation + DnD hardening", status: "done" },
  { label: "7. Unified Push + Prod confirmation", status: "done" },
  { label: "8. Task config UX (gear) + discoverable diff", status: "done" },
  { label: "9. Visible DDL + realistic DQA (2 types)", status: "done" },
  { label: "10. Pro folder focus -> pipeline summary", status: "done" },
  { label: "11. SQL Explorer manage connections", status: "done" },
  { label: "12. Safety guardrails (Team Leader)", status: "done" },
  { label: "13. Human-readable status labels + Prod modal", status: "done" },
  { label: "14. Header hierarchy + Push clarity", status: "done" },
  { label: "15. Task cards config summary", status: "done" },
  { label: "16. SQL Explorer DBeaver clicks + breadcrumb", status: "done" },
  { label: "17. Manage connections UX guardrails", status: "done" },
  { label: "18. Safety guardrails callouts", status: "done" },
  { label: "19. Guided tour + storytelling fallbacks", status: "done" },
  { label: "20. SQL Explorer database navigator", status: "done" },
  { label: "21. SQL Explorer connection engine icon", status: "done" },
  { label: "22. UI overhaul — wow factor + polish", status: "current" },
];

const outOfScopeItems = [
  "Real query execution against a database.",
  "Real PR creation/notifications in git provider (currently: MOCK-PR).",
];

export function WhatNewGuide() {
  const isOpen = useWhatsNewStore((s) => s.isOpen);
  const open = useWhatsNewStore((s) => s.open);
  const close = useWhatsNewStore((s) => s.close);
  const startTourSignal = useWhatsNewStore((s) => s.startTourSignal);
  const startTour = useWhatsNewStore((s) => s.startTour);

  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);
  const currentUser = useAuthStore((s) => s.currentUser);
  const files = useEditorStore((s) => s.files);

  const [finishedSignal, setFinishedSignal] = useState(0);
  const runTour = startTourSignal > finishedSignal;
  const isLeader = currentUser?.role === "leader";
  const pendingReviewCount = Object.values(files).filter((f) => f.status === "pending_approval").length;

  const steps = useMemo<Step[]>(
    () => {
      const baseSteps: Step[] = [
        {
          target: '[data-tour="nav-pipelines"]',
          content: "Open Pipelines to see the aggregate status of each flow.",
          disableBeacon: true,
        },
        {
          target: '[data-tour="status-legend"]',
          content: "These badges show the file/pipeline lifecycle. Tip: in scaffold you can cycle status per row.",
        },
        {
          target: '[data-tour="create-pipeline-button"]',
          content: "Quick create: one-step pipeline creation to seed extract/transform/load/ddl/dqa tasks.",
        },
        {
          target: '[data-tour="create-pipeline-modal"]',
          content: "Fill in integration, name, type, and schedule. (Mock data, but realistic structure.)",
        },
        {
          target: '[data-tour="create-pipeline-submit"]',
          content: "Creates the DAG + seed tasks and opens the pipeline for editing.",
        },
        {
          target: '[data-tour="workspace-save-all"]',
          content: "Step 1: Save all. Saves local changes and moves files to Saved status.",
        },
        {
          target: '[data-tour="environment-toggle"]',
          content: "Step 2: choose Dev or Prod. Defines submit/push target (not a branch checkout).",
        },
        {
          target: '[data-tour="workspace-push"]',
          content: "Step 3: Push. In Dev, pushes the batch; in Prod, opens confirmation and sends to review (requires Team Leader).",
        },
        {
          target: '[data-tour="whats-new-link-pdf"]',
          content: "This link opens the latest PDF changelog (by phase number in docs/changelogs).",
        },
      ];

      if (isLeader) {
        baseSteps.push({
          target: '[data-tour="nav-safety"]',
          content: "Safety (leader-only): define team guardrails for Explorer and Pipes.",
        });
        baseSteps.push({
          target: '[data-tour="nav-reviews"]',
          content: "In Reviews you see items pending approval (Prod).",
        });
        if (pendingReviewCount > 0) {
          baseSteps.push({
            target: '[data-tour="approve-all"]',
            content: "Approve All approves the entire pending batch.",
          });
          baseSteps.push({
            target: '[data-tour="request-changes"]',
            content: "Request Changes rejects the batch and returns it to draft.",
          });
        } else {
          baseSteps.push({
            target: '[data-tour="reviews-content"]',
            content: "No pending items right now. Switch to Prod and Push to generate a review.",
          });
        }
      } else {
        baseSteps.push({
          target: '[data-tour="user-menu-trigger"]',
          content: "Tip: switch to Team Leader from the user menu to try Approve/Reject.",
        });
      }

      return baseSteps;
    },
    [isLeader, pendingReviewCount]
  );

  useEffect(() => {
    const key = `whats-new:${WHATS_NEW_VERSION}`;
    if (localStorage.getItem(key) === "seen") return;
    localStorage.setItem(key, "seen");
    open();
  }, [open]);

  useEffect(() => {
    if (startTourSignal === 0) return;
    setViewMode("pipeline");
    setPipelineSubMode("simple");
  }, [setPipelineSubMode, setViewMode, startTourSignal]);

  const handleJoyride = (data: CallBackProps) => {
    if (isLeader) {
      const target = typeof data.step?.target === "string" ? data.step.target : "";
      if (target.includes('nav-safety')) {
        setViewMode("safety");
      } else if (
        target.includes('nav-reviews') ||
        target.includes('approve-all') ||
        target.includes('request-changes') ||
        target.includes('reviews-content') ||
        target.includes('approvals-actions')
      ) {
        setViewMode("approvals");
      }
    }
    const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    if (finished) {
      setFinishedSignal(startTourSignal);
    }
  };

  return (
    <>
      <Joyride
        run={runTour}
        steps={steps}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        spotlightClicks
        callback={handleJoyride}
        styles={{
          options: {
            zIndex: 1100,
            primaryColor: "#7c3aed",
            backgroundColor: "#1f1f1f",
            textColor: "#f3f4f6",
            arrowColor: "#1f1f1f",
          },
        }}
      />

      {isOpen && (
        <div className="fixed inset-0 z-[1050] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-sidebar-border bg-surface shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">What&apos;s new</h2>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Phase 22: UI overhaul — dashboard, DAG flow, console, changes panel
                </p>
              </div>
              <button
                onClick={close}
                className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div className="space-y-1.5">
                {planItems.map((item) => {
                  const base = "text-xs rounded-md px-2 py-1 border border-sidebar-border";
                  if (item.status === "done") {
                    return (
                      <div key={item.label} className={`${base} text-text-tertiary line-through bg-surface-hover/40`}>
                        [done] {item.label}
                      </div>
                    );
                  }
                  if (item.status === "current") {
                    return (
                      <div key={item.label} className={`${base} text-foreground bg-accent/10 border-accent/40`}>
                        [current] {item.label}
                      </div>
                    );
                  }
                  return (
                    <div key={item.label} className={`${base} text-text-secondary`}>
                      [next] {item.label}
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="text-[11px] text-text-tertiary mb-1">Out of phase scope</p>
                <div className="space-y-1">
                  {outOfScopeItems.map((item) => (
                    <div key={item} className="text-xs text-text-secondary px-2 py-1 rounded-md border border-sidebar-border bg-surface-hover/30">
                      [out] {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-end gap-2">
              <button
                onClick={close}
                className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover cursor-pointer"
              >
                Later
              </button>
              <button
                onClick={startTour}
                className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/85 cursor-pointer"
              >
                Start guided tour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
