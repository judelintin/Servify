"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/ui/icon";
import { ButtonLink, PreviewNote } from "@/components/ui/primitives";

export function SectionContainer({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`container ${className}`}>{children}</div>; }
export function PublicShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <div className="public-shell" onKeyDown={(event) => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); toggle.current?.focus(); } }}>
    <SectionContainer>
      <header className="public-header"><Brand/><nav className="public-nav" aria-label="Public navigation"><Link href="/customer/dashboard">For customers</Link><Link href="/provider/dashboard">For professionals</Link><Link href="/auth/sign-in">Sign in</Link><ButtonLink href="/jobs/new" icon="arrow">Post a job</ButtonLink></nav><button ref={toggle} className="icon-button public-menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-controls="public-mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"}/></button></header>
      {menuOpen && <nav id="public-mobile-navigation" className="public-mobile-nav" aria-label="Public mobile navigation">{[{ href: "/customer/dashboard", label: "For customers" }, { href: "/provider/dashboard", label: "For professionals" }, { href: "/auth/sign-in", label: "Sign in" }, { href: "/jobs/new", label: "Post a job" }].map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}</nav>}
    </SectionContainer>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <SectionContainer><footer className="public-footer"><div><Brand/><p>Find the right person. Get it done.</p></div><nav aria-label="Footer navigation"><Link href="/customer/dashboard">Customer workspace</Link><Link href="/provider/dashboard">Servify for Pros</Link><Link href="/design-system">Design system</Link></nav></footer><div className="public-preview-footer"><PreviewNote/></div></SectionContainer>
  </div>;
}
