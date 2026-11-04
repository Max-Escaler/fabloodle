import type { ReactNode } from "react";

// Standard page frame inside the app shell: consistent gutters and a readable
// max width. Same frame as FAB Tools' <Page>.
export function Page({
  children,
  width = "max-w-5xl",
  className = "",
}: {
  children: ReactNode;
  width?: string;
  className?: string;
}) {
  return (
    <main
      className={`flex-1 w-full ${width} mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-8 pb-10 ${className}`}
    >
      {children}
    </main>
  );
}

// Page title block: eyebrow, title, muted subtitle, and actions that sit right
// on wide screens and wrap below on phones.
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8 ${className}`}>
      <div className="min-w-0 flex-[1_1_320px]">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <div className="text-[0.9375rem] text-muted mt-2 max-w-[65ch]">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Small heading that labels a group of content, with an optional count pill.
export function SectionTitle({
  children,
  count,
  aside,
  className = "",
}: {
  children: ReactNode;
  count?: number;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 mb-3 min-w-0 ${className}`}>
      <h2 className="section-title">{children}</h2>
      {count != null && (
        <span className="tnum text-xs font-semibold text-muted bg-sunken rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
      {aside && <span className="text-sm text-muted truncate">{aside}</span>}
    </div>
  );
}
