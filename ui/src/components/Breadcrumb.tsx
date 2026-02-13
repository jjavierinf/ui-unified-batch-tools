"use client";

interface BreadcrumbProps {
  segments: Array<{ label: string; onClick?: () => void }>;
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  if (segments.length === 0) return null;

  return (
    <div className="px-4 py-1.5 border-b border-sidebar-border bg-surface/50 flex items-center gap-1 text-xs min-h-[28px]">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-tertiary shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {isLast ? (
              <span className="text-foreground font-medium truncate">
                {seg.label}
              </span>
            ) : seg.onClick ? (
              <button
                onClick={seg.onClick}
                className="text-text-secondary hover:text-foreground transition-colors cursor-pointer truncate"
              >
                {seg.label}
              </button>
            ) : (
              <span className="text-text-secondary truncate">{seg.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
