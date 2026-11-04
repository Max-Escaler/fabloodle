// Sister sites. Every outbound link carries UTM tags (the same scheme FAB
// Tools uses for FAB Trades) so each site's analytics can tell which
// placement in Fabloodle sent the visit.
export const FABTOOLS_URL = "https://fabtools.io";
export const FABTRADES_URL = "https://fabtrades.net";
export const CREATOR_URL = "https://twitter.com/mx_bloom";

export type SisterPlacement = "sidebar" | "tabbar" | "footer";

function withUtm(base: string, placement: SisterPlacement): string {
  const url = new URL("/", base);
  url.searchParams.set("utm_source", "fabloodle");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", placement);
  return url.toString();
}

export const fabToolsHref = (placement: SisterPlacement) => withUtm(FABTOOLS_URL, placement);
export const fabTradesHref = (placement: SisterPlacement) => withUtm(FABTRADES_URL, placement);
