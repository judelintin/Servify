import type { IconName } from "@/components/ui/icon";
export type WorkspaceRole = "customer" | "provider" | "admin";
export interface NavItem { href: string; label: string; icon: IconName; match?: string[] }
export const workspaceNavigation: Record<WorkspaceRole, { label: string; eyebrow: string; items: NavItem[] }> = {
  customer: { label: "Customer workspace", eyebrow: "Your workspace", items: [
    { href: "/customer/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/customer/jobs", label: "My jobs", icon: "jobs", match: ["/jobs/"] },
    { href: "/jobs/new", label: "Post a job", icon: "plus" },
    { href: "/offers", label: "Offers", icon: "offers" },
    { href: "/conversations", label: "Messages", icon: "messages" },
    { href: "/customer/profile", label: "Profile", icon: "user" },
  ] },
  provider: { label: "Provider workspace", eyebrow: "Servify for Pros", items: [
    { href: "/provider/dashboard", label: "Overview", icon: "grid" },
    { href: "/provider/jobs", label: "Available jobs", icon: "jobs" },
    { href: "/provider/offers", label: "My offers", icon: "offers" },
    { href: "/provider/active-jobs", label: "Active jobs", icon: "clock" },
    { href: "/provider/messages", label: "Messages", icon: "messages" },
    { href: "/provider/profile", label: "Profile", icon: "user", match: ["/provider/onboarding"] },
    { href: "/provider/verification", label: "Verification", icon: "shield" },
  ] },
  admin: { label: "Admin workspace", eyebrow: "Operations", items: [
    { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/admin/providers", label: "Providers", icon: "users" },
    { href: "/admin/verification", label: "Verification", icon: "shield" },
    { href: "/admin/customers", label: "Customers", icon: "user" },
    { href: "/admin/jobs", label: "Jobs & offers", icon: "jobs" },
    { href: "/admin/reports", label: "Reports & disputes", icon: "flag" },
    { href: "/admin/categories", label: "Categories", icon: "categories" },
  ] },
};

export function activeNavItem(items: NavItem[], pathname: string): NavItem | undefined {
  return items.find((item) => item.href === pathname)
    ?? items.find((item) => pathname.startsWith(`${item.href}/`) || item.match?.some((prefix) => pathname.startsWith(prefix)));
}
