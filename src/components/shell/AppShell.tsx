import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { trackNavLinkClicked } from "../../utils/analytics";
import type { NavLink as NavLinkName } from "../../utils/analytics";
import { CREATOR_URL, fabToolsHref, fabTradesHref } from "../../lib/links";
import {
  CalendarIcon,
  CardsIcon,
  ExternalIcon,
  PriceTagIcon,
  PuzzleIcon,
  ToolsIcon,
} from "../ui/icons";
import { BrandMark, Wordmark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";

type IconType = (p: { size?: number; className?: string }) => ReactNode;

type NavItem = {
  id: string;
  label: string;
  short: string;
  to: string;
  state?: unknown;
  icon: IconType;
  active: boolean;
  analytics: NavLinkName;
};

type ExternalItem = {
  id: string;
  name: string;
  short: string;
  blurb: string;
  href: (placement: "sidebar" | "tabbar") => string;
  icon: IconType;
};

const SISTERS: ExternalItem[] = [
  {
    id: "fabtools",
    name: "FAB Tools",
    short: "Tools",
    blurb: "Rankings & tier lists",
    href: fabToolsHref,
    icon: ToolsIcon,
  },
  {
    id: "fabtrades",
    name: "FAB Trades",
    short: "Trades",
    blurb: "Price & trade cards",
    href: fabTradesHref,
    icon: PriceTagIcon,
  },
];

function useNav(puzzlePath: string, isArchivePuzzle: boolean): NavItem[] {
  const { pathname } = useLocation();
  const onPuzzle = pathname === "/" || pathname.startsWith("/play/");
  return [
    {
      id: "puzzle",
      label: isArchivePuzzle ? "Puzzle" : "Today's puzzle",
      short: isArchivePuzzle ? "Puzzle" : "Today",
      to: puzzlePath,
      icon: PuzzleIcon,
      active: onPuzzle,
      analytics: "back_to_puzzle",
    },
    {
      id: "archive",
      label: "Past puzzles",
      short: "Archive",
      to: "/archive",
      icon: CalendarIcon,
      active: pathname === "/archive",
      analytics: "past_fabloodles",
    },
    {
      id: "cards",
      label: "Card browser",
      short: "Cards",
      to: "/cards",
      // The browser's "Guess this card" sends the guess back to this puzzle.
      state: { returnTo: puzzlePath },
      icon: CardsIcon,
      active: pathname === "/cards",
      analytics: "browse_cards",
    },
  ];
}

const navLink = (active: boolean) =>
  `flex items-center gap-3 h-10 px-3 rounded-md text-sm font-semibold transition-colors ${
    active ? "bg-accent-soft text-accent-text" : "text-muted hover:text-fg hover:bg-sunken"
  }`;

/**
 * App chrome shared with FAB Tools and FAB Trades: a fixed left sidebar on
 * desktop, and a top bar plus bottom tab bar on phones. Pages render inside
 * `shell-content`, which pads for whichever bars are showing.
 */
export function AppShell({
  children,
  puzzlePath,
  isArchivePuzzle,
}: {
  children: ReactNode;
  /** Where "Puzzle" points: "/" for today, /play/<date> for an archive game. */
  puzzlePath: string;
  isArchivePuzzle: boolean;
}) {
  const nav = useNav(puzzlePath, isArchivePuzzle);
  return (
    <div data-shell="app" className="shell-content min-h-dvh flex flex-col">
      <Sidebar nav={nav} />
      <TopBar />
      <TabBar nav={nav} />
      {children}
    </div>
  );
}

function useTrack() {
  const { pathname } = useLocation();
  return (item: NavItem) => {
    if (item.active) return;
    trackNavLinkClicked({ link: item.analytics, from: pathname });
  };
}

function Sidebar({ nav }: { nav: NavItem[] }) {
  const track = useTrack();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width)] flex-col bg-surface border-r border-line">
      <Link to="/" className="flex items-center gap-3 px-5 h-16 shrink-0">
        <BrandMark size={34} />
        <Wordmark />
      </Link>

      <nav aria-label="Main" className="px-3 pt-2 overflow-y-auto">
        <div className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                state={item.state}
                aria-current={item.active ? "page" : undefined}
                onClick={() => track(item)}
                className={navLink(item.active)}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <p className="eyebrow px-3 mt-6 mb-1.5">More FAB tools</p>
        <div className="space-y-0.5">
          {SISTERS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={s.href("sidebar")}
                target="_blank"
                rel="noopener"
                className={`group ${navLink(false)} h-auto py-2`}
              >
                <Icon size={19} />
                <span className="flex-1 min-w-0">
                  <span className="block">{s.name}</span>
                  <span className="block text-[11px] font-medium text-faint">{s.blurb}</span>
                </span>
                <ExternalIcon size={14} className="text-faint group-hover:text-accent-text" />
              </a>
            );
          })}
        </div>
      </nav>

      <div className="flex-1" />

      <div className="px-3 pb-4 space-y-1">
        <ThemeToggle withLabel />
        <div className="border-t border-line mt-2 pt-3 px-1 space-y-1.5">
          <p className="text-xs text-muted">
            Made by{" "}
            <a
              href={CREATOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-fg hover:text-accent-text"
            >
              MXBloom
            </a>
          </p>
          <p className="text-[11px] text-faint leading-snug">
            Fan-made, not affiliated with Legend Story Studios.
          </p>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="lg:hidden fixed top-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-b border-line"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="h-14 px-4 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <BrandMark size={28} />
          <span
            className="font-display text-base font-extrabold"
            style={{ fontStretch: "112%", letterSpacing: "-0.02em" }}
          >
            Fabloodle
          </span>
        </Link>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}

function TabBar({ nav }: { nav: NavItem[] }) {
  const track = useTrack();
  const tab =
    "flex-1 min-w-0 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors";
  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="h-16 flex">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              state={item.state}
              aria-current={item.active ? "page" : undefined}
              onClick={() => track(item)}
              className={`${tab} ${item.active ? "text-accent-text" : "text-muted hover:text-fg"}`}
            >
              <span
                className={`grid place-items-center w-12 h-7 rounded-full ${
                  item.active ? "bg-accent-soft" : ""
                }`}
              >
                <Icon size={20} />
              </span>
              {item.short}
            </Link>
          );
        })}
        {SISTERS.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.id}
              href={s.href("tabbar")}
              target="_blank"
              rel="noopener"
              className={`${tab} text-muted hover:text-fg`}
            >
              <span className="grid place-items-center w-12 h-7 rounded-full">
                <Icon size={20} />
              </span>
              <span className="truncate">{s.short} ↗</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
