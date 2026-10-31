"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Brand } from "@/components/brand";
import { Badge, PreviewNote } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { activeNavItem, workspaceNavigation, type WorkspaceRole } from "@/lib/navigation";
import { getSidebarCollapsed, getServerSidebarCollapsed, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar-preference";

export function WorkspaceShell({ role, children }: { role: WorkspaceRole; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarCollapsed, getServerSidebarCollapsed);
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);
  const tooltipId = useId();
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const dismiss = () => { clearTimeout(tooltipTimer.current); setTooltip(null); };
    window.addEventListener("resize", dismiss);
    return () => { clearTimeout(tooltipTimer.current); window.removeEventListener("resize", dismiss); };
  }, []);
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = workspaceNavigation[role];
  const current = activeNavItem(navigation.items, pathname);
  const variant = role === "provider" ? "Pros" : role === "admin" ? "Admin" : undefined;
  const closeMenu = () => setMenuOpen(false);
  function showTooltip(element: HTMLElement, label: string, always = false) {
    clearTimeout(tooltipTimer.current);
    if ((!collapsed && !always) || !window.matchMedia("(min-width: 1024px)").matches) return;
    const rect = element.getBoundingClientRect();
    setTooltip({ label, top: Math.max(24, Math.min(rect.top + rect.height / 2, window.innerHeight - 24)), left: rect.right + 12 });
  }
  function hideTooltip() { tooltipTimer.current = setTimeout(() => setTooltip(null), 100); }
  const nav = <ul className="nav-list">{navigation.items.map((item) => <li key={item.href}><Link href={item.href} className="nav-link" aria-label={item.label} aria-describedby={tooltip?.label === item.label ? tooltipId : undefined} aria-current={current?.href === item.href ? "page" : undefined} onClick={() => { closeMenu(); setTooltip(null); }} onMouseEnter={(event) => showTooltip(event.currentTarget, item.label)} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event.currentTarget, item.label)} onBlur={() => { clearTimeout(tooltipTimer.current); setTooltip(null); }}><Icon name={item.icon}/><span className="nav-link-label">{item.label}</span></Link></li>)}</ul>;
  return (
    <div className={`workspace workspace-${role}`} onKeyDown={(event) => {
      if (event.key === "Escape") { clearTimeout(tooltipTimer.current); setTooltip(null); }
      if (event.key === "Escape" && menuOpen) { closeMenu(); toggle.current?.focus(); }
    }}>
      <aside className="sidebar" tabIndex={0} aria-label={`${navigation.label} sidebar`} onScroll={() => setTooltip(null)}>
        <div className="sidebar-header"><Brand variant={role === "provider" ? undefined : variant}/><Brand variant={role === "provider" ? undefined : variant} compact/><button type="button" className="sidebar-toggle icon-button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-describedby={tooltip?.label === (collapsed ? "Expand sidebar" : "Collapse sidebar") ? tooltipId : undefined} aria-expanded={!collapsed} aria-controls="workspace-desktop-navigation" onClick={() => { clearTimeout(tooltipTimer.current); setTooltip(null); setSidebarCollapsed(!collapsed); }} onMouseEnter={event => showTooltip(event.currentTarget, collapsed ? "Expand sidebar" : "Collapse sidebar", true)} onMouseLeave={hideTooltip} onFocus={event => showTooltip(event.currentTarget, collapsed ? "Expand sidebar" : "Collapse sidebar", true)} onBlur={() => { clearTimeout(tooltipTimer.current); setTooltip(null); }}><Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={20}/></button></div>
        <p className="workspace-label eyebrow">{navigation.eyebrow}</p>
        <nav id="workspace-desktop-navigation" aria-label={`${navigation.label} navigation`}>{nav}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><strong>{role === "admin" ? "Built on accountability." : "Good work starts here."}</strong><p>{role === "admin" ? "A considered space for marketplace operations." : role === "provider" ? "Your skills. Your community. A better way to connect." : "Find the right person for the things that matter."}</p><Link href={role === "customer" ? "/provider/dashboard" : "/customer/dashboard"}>{role === "customer" ? "Explore Servify for Pros" : "View customer workspace"}<Icon name="arrow" size={14}/></Link></div>
          <Link href="/" className="sidebar-home" aria-label="Back to Servify" onMouseEnter={(event) => showTooltip(event.currentTarget, "Back to Servify")} onMouseLeave={hideTooltip} onFocus={(event) => showTooltip(event.currentTarget, "Back to Servify")} onBlur={() => { clearTimeout(tooltipTimer.current); setTooltip(null); }}><Icon name="arrow-left" size={16}/><span className="nav-link-label">Back to Servify</span></Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="mobile-app-header"><Brand variant={variant}/><button ref={toggle} type="button" className="icon-button" aria-label={menuOpen ? "Close workspace menu" : "Open workspace menu"} aria-controls="workspace-mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"}/></button></header>
        {menuOpen && <nav id="workspace-mobile-navigation" className="mobile-workspace-nav" aria-label={`${navigation.label} mobile navigation`}>{nav}<div className="mobile-nav-footer"><Link href="/" onClick={closeMenu}>Back to Servify</Link><Link href="/design-system" onClick={closeMenu}>Design system</Link></div></nav>}
        <header className="workspace-topbar"><div className="workspace-breadcrumb"><span>{navigation.label}</span><Icon name="chevron" size={12}/><strong>{current?.label ?? "Workspace"}</strong></div><div className="topbar-meta"><span className="location-label"><Icon name="pin" size={15}/>Ibadan-first</span><Badge tone="blue">Design preview</Badge></div></header>
        <div className="workspace-content">
          <main id="main-content" tabIndex={-1}>{children}</main>
          <footer className="workspace-footer"><PreviewNote/><Link href="/design-system">Design system ↗</Link></footer>
        </div>
      </div>
      {tooltip && createPortal(<div id={tooltipId} role="tooltip" className="workspace-tooltip" style={{ top: tooltip.top, left: tooltip.left }} onMouseEnter={() => clearTimeout(tooltipTimer.current)} onMouseLeave={hideTooltip}>{tooltip.label}</div>, document.body)}
    </div>
  );
}
