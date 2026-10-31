import { PlaceholderPage } from "@/components/placeholder-page";
import { PublicShell, SectionContainer } from "@/components/shells/public-shell";

export default function NotFound() {
  return <PublicShell><SectionContainer className="system-page"><PlaceholderPage title="Page not found" description="This address does not match a prepared Servify route." /></SectionContainer></PublicShell>;
}
