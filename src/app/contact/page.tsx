import type {Metadata} from 'next';
import {PublicShell,SectionContainer} from '@/components/shells/public-shell';
import {PageHeading,Card,ButtonLink} from '@/components/ui/primitives';
export const metadata:Metadata={title:'Contact',description:'Contact information and availability for Servify.'};
export default function Contact(){return <PublicShell><SectionContainer className="system-page"><PageHeading eyebrow="CONTACT" title="Get in touch with Servify." description="Public contact details are being prepared."/><Card><h2>Contact availability</h2><p>Verified public contact channels will be published here before public release. This page is not currently collecting or sending messages.</p><p>Invited testers should use the private contact channel provided with their invitation. Do not send passwords, identity documents or sensitive job information.</p><ButtonLink href="/about" variant="secondary">About Servify</ButtonLink></Card></SectionContainer></PublicShell>;}
