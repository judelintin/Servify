import {AppAvailability} from '@/components/app-availability';
import Image from "next/image";
import Link from "next/link";
import type {Metadata} from "next";
import {PublicShell} from "@/components/shells/public-shell";
import {ButtonLink} from "@/components/ui/primitives";
import {customerCategories} from "@/features/customer/config";
import {WorkflowDemo} from "@/features/marketing/workflow-demo";

export const metadata:Metadata={title:{absolute:"Servify — Find the right person. Get it done."},description:"An Ibadan-first approach to local services. Discover the Servify mobile app: clear job requests, considered offers and local services, starting with Ibadan.",openGraph:{type:"website",title:"Servify — Find the right person. Get it done.",description:"Local skills. Clearer choices. A considered way to get everyday jobs done, starting with Ibadan.",locale:"en_NG"}};
const benefits=[{n:"01",title:"Start with a clearer brief.",copy:"Explain the problem once. Add photos, a general area, timing and a budget preference."},{n:"02",title:"Compare more than a price.",copy:"Look at the scope, availability and conditions behind each offer before making a choice."},{n:"03",title:"See the person behind the work.",copy:"Explore professional introductions, work samples and reviews linked to eligible completed jobs."},{n:"04",title:"Keep the details together.",copy:"Agree a time, coordinate in a job-specific conversation and follow progress in one workspace."}];
const faqs=[["How does Servify work?","Use the mobile application to describe a job, compare offers and choose a professional. After acceptance, agree a schedule, coordinate the work and confirm completion."],["How do I find a service professional?","Choose a service and prepare a clear request in the mobile app. Eligible professionals can discover posted requests and submit offers. Availability and launch coverage are still being validated."],["Can I compare offers before choosing?","The mobile app brings together proposed scope, price, availability and conditions so you can make a considered choice. Servify does not provide payments or escrow."],["How do service professionals join?","Professionals will register through the mobile application and prepare a profile. Access is currently limited to invited testers; public registration is not available on this website."],["Can I communicate with a professional?","The mobile app provides a private job-specific conversation for the customer and selected professional. This website does not host customer or professional accounts or messages."],["How do reviews and verification work?","Eligible customers may review jobs after confirming completion in the mobile app. Reviews are feedback, not identity verification. Profile completeness does not imply a Verified identity."],["Is Servify available across Ibadan now?","Servify is starting with Ibadan through controlled mobile testing. Public availability, launch coverage and operating policies are still being confirmed."]];
export default function HomePage() {
  return <PublicShell><div className="home-marketing">
    <section className="home-hero home-wrap" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="home-eyebrow"><span/>LOCAL SKILLS. EVERYDAY POSSIBILITIES.</p>
        <h1 id="home-title"><span className="hero-first-line">Find the right person.</span>{" "}<span className="hero-last-line">Get it done.</span></h1>
        <div className="home-hero-summary">
          <p className="home-lead">Everyday jobs. Local know-how. Explain what you need, compare offers, and choose who works best for you.</p>
          <div className="home-actions"><ButtonLink href="/#app" icon="arrow">Explore the mobile app</ButtonLink><a href="#services" className="home-text-link">Explore Services <span aria-hidden="true">↙</span></a></div>
          <p className="home-preview-line">Starting with Ibadan. <a href="#preview">Discover the mobile app.</a></p>
        </div>
      </div>
      <div className="home-photo-strip">
        <figure className="home-hero-visual"><Image src="/images/marketing/electrician.jpg" alt="An electrician in a yellow hard hat carefully working on a wall-mounted electrical panel" fill sizes="(max-width: 767px) 92vw, 68vw" preload className="home-photo"/><figcaption><span>THE PEOPLE BEHIND THE EVERYDAY</span>Skill makes the difference.</figcaption></figure>
        <div className="home-hero-side"><figure><Image src="/images/marketing/cleaning.jpg" alt="A woman carefully wiping a wooden table with a cloth" fill sizes="(max-width: 767px) 35vw, 24vw" className="home-photo"/></figure><div className="home-photo-label"><span aria-hidden="true">↗</span><p>Local skills.<br/>New possibilities.</p></div></div>
      </div>
      <div className="home-image-caption"><span>Editorial photographs · not listed Servify providers</span><span>IBADAN FIRST / BUILT AROUND PEOPLE</span></div>
    </section>
    <section id="services" className="home-section home-wrap" aria-labelledby="services-title">
      <div className="home-section-head"><div><p className="home-eyebrow">01 / FIND YOUR STARTING POINT</p><h2 id="services-title">Big plans.<br/>Little fixes.<br/><span>There’s a skill for that.</span></h2></div><p>From a stubborn socket to a space that needs a fresh start. Choose a service and tell us the rest.</p></div>
      <div className="home-category-grid">{customerCategories.toSorted((a,b)=>Number(a.slug==="cleaning")-Number(b.slug==="cleaning")).map((category,i)=><Link className={`home-category category-${category.slug}`} href="/#app" key={category.slug}>
        {category.slug==="cleaning"&&<Image src="/images/marketing/cleaning.jpg" alt="" fill sizes="(max-width: 767px) 92vw, 48vw" className="category-photo"/>}
        <div className="home-category-top"><span className="category-icon"><Image src={`/icons/services/${category.slug}.svg`} alt="" width={40} height={40}/></span><span className="category-arrow" aria-hidden="true">↗</span></div>
        <div className="home-category-copy"><span className="home-category-index">0{i+1} / SERVICES</span><h3>{category.label}</h3><p>{category.description}</p></div>
      </Link>)}</div><p className="home-small">Preview categories. Launch services and coverage are still being confirmed.</p>
    </section>
    <section id="how-it-works" className="home-how home-section"><div className="home-wrap">
      <div className="home-section-head"><div><p className="home-eyebrow">02 / FROM TO-DO TO DONE</p><h2>A little clarity.<br/><span>A better way forward.</span></h2></div><p>Your request starts the conversation. You stay in control of who takes it from here.</p></div><WorkflowDemo/>
    </div></section>
    <section className="home-section home-wrap home-benefits" aria-labelledby="why-title">
      <div className="home-benefit-intro"><p className="home-eyebrow">03 / WHY SERVIFY</p><h2 id="why-title">Less chasing.<br/><span>More clarity.</span></h2><p className="home-lead">The right details, in the right place. From the first request to the final check-in.</p><ButtonLink href="/about" variant="secondary" icon="arrow">About Servify</ButtonLink>
        <div className="home-brief-preview"><div><span className="home-eyebrow">ILLUSTRATIVE REQUEST</span><span aria-hidden="true">↗</span></div><h3>A clearer brief.<br/>A useful starting point.</h3><dl><div><dt>Service</dt><dd>Plumbing</dd></div><div><dt>Area</dt><dd>Bodija, Ibadan</dd></div><div><dt>Budget</dt><dd>I need quotes</dd></div></dl><p>Explain the work. Share useful photos.<br/>Keep your exact address private.</p></div>
      </div>
      <div className="home-benefit-list">{benefits.map(b=><article key={b.n}><span>{b.n}</span><div><h3>{b.title}</h3><p>{b.copy}</p></div></article>)}</div>
    </section>
    <section className="home-trust home-wrap" id="preview" aria-labelledby="trust-title"><div className="home-trust-heading"><p className="home-eyebrow">CONFIDENCE THROUGH CONTEXT</p><h2 id="trust-title">Look closer.<br/>Choose with<br/><span>more context.</span></h2></div><div className="home-trust-copy"><div className="home-trust-topics"><span>01 / Transparent offers</span><span>02 / Professional profiles</span><span>03 / Job-linked reviews</span><span>04 / Job-specific communication</span></div><p>Know the scope. See the work. Keep the conversation together.</p><p className="home-small">Marketplace activity belongs in the mobile app. Profile completeness and reviews are not identity verification; no Verified status is implied.</p><Link href="/#app" className="home-text-link">Explore the mobile app <span aria-hidden="true">↗</span></Link></div></section>
    <section id="professionals" className="home-pro-section home-section"><div className="home-wrap home-pro-grid">
      <figure><Image src="/images/marketing/craftsperson.jpg" alt="A craftsperson concentrating on careful handwork inside a workshop" fill sizes="(max-width: 767px) 92vw, 48vw" className="home-photo"/><figcaption>THE WORK SPEAKS.<br/>GIVE IT A PLACE TO BE SEEN.</figcaption></figure>
      <div className="home-pro-copy"><p className="home-eyebrow">SERVIFY FOR PROS</p><h2>Good work<br/>deserves to<br/><span>be found.</span></h2><p>Your skills deserve a proper introduction. Build a profile, show what you do, and put forward an offer that explains your work.</p><ul><li>A profile built around your skills</li><li>Work samples that tell your story</li><li>Relevant requests, selected jobs & conversations</li></ul><ButtonLink href="/#app" variant="accent" icon="arrow">Explore the mobile app</ButtonLink><p className="home-small">Professional accounts and profiles are managed in the mobile app. Public downloads are not available yet. Editorial photograph.</p></div>
    </div></section>
    <section className="home-section home-wrap home-faq" id="questions" aria-labelledby="faq-title"><div><p className="home-eyebrow">A LITTLE MORE CLARITY</p><h2 id="faq-title">Good questions.<br/><span>Straight answers.</span></h2></div><div>{faqs.map(([question,answer],i)=><details key={question}><summary><span className="faq-number" aria-hidden="true">0{i+1}</span>{question}<span className="faq-toggle" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <section className="home-closing"><div className="home-wrap home-closing-content"><p className="home-eyebrow">LET’S MAKE A START</p><h2>Your next project<br/>starts with the<br/><span>right person.</span></h2><div className="home-closing-bottom"><div className="home-actions"><ButtonLink href="/#app" icon="arrow">Explore the mobile app</ButtonLink><ButtonLink href="/#app" variant="secondary">About the app</ButtonLink></div><span className="home-closing-mark" aria-hidden="true">↗</span></div></div></section>
    <AppAvailability/>
  </div></PublicShell>;
}
