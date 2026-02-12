"use client";

import { useEffect, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useWhatsNewStore } from "@/lib/whats-new-store";
import { useWorkspaceStore } from "@/lib/workspace-store";

const WHATS_NEW_VERSION = "2026-02-11-phase4-guide-v1";

type PlanStatus = "done" | "current" | "future" | "out";

interface PlanItem {
  label: string;
  status: PlanStatus;
  note?: string;
}

const planItems: PlanItem[] = [
  { label: "1. Base UX de navegación y layout", status: "done" },
  { label: "2. Stage folders en mock/repo de test", status: "done" },
  { label: "3. SQL Explorer + Pipelines Simple/Pro", status: "done" },
  { label: "4. YAML task config + cohesión DAG/task", status: "current" },
  { label: "5. Save/Push workflow", status: "future" },
  { label: "6. Alta pipeline + DnD hardening", status: "future" },
];

const outOfScopeItems = [
  "Ejecución real de queries en base de datos.",
  "Creación real de PR/notificaciones en proveedor git.",
];

export function WhatNewGuide() {
  const isOpen = useWhatsNewStore((s) => s.isOpen);
  const open = useWhatsNewStore((s) => s.open);
  const close = useWhatsNewStore((s) => s.close);
  const startTourSignal = useWhatsNewStore((s) => s.startTourSignal);
  const startTour = useWhatsNewStore((s) => s.startTour);

  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);

  const [finishedSignal, setFinishedSignal] = useState(0);
  const runTour = startTourSignal > finishedSignal;

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="nav-pipelines"]',
        content: "Pipelines es el espacio principal de operación.",
        disableBeacon: true,
      },
      {
        target: '[data-tour="group-toggle"]',
        content: "Acá cambiás agrupación real: por tag o por integration.",
      },
      {
        target: '[data-tour="status-legend"]',
        content: "Leyenda de estados para entender badges y su significado.",
      },
      {
        target: '[data-tour="status-cycle"]',
        content: "En scaffold podés ciclar estados por fila para demo.",
      },
      {
        target: '[data-tour="whats-new-link-pdf"]',
        content: "Este link abre el PDF actual de cambios de la branch.",
      },
    ],
    []
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
                  Hybrid: tour guiado + checklist del plan de trabajo
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
