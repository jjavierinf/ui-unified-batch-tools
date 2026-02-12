"use client";

import { useEffect, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useWhatsNewStore } from "@/lib/whats-new-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import { useEditorStore } from "@/lib/store";

const WHATS_NEW_VERSION = "2026-02-12-phase7-guide-v1";
const BASE_STEP_COUNT = 9;

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
  { label: "4. YAML task config + cohesión DAG/task", status: "done" },
  { label: "5. Save/Push workflow", status: "done" },
  { label: "6. Alta pipeline + DnD hardening", status: "done" },
  { label: "7. Push unificado + confirmación Prod", status: "current" },
];

const outOfScopeItems = [
  "Ejecución real de queries en base de datos.",
  "Creación real de PR/notificaciones en proveedor git (hoy: MOCK-PR).",
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
          content: "Abrí Pipelines para ver estado agregado de cada flujo.",
          disableBeacon: true,
        },
        {
          target: '[data-tour="workspace-save-all"]',
          content: "Paso 1: Save all. Guarda cambios locales y mueve a estado Saved.",
        },
        {
          target: '[data-tour="environment-toggle"]',
          content: "Paso 2: elegí Dev o Prod. Esto define a dónde van las acciones de submit/push (no es checkout de branch).",
        },
        {
          target: '[data-tour="workspace-push"]',
          content: "Paso 3: Push. En Dev sube el batch; en Prod abre confirmación y lo manda a review (requiere Team Leader).",
        },
        {
          target: '[data-tour="create-pipeline-button"]',
          content: "Fase 6: alta rápida de pipeline en 1 paso.",
        },
        {
          target: '[data-tour="create-pipeline-modal"]',
          content: "Modal mínimo: integration, name, type y schedule.",
        },
        {
          target: '[data-tour="create-pipeline-submit"]',
          content: "Crea DAG + tasks seed (extract/transform/load/dqa) y abre en Pro.",
        },
        {
          target: '[data-tour="status-legend"]',
          content: "Estos badges muestran el lifecycle real del archivo/pipeline.",
        },
        {
          target: '[data-tour="whats-new-link-pdf"]',
          content: "Este link abre el PDF más nuevo (según el número de phase en docs/changelogs).",
        },
      ];

      if (isLeader) {
        baseSteps.push({
          target: '[data-tour="nav-reviews"]',
          content: "Como líder, en Reviews ves lo pendiente de aprobación.",
        });
        if (pendingReviewCount > 0) {
          baseSteps.push({
            target: '[data-tour="approve-all"]',
            content: "Approve All aprueba todo el lote pendiente.",
          });
          baseSteps.push({
            target: '[data-tour="request-changes"]',
            content: "Request Changes rechaza el lote y lo devuelve a draft.",
          });
        } else {
          baseSteps.push({
            target: '[data-tour="reviews-content"]',
            content: "No hay pendientes ahora. Cambiá a Prod y hacé Push para generar una review.",
          });
        }
      } else {
        baseSteps.push({
          target: '[data-tour="user-menu-trigger"]',
          content: "Tip: cambiá a Team Leader desde el menú de usuario para probar Approve/Reject.",
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
    if (isLeader && data.index >= BASE_STEP_COUNT) {
      setViewMode("approvals");
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
                  Fase 7: push unificado + confirmación de Prod
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
