'use client';
import {useEffect, useRef, useState} from 'react';

const phrases = ['Find local help', 'Offer your skills', 'Compare offers', 'Connect with customers', 'Build your reputation', 'Starting in Ibadan', 'Get things done'];
export function MotionStrip() {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {setVisible(entries.some(entry => entry.isIntersecting));});
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={root} className={`motion-strip single-motion-strip${visible ? ' is-in-view' : ''}${paused ? ' is-paused' : ''}`} aria-labelledby="motion-strip-title" onPointerUp={event => {if (event.pointerType === 'touch') setPaused(value => !value);}}>
    <h2 id="motion-strip-title" className="sr-only">One app. Two ways to make a start.</h2>
    <button type="button" className="strip-control keyboard-motion-control" aria-pressed={paused} onPointerUp={event => event.stopPropagation()} onClick={() => setPaused(value => !value)}>{paused ? 'Resume animation' : 'Pause animation'}</button>
    <div className="strip-lane"><div className="strip-track">{[0, 1].map(copy => <ul className="strip-group" key={copy} aria-label={copy === 0 ? 'Customer and Professional possibilities' : undefined} aria-hidden={copy === 1 ? true : undefined}>{phrases.map(phrase => <li className={phrase === 'Starting in Ibadan' ? 'location-chip' : undefined} key={phrase}><span aria-hidden="true"/>{phrase}</li>)}</ul>)}</div></div>
  </section>;
}
