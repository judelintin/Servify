"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const labels = ["Post a job", "Compare offers", "Choose a provider", "Get it done"];
const captions = ["A clear brief is a useful first step.", "Consider the scope behind the price.", "Make the choice that works for you.", "Keep plans and progress in one place."];
const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function WorkflowDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(true);
  const enhanced = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const [manual, setManual] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { setReduced(media.matches); if (media.matches) setPlaying(false); };
    change();
    media.addEventListener("change", change);
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !media.matches) {
        if (!interacted.current) setPlaying(true);
        observer.disconnect();
      }
    }, { threshold: .25 });
    if (root.current) observer.observe(root.current);
    return () => { media.removeEventListener("change", change); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setTimeout(() => {
      if (step === 3) setPlaying(false); else setStep(s => s + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [step, playing, reduced]);

  function select(n: number) {
    interacted.current = true;
    setPlaying(false); setStep(n); setManual(true);
  }

  return <div ref={root} className={`home-demo ${reduced ? "is-reduced" : ""} ${enhanced ? "is-enhanced" : ""}`}>
    <div className="demo-top"><span>ILLUSTRATIVE PRODUCT WALKTHROUGH</span><button type="button" onClick={() => {
      interacted.current = true; setManual(true);
      if (playing) setPlaying(false); else { setStep(0); setPlaying(!reduced); }
    }}>{playing ? "Pause walkthrough" : reduced ? "Reset walkthrough" : "Replay walkthrough"}</button></div>
    <div className="demo-layout">
      <div className="demo-tabs" role="group" aria-label="Explore the Servify workflow">{labels.map((label, i) => <button type="button" key={label} aria-pressed={step === i} onClick={() => select(i)}><span>0{i + 1}</span><span>{label}<small>{captions[i]}</small></span><b aria-hidden="true">↗</b></button>)}</div>
      <div className="demo-stage">
        <div className="demo-chrome"><span>servify<span aria-hidden="true">·</span></span><span>YOUR REQUEST. YOUR CHOICE.</span><i aria-hidden="true">•••</i></div>
        <div className="demo-canvas">
          <article hidden={enhanced && step !== 0} className={`demo-card request ${step === 0 ? "is-active" : ""}`}>
            <div className="demo-story"><span className="demo-kicker">01 / YOUR REQUEST</span><h3>A leaking tap.<br/>A clearer request.</h3><p>A few useful details help someone understand the work before making an offer.</p><span className="demo-stamp">Start with what you know. ↗</span></div>
            <div className="demo-product demo-request-document"><div className="demo-document-top"><span aria-hidden="true">↗</span><span>ILLUSTRATIVE REQUEST</span></div><h4>Help with a leaking tap</h4><p>Plumbing · Bodija, Ibadan</p><div className="demo-note">The kitchen tap drips when closed.<br/>Please inspect the fitting and explain the repair.</div><div className="demo-request-fields"><span>Timing <strong>Flexible</strong></span><span>Budget <strong>I need quotes</strong></span></div><span className="demo-document-foot">General area only. Exact address stays private.</span></div>
          </article>
          <article hidden={enhanced && step !== 1} className={`demo-card offers ${step === 1 ? "is-active" : ""}`}>
            <div className="demo-story"><span className="demo-kicker">02 / COMPARE THE DETAILS</span><h3>More than<br/>a number.</h3><p>Read the scope, timing and conditions. The lowest price is only one part of the picture.</p><span className="demo-stamp">Different offers. Your decision. ↗</span></div>
            <div className="demo-product demo-comparison"><div className="demo-offer"><div><span>Illustrative offer A</span><strong>₦15,000</strong></div><p>Labour & inspection</p><small>Replacement parts discussed after inspection.</small></div><div className="demo-offer"><div><span>Illustrative offer B</span><strong>₦18,000</strong></div><p>Labour & replacement fitting</p><small>Includes one standard replacement fitting.</small></div><p className="demo-fine">Sample amounts only, not service prices.</p></div>
          </article>
          <article hidden={enhanced && step !== 2} className={`demo-card choice ${step === 2 ? "is-active" : ""}`}>
            <div className="demo-story"><span className="demo-kicker">03 / MAKE AN INFORMED CHOICE</span><h3>The scope that fits.<br/>The person you choose.</h3><p>Consider profiles, work samples, availability and eligible completed-job reviews.</p><span className="demo-stamp">Provider acceptance comes next. ↗</span></div>
            <div className="demo-product demo-selection"><div className="demo-selection-heading"><span className="demo-check" aria-hidden="true">✓</span><span>YOUR ILLUSTRATIVE SELECTION</span></div><h4>Clear scope.<br/>A considered choice.</h4><dl><div><dt>Example offer</dt><dd>A</dd></div><div><dt>Scope</dt><dd>Labour & inspection</dd></div></dl><p>You choose. The provider then accepts or declines before scheduling.</p><span className="demo-selection-status">Awaiting provider acceptance</span></div>
          </article>
          <article hidden={enhanced && step !== 3} className={`demo-card done ${step === 3 ? "is-active" : ""}`}>
            <div className="demo-story"><span className="demo-kicker">04 / STAY ON THE SAME PAGE</span><h3>Agreed plans.<br/>Work well done.</h3><p>Coordinate in a job-specific conversation and follow the work through to your final confirmation.</p><span className="demo-stamp">A clear next step, at every step. ↗</span></div>
            <div className="demo-product demo-timeline"><span className="demo-kicker">THE DELIVERY JOURNEY</span><ol><li><span>Provider accepts the job<small>The selected provider confirms.</small></span></li><li><span>Agree a time & coordinate<small>Keep the details in the job conversation.</small></span></li><li><span>Provider requests completion<small>Work is ready for the customer to check.</small></span></li><li><span>You confirm completion<small>Eligible job-linked feedback comes next.</small></span></li></ol></div>
          </article>
        </div>
      </div>
    </div>
    <p className="demo-caption" aria-live={manual ? "polite" : "off"}>{labels[step]} · Demonstration only. No real requests, offers or bookings are created.</p>
  </div>;
}
