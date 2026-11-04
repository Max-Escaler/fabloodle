import { CREATOR_URL, fabToolsHref, fabTradesHref } from "../../lib/links";
import { ExternalIcon } from "../ui/icons";

// Slim footer under each page, like FAB Tools' SiteFooter. Desktop also shows
// the credit in the sidebar; on phones this is the only place it lives.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="flex-1 min-w-0 text-xs text-muted">
          Part of the FAB family with{" "}
          <a
            href={fabToolsHref("footer")}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline"
          >
            FAB Tools
            <ExternalIcon size={12} />
          </a>{" "}
          and{" "}
          <a
            href={fabTradesHref("footer")}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline"
          >
            FAB Trades
            <ExternalIcon size={12} />
          </a>
          .
        </p>
        <p className="text-xs text-faint">
          Made by{" "}
          <a
            href={CREATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-fg"
          >
            MXBloom
          </a>{" "}
          · Fan-made, not affiliated with Legend Story Studios.
        </p>
      </div>
    </footer>
  );
}
