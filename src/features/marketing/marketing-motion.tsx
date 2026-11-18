'use client';
import {useEffect, useRef, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';

/** Progressive enhancement only: content is visible without JS, observer support or motion. */
export function MarketingMotion({children}: {children: ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const candidates = Array.from(element.querySelectorAll<HTMLElement>('.site-section, .about-story, .contact-layout, .availability, .professional-feature'));
    function reveal(target: Element) {target.setAttribute('data-visible', ''); observer?.unobserve(target);}
    function configure() {
      observer?.disconnect();
      element!.removeAttribute('data-motion-ready');
      if (preference.matches) {candidates.forEach(reveal); return;}
      observer = new IntersectionObserver(entries => {entries.forEach(entry => {if (entry.isIntersecting) reveal(entry.target);});}, {threshold: 0.05, rootMargin: '0px 0px -24px 0px'});
      candidates.forEach(target => {
        target.setAttribute('data-reveal', '');
        if (target.hasAttribute('data-visible') || target.getBoundingClientRect().top < innerHeight - 24) reveal(target);
        else observer!.observe(target);
      });
      element!.setAttribute('data-motion-ready', '');
    }
    const focus = (event: FocusEvent) => {if (event.target instanceof Element) {const section = event.target.closest('[data-reveal]'); if (section) reveal(section);}};
    configure();
    preference.addEventListener('change', configure);
    element.addEventListener('focusin', focus);
    return () => {observer?.disconnect(); preference.removeEventListener('change', configure); element.removeEventListener('focusin', focus); element.removeAttribute('data-motion-ready');};
  }, [pathname]);
  return <div ref={root} className="marketing-motion">{children}</div>;
}
