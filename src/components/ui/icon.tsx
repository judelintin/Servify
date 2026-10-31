import type { ReactNode, SVGProps } from "react";

export type IconName = "grid" | "jobs" | "plus" | "offers" | "messages" | "user" | "arrow" | "arrow-left" | "chevron" | "pin" | "menu" | "close" | "info" | "shield" | "users" | "flag" | "categories" | "check" | "clock" | "external" | "panel-left-close" | "panel-left-open" | "upload";
const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  jobs: <><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 11h18M10 11v3h4v-3"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  offers: <><path d="m3 12 9-9h7a2 2 0 0 1 2 2v7l-9 9L3 12Z"/><circle cx="16.5" cy="7.5" r="1"/></>,
  messages: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5ZM7 9h9M7 13h6"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  "panel-left-close": <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m7-12-3 3 3 3"/></>,
  "panel-left-open": <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m5-12 3 3-3 3"/></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.01"/></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v2"/></>,
  flag: <path d="M4 22V3m0 1c5-4 10 4 16 0v10c-6 4-11-4-16 0"/>,
  categories: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><circle cx="17.5" cy="6.5" r="3.5"/><circle cx="6.5" cy="17.5" r="3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></>,
};
export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
