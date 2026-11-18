import Image from 'next/image';
import {ButtonLink} from '@/components/ui/primitives';

const portraits = [
  {className: 'craft-card', src: '/images/marketing/portraits/craftsperson-original.jpg', alt: 'Illustrative generated portrait of a craftsperson concentrating on woodwork.', profession: 'Craftsperson', copy: 'Care in every detail.'},
  {className: 'electric-card', src: '/images/marketing/portraits/electrician-original.jpg', alt: 'Illustrative generated portrait of an electrician working at an electrical panel.', profession: 'Electrician', copy: 'Skills for everyday fixes.'},
  {className: 'clean-card', src: '/images/marketing/portraits/cleaner-original.jpg', alt: 'Illustrative generated portrait of a cleaning professional wiping a table.', profession: 'Cleaner', copy: 'A fresh start for your space.'},
];
export function ProfessionalShowcase() {
  return <section id="meet-professionals" className="site-wrap site-section meet-professionals" aria-labelledby="meet-title"><div className="meet-copy"><p className="site-kicker">THE PEOPLE BEHIND EVERYDAY WORK</p><h2 id="meet-title">Meet Trusted<br/><em>Professionals</em></h2><p className="site-lead">Every skill has a story. Get to know the kinds of people whose work keeps everyday life moving.</p><p className="site-note showcase-disclosure">Illustrative AI-generated scenes, not Servify accounts or verified professionals. Trust must be earned through work, clear communication and honest feedback. Launch services are still being validated.</p><ButtonLink href="#app-preview" variant="secondary">Explore the professional experience</ButtonLink></div><div className="professional-cards" role="group" aria-label="Illustrative professional portraits">{portraits.map(portrait => <figure className={`professional-card ${portrait.className}`} key={portrait.profession}><div className="professional-portrait"><Image src={portrait.src} alt={portrait.alt} fill sizes="(max-width: 767px) 230px, 260px"/></div><figcaption><h3>{portrait.profession}</h3><p>{portrait.copy}</p></figcaption></figure>)}</div></section>;
}
