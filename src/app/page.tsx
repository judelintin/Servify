import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {PublicShell} from '@/components/shells/public-shell';
import {ButtonLink} from '@/components/ui/primitives';
import {Icon, type IconName} from '@/components/ui/icon';
import {AppAvailability} from '@/components/app-availability';
import {PhonePreview} from '@/features/marketing/phone-preview';
import {AppShowcase} from '@/features/marketing/app-showcase';
import {MotionStrip} from '@/features/marketing/motion-strip';
import {ProfessionalShowcase} from '@/features/marketing/professional-showcase';
import {customerCategories} from '@/features/customer/config';

export const metadata: Metadata = {title: {absolute: 'Servify — Find the right person. Get it done.'}, description: 'Local skills. Clearer choices. Meet Servify, the Ibadan-first mobile app for customers and service professionals.'};
const benefits: {icon: IconName; title: string; copy: string}[] = [
  {icon: 'jobs', title: 'Start with a clear brief.', copy: 'The work, the area, the timing. Bring the useful details together before the conversation starts.'},
  {icon: 'offers', title: 'See beyond the price.', copy: 'Compare scope, availability and conditions. Choose the offer that fits what you need.'},
  {icon: 'messages', title: 'Keep it all together.', copy: 'One job-specific conversation for plans, progress and the details that matter.'},
];
const steps = [
  ['Describe the job', 'Choose a service, explain what you need and add helpful photos.'],
  ['Compare your options', 'Relevant professionals submit offers. Review the scope and choose who fits.'],
  ['Make a plan', 'After professional acceptance, agree a schedule and keep the conversation together.'],
  ['Finish with feedback', 'Confirm the completed work, then share an honest job-linked review.'],
];
const faqs = [
  ['Can I download Servify now?', 'Servify is in controlled mobile testing. Public App Store and Google Play links will appear here once distribution is ready. There is no public registration or website marketplace.'],
  ['Where is Servify starting?', 'Ibadan comes first. Launch areas, service categories and availability are still being validated; city-wide coverage is not promised.'],
  ['How do professionals get involved?', 'Invited professionals use the mobile app to prepare a profile, add work samples and submit offers for eligible requests. Public access will follow when ready.'],
  ['What do reviews and verification mean?', 'Shared reviews relate to eligible customer-confirmed completed jobs. Profile completeness and customer feedback do not imply identity verification or a guarantee of work.'],
  ['Does Servify handle payments?', 'Payments, escrow and internal wallets are not part of the current product. An offer or selection does not mean Servify has collected or protected a payment.'],
];
export default function HomePage() {
  return <PublicShell><div className="app-site">
    <section className="site-wrap site-hero centered-hero" aria-labelledby="home-title"><div className="site-hero-copy"><p className="launch-pill"><span/>IBADAN FIRST. BUILT AROUND PEOPLE.</p><h1 id="home-title"><span>Find the right person.</span><em>Get it done.</em></h1><p className="site-lead">Everyday jobs. Local know-how. A clearer way to find help and put your skills to work.</p><div className="site-actions"><ButtonLink href="/#app">Meet the Servify app</ButtonLink></div><p className="site-note hero-note">For Customers &amp; Professionals · Controlled mobile testing</p></div></section>
    <MotionStrip/>
    <section className="site-wrap site-section" aria-labelledby="clarity-title"><div className="section-intro centered"><p className="site-kicker">FROM “WHO CAN HELP?” TO A CLEAR NEXT STEP</p><h2 id="clarity-title">A little less back-and-forth.<br/><em>A lot more clarity.</em></h2><p>Good work starts when the right people have the right details.</p></div><div className="benefit-grid">{benefits.map((benefit, i) => <article className="benefit-card" key={benefit.title}><span className="feature-icon"><Icon name={benefit.icon} size={24}/></span><span className="feature-number">0{i+1}</span><h3>{benefit.title}</h3><p>{benefit.copy}</p></article>)}</div></section>
    <AppShowcase/>
    <section className="site-wrap site-section request-feature" aria-labelledby="request-title"><div className="request-visual"><PhonePreview screen="request"/><span className="request-tag"><Icon name="check" size={18}/>One useful step at a time.</span></div><div><p className="site-kicker">A BETTER START FOR EVERY REQUEST</p><h2 id="request-title">The details make<br/><em>the difference.</em></h2><p className="site-lead">No perfect brief required. A guided journey helps you explain what needs doing, from the first photo to your preferred timing.</p><ul className="site-checks"><li><span aria-hidden="true">✓</span>Choose a service and a general area</li><li><span aria-hidden="true">✓</span>Add photos, timing and a budget preference</li><li><span aria-hidden="true">✓</span>Review the request before sharing</li></ul><ButtonLink href="#how-it-works" variant="secondary">Explore How Servify Works</ButtonLink><p className="site-note">Actual category-selection screen. Unsigned starter requests stay on your device; publishing a shared job requires an invited account.</p></div></section>
    <section id="how-it-works" className="journey-section"><div className="site-wrap site-section"><div className="section-intro"><p className="site-kicker">FROM TO-DO TO DONE</p><h2>One clear journey.<br/><em>Room for your choice.</em></h2></div><ol className="journey-grid">{steps.map(([title, copy], i) => <li key={title}><span className="journey-index">0{i+1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol><p className="journey-note">Marketplace activity takes place in the mobile app. No bookings or payments happen on this website.</p></div></section>
    <section id="services" className="site-wrap site-section" aria-labelledby="services-title"><div className="section-intro split-intro"><div><p className="site-kicker">EVERYDAY NEEDS. LOCAL KNOW-HOW.</p><h2 id="services-title">There’s a skill<br/><em>for that.</em></h2></div><p>From a stubborn socket to a space that needs a fresh start. Explore the services we’re building around.</p></div><div className="service-grid">{customerCategories.map(category => <Link href="/#app" className={`marketing-service-tile${category.slug === 'plumbing' ? ' plumbing-visual' : ''}`} key={category.slug}>{category.slug === 'plumbing' && <Image className="plumbing-photo" src="/images/marketing/portraits/plumbing-original.jpg" alt="" fill sizes="(max-width: 767px) 45vw, 32vw"/>}<Image src={`/icons/services/${category.slug}.svg`} width={42} height={42} alt=""/><h3>{category.label}</h3><p>{category.description}</p></Link>)}</div><p className="site-note">Proposed categories. Launch selection and service coverage are still being validated.</p></section>
    <ProfessionalShowcase/>
    <section id="professionals" className="site-wrap professional-feature"><figure><Image src="/images/marketing/craftsperson.jpg" alt="A craftsperson working carefully with wood inside a workshop" fill sizes="(max-width: 767px) 90vw, 45vw"/><figcaption>THE WORK SPEAKS. GIVE IT A PLACE TO BE SEEN.<br/>Editorial photograph · not a listed Servify professional</figcaption></figure><div><p className="site-kicker">SERVIFY FOR PROFESSIONALS</p><h2>Good work<br/>deserves to<br/><em>be found.</em></h2><p>Your skills deserve a proper introduction. Show what you do, discover relevant requests and put forward offers that explain your work.</p><ButtonLink href="#app-preview" variant="secondary">Explore the professional experience</ButtonLink></div></section>
    <section className="site-wrap site-section trust-section" aria-labelledby="trust-title"><div className="section-intro"><p className="site-kicker">CONFIDENCE THROUGH CONTEXT</p><h2 id="trust-title">Choose with<br/><em>your eyes open.</em></h2></div><div className="trust-grid"><article><Icon name="user"/><h3>People, with context.</h3><p>Professional introductions and work samples help you understand the person behind an offer.</p></article><article><Icon name="messages"/><h3>Details stay together.</h3><p>Private, job-specific conversations keep plans and decisions connected to the work.</p></article><article><Icon name="shield"/><h3>Honest feedback.</h3><p>Eligible completed-job reviews build a record over time. No fabricated ratings or identity-verification claims.</p></article></div></section>
    <section id="questions" className="site-wrap site-section site-faq" aria-labelledby="faq-title"><div><p className="site-kicker">A LITTLE MORE CLARITY</p><h2 id="faq-title">Good questions.<br/><em>Straight answers.</em></h2><ButtonLink href="/contact" variant="secondary">Contact information</ButtonLink></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <AppAvailability/>
  </div></PublicShell>;
}
