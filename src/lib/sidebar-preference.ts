export const sidebarPreferenceKey = "servify-sidebar";
// Static, non-user content. Runs before paint so a saved width does not flash.
export const sidebarPreferenceScript = `try{document.documentElement.dataset.sidebarCollapsed=String(localStorage.getItem("${sidebarPreferenceKey}")==="collapsed")}catch{}`;

const changed = "servify-sidebar-changed";
export function getSidebarCollapsed() { return document.documentElement.dataset.sidebarCollapsed === "true"; }
export function getServerSidebarCollapsed() { return false; }
export function subscribeSidebar(listener: () => void) {
  const synchronize = (event: StorageEvent) => {
    if (event.key === sidebarPreferenceKey || event.key === null) {
      document.documentElement.dataset.sidebarCollapsed = String(event.newValue === "collapsed");
      listener();
    }
  };
  window.addEventListener(changed, listener);
  window.addEventListener("storage", synchronize);
  return () => { window.removeEventListener(changed, listener); window.removeEventListener("storage", synchronize); };
}
export function setSidebarCollapsed(collapsed: boolean) {
  document.documentElement.dataset.sidebarCollapsed = String(collapsed);
  try { localStorage.setItem(sidebarPreferenceKey, collapsed ? "collapsed" : "expanded"); } catch { /* Preference still works for this page session. */ }
  window.dispatchEvent(new Event(changed));
}
