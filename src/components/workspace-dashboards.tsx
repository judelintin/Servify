import Link from "next/link";

import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui/primitives";

export function JourneyGuide({ provider = false }: { provider?: boolean }) {
  const steps = provider ? [
    ["Introduce your work", "Build a profile around your skills and service areas."],
    ["Find the right fit", "Offer on jobs that match the services you provide."],
    ["Do what you do best", "Agree the scope. Complete the work. Build your history."],
  ] : [
    ["Tell us what you need", "Describe the job and where you need a hand."],
    ["Choose your person", "Compare offers, scope and provider profiles."],
    ["Get it done", "Connect about your job and confirm the finished work."],
  ];
  return <aside className="guide-panel" aria-label="Marketplace journey"><p className="eyebrow">A better way to connect</p><h2>{provider ? "Local skills.\nReal possibilities." : "Good help,\nwithout the guesswork."}</h2><ol className="step-list">{steps.map(([title, description], index) => <li key={title}><span className="step-number" aria-hidden="true">{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol><div className="guide-bottom"><Icon name="pin" size={15}/><span>Built with Ibadan in mind.</span></div></aside>;
}
export function AdminDashboard() {
  const operations: { title: string; description: string; href: string; icon: IconName }[] = [
    { title: "Provider verification", description: "Review workspace", href: "/admin/verification", icon: "shield" },
    { title: "Reports & disputes", description: "Case management", href: "/admin/reports", icon: "flag" },
    { title: "Service categories", description: "Marketplace taxonomy", href: "/admin/categories", icon: "categories" },
  ];
  return <><PageHeading eyebrow="Marketplace operations" title="A clear view of what matters." description="The workspace for considered, accountable marketplace decisions."/><div className="admin-summary">{operations.map((item) => <Link className="card" href={item.href} key={item.href}><span className="service-icon"><Icon name={item.icon}/></span><div><strong>{item.title}</strong><p>{item.description}</p></div></Link>)}</div><Card><div className="section-card-head"><h2>Operations activity</h2><Badge>Not connected</Badge></div><EmptyState icon="grid" title="Ready for a clearer overview." description="Provider reviews, marketplace activity and case queues will appear here when secure data access is introduced."/></Card><div className="mt-6"><p className="preview-note"><Icon name="shield" size={16}/>This is a visual shell. It does not grant administrator access or contain real records.</p></div></>;
}
