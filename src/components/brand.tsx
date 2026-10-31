import Link from "next/link";
export function Brand({ variant, compact = false }: { variant?: "Pros" | "Admin"; compact?: boolean }) {
  return <Link href="/" className={`brand${compact ? " brand-compact" : ""}`} aria-label={`Servify${variant ? ` ${variant}` : ""} homepage`}>{compact ? "s" : "servify"}<span className="brand-dot" aria-hidden="true"/>{variant && !compact && <span className="brand-addon">{variant === "Pros" ? "for Pros" : variant}</span>}</Link>;
}
