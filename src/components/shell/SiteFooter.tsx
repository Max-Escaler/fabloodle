import { DISCORD_INVITE_URL, fabToolsHref, fabTradesHref } from "../../lib/links";
import { DiscordMark, ExternalIcon } from "../ui/icons";

// Slim footer under each page, like FAB Tools' SiteFooter. Desktop also shows
// the Discord CTA in the sidebar; on phones this is the only place it lives.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 min-w-0 space-y-1.5">
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7983F5] hover:text-[#9aa2f8]"
          >
            <DiscordMark size={16} />
            Join our Discord
          </a>
          <p className="text-xs text-muted">
            Part of the FABTools family:{" "}
            <a
              href={fabToolsHref("footer")}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline"
            >
              FAB Tools
              <ExternalIcon size={12} />
            </a>
            <span aria-hidden="true" className="mx-1.5 text-faint">·</span>
            <a
              href={fabTradesHref("footer")}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline"
            >
              FAB Trades
              <ExternalIcon size={12} />
            </a>
          </p>
        </div>
        <p className="text-xs text-faint">
          Fan-made, not affiliated with Legend Story Studios.
        </p>
      </div>
    </footer>
  );
}
