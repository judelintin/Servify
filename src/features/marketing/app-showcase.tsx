'use client';
import {useRef, useState} from 'react';
import {PhonePreview} from './phone-preview';

const audiences = ['customer', 'professional'] as const;
export function AppShowcase() {
  const [audience, setAudience] = useState<(typeof audiences)[number]>('customer');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const professional = audience === 'professional';
  return <section id="app-preview" className="site-section site-wrap app-showcase" aria-labelledby="preview-title">
    <div className="showcase-copy"><p className="site-kicker">ONE APP. TWO PERSPECTIVES.</p><h2 id="preview-title">Made for the way<br/>you <em>get things done.</em></h2>
      <div className="audience-tabs" role="tablist" aria-label="Explore the app">{audiences.map((role, i) => <button key={role} ref={el => {tabs.current[i] = el;}} id={`tab-${role}`} role="tab" aria-selected={audience === role} aria-controls="app-audience-panel" tabIndex={audience === role ? 0 : -1} onClick={() => setAudience(role)} onKeyDown={event => {if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i; setAudience(next === 0 ? 'customer' : 'professional'); tabs.current[next]?.focus();}}}>{role === 'customer' ? 'For Customers' : 'For Professionals'}</button>)}</div>
      <div id="app-audience-panel" role="tabpanel" aria-labelledby={`tab-${audience}`} tabIndex={0} className="showcase-panel" key={audience}><h3>{professional ? 'Good work deserves a proper introduction.' : 'Less chasing. More clarity.'}</h3><p>{professional ? 'Bring your skills, services and work samples together. Discover relevant requests and explain what you can offer.' : 'Start with what needs doing. Add useful details, compare the scope behind each offer and choose with confidence.'}</p><ul className="site-checks">{(professional ? ['A profile built around your skills', 'Relevant requests and considered offers', 'Job-specific plans and conversations'] : ['A guided request, one step at a time', 'Offers you can review side by side', 'Plans, progress and feedback in one place']).map(text => <li key={text}><span aria-hidden="true">✓</span>{text}</li>)}</ul></div>
      <p className="site-note">Actual app interface captures. Starter drafts and profile setup shown here are device-local. Shared marketplace activity requires an invited, signed-in account.</p>
    </div><div className="showcase-visual"><span className="showcase-orbit" aria-hidden="true"/><PhonePreview screen={audience}/><span className="visual-label">THE SERVIFY APP / {professional ? 'PROFESSIONAL' : 'CUSTOMER'}</span></div>
  </section>;
}
