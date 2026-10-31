import { PublicShell, SectionContainer } from "@/components/shells/public-shell";
import { Badge, ButtonLink, Card, EmptyState, Feedback, LoadingState, PageHeading, TextInput } from "@/components/ui/primitives";
import { ButtonExamples } from "@/components/ui/component-examples";
import { ServiceCategories } from "@/components/service-categories";
import { RoleSelection } from "@/components/auth-presentation";

export const metadata = { title: "Design system" };
const colors = [
  ["Ink", "#151A2D"], ["Primary blue", "#3155C8"], ["Navy", "#172554"], ["Orange", "#F59E0B"],
  ["Warm white", "#FFFBF5"], ["White", "#FFFFFF"], ["App background", "#F7F8FA"], ["Muted text", "#5E6578"],
] as const;

export default function Page() {
  return <PublicShell><SectionContainer className="system-page"><PageHeading eyebrow="Servify / Interface foundations" title="Simple by design. Useful by nature." description="A living reference for the shared language of Servify. Component examples use no live data." action={<ButtonLink href="/customer/dashboard" variant="secondary" icon="arrow">View application shell</ButtonLink>}/><div className="system-grid">
    <Card className="system-section"><h2>Color & surface</h2><div className="swatches">{colors.map(([name, value]) => <div className="swatch" key={name}><div className="swatch-color" style={{ background: value }}/><p><strong>{name}</strong><br/>{value}</p></div>)}</div><h3>Rhythm & shape</h3><p className="text-sm text-muted">4px spacing foundation. 8px controls, 12px compact cards, 16px feature surfaces. Quiet borders and restrained shadows.</p></Card>
    <Card className="system-section"><h2>Typography</h2><p className="eyebrow">Inter Tight / Self-hosted variable font</p><p className="mt-4 text-4xl font-semibold tracking-tight">A little help.<br/>A lot done.</p><h3>Clear at every step.</h3><p className="text-sm leading-relaxed text-muted">Readable body copy gives people room to understand the task ahead. Labels stay direct. Helpful details stay close.</p><p className="field-hint mt-4">Hierarchy: display 40–68px · page 28–36px · section 18–24px · body 16px · interface 14px · supporting 12px.</p></Card>
    <Card className="system-section"><h2>Buttons & actions</h2><ButtonExamples/></Card>
    <Card className="system-section"><h2>Inputs & validation</h2><TextInput id="demo-name" label="Example name" placeholder="A clear, visible label" hint="Component demo. Do not enter personal information."/><TextInput id="demo-error" label="Example validation state" defaultValue="Example value" error="Example error: explain how to correct the value."/><TextInput id="demo-disabled" label="Unavailable input" placeholder="Available in a later stage" disabled/></Card>
    <Card className="system-section"><h2>Feedback & status</h2><Feedback title="Information example">Explain the next step in plain language.</Feedback><Feedback title="Success example" tone="success">Confirmation belongs next to the completed action.</Feedback><Feedback title="Error example" tone="error">Offer a clear route to recovery.</Feedback><div className="component-row mt-5"><Badge>Neutral</Badge><Badge tone="blue">Information</Badge><Badge tone="orange">Attention</Badge><Badge tone="success">Success</Badge></div><LoadingState label="Loading indicator example"/></Card>
    <Card className="system-section"><h2>Role selection</h2><RoleSelection/><p className="field-hint">Native radio controls support keyboard arrows and a shared accessible group label. Administrator permissions are never self-selected.</p></Card>
    <Card className="system-section"><h2>Service icon family</h2><ServiceCategories/><p className="field-hint mt-4">Six original 24px vectors with a consistent 1.7px line. Provisional pending Figma asset comparison.</p></Card>
    <Card className="system-section"><h2>Empty state</h2><EmptyState icon="messages" title="A clear place to start." description="Give context, explain what belongs here, and offer one useful next step."/></Card>
  </div></SectionContainer></PublicShell>;
}
