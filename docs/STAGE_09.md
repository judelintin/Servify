# Stage 09 — Premium homepage and marketing experience

## Scope and composition

The public homepage replaces the Stage 02 placeholder. Its sequence is public navigation, editorial hero/photo strip, six service-category tiles, illustrative workflow, four product benefits with a request preview, trust/preview explanation, professional entry, seven native FAQ disclosures, final customer/provider actions and footer. The shared public header/footer also serve the design-system and not-found pages; workspace shells and data architecture are unchanged.

Inter Tight, warm white, ink and primary blue carry the composition. Navy distinguishes the professional section; orange is restrained to the brand, locality marker and professional action. Large editorial headings, documentary photography, quiet borders and small radii establish the marketing identity without redesigning dashboards. Responsive columns deliberately reflow rather than shrinking desktop content. Photography containers reserve space to avoid image-loading shifts.

## Workflow motion and accessibility

`src/features/marketing/workflow-demo.tsx` is the small interactive explainer. All four panels render as HTML: request, offer comparison, provider choice and delivery/completion. Sample offers are explicitly illustrative; prices are not advertised service prices. There are no ratings, endorsements or verification badges. The final panel includes provider acceptance and customer completion confirmation, matching the existing lifecycle.

An IntersectionObserver starts one finite sequence when visible. Each stage lasts three seconds; CSS transforms and opacity introduce the request, stagger two offers, confirm selection and reveal delivery steps. Playback stops after the final stage. Pause, replay and manual stage buttons are keyboard accessible. A manual interaction prevents a later viewport entry from unexpectedly starting autoplay. Automatic changes do not repeatedly announce; manual changes use a polite status. Reduced-motion users receive a static selected panel and manual selection, with transitions, entrance effects and smooth scrolling disabled. There is no animation package, continuous loop, scroll-jacking or video.

The refined presentation uses vertical step navigation beside one dominant interface canvas on desktop; navigation becomes a compact two-by-two set on mobile. Each stage combines a short explanation with a detailed illustrative request, offer comparison, selection or delivery timeline. Inactive enhanced panels use the native hidden attribute so they do not clutter the accessibility tree. Server and hydration snapshots match through React's external-store hook; static HTML contains all four panels. Reserved canvas height avoids jumps between panels at each tested breakpoint.

The inherited root `loading.tsx` wraps even static public HTML in a React streaming boundary. A real no-JavaScript browser test found the completed homepage remained hidden until React's inline swap script ran. A marketing-only `scripting: none` stylesheet fallback reveals the completed public boundary and hides its loading placeholder. Its reveal rule shares Tailwind's base layer so it overrides Preflight's important hidden rule. It exposes ordinary header links on mobile and hides inert demo/menu buttons. Workspace loading behavior is unchanged. Native FAQ disclosures, four static walkthrough panels and public links work without JavaScript.

The page retains one h1 and main landmark, the existing skip link, descriptive photo alternatives, visible focus rings and Escape/focus-return behavior for the mobile menu. FAQ summary elements use native Enter/Space operation. No information depends solely on motion.

## Assets

Three local photographs from Pexels total approximately 564 KiB: electrical work by Emmanuel Ikwuegbu, cleaning by Monstera Production and workshop craftsmanship by Safari Consoler. The electrical hero image is preloaded through Next Image; supporting images load lazily with responsive sizes. There are no external runtime image dependencies. See [asset provenance](../public/images/marketing/README.md) for original URLs, sizes and license links. Existing category SVGs are reused unchanged. The redundant second workshop photograph was removed.

The hero now depicts supported electrical/cleaning work in colour. The monochrome workshop portrait appears only in the professional campaign. Photographs remain editorial; no subject is represented as a listed Servify provider or evidence of Ibadan coverage. Carpentry has not been added to the taxonomy. Commissioned Ibadan photography showing supported services, with consent/releases, is the preferred launch replacement. Customer/provider uploads are untouched.

## Premium visual refinement

The supplied [Impacta reference](https://impacta.framer.website/) was visually inspected for typographic confidence, whitespace, photography and section rhythm. Its source, brand identity, ratings and statistics were not incorporated into Servify.

- The exact hero headline is much larger and spans the composition. Supporting copy/actions sit alongside its second line on desktop and flow beneath on mobile; an asymmetrical colour photo strip replaces the conventional image-beside-copy layout. CTAs remain before the photo strip and accessible near the top of the page.
- Service discovery uses varied spans, quiet tonal surfaces, circular icon/arrow treatments and a photographic cleaning tile. All six supported categories retain the original route/prefill behavior. Cleaning is last in the homepage display order so keyboard and visual reading order agree at every breakpoint; the shared taxonomy is unchanged.
- The workflow is now a dominant product canvas, with finite staggered transitions rather than four equally weighted cards. Reduced-motion and no-JavaScript presentations remain useful.
- A labelled request preview balances the larger benefits typography. Trust uses an open editorial composition with four clear topics rather than another card grid. The navy professional campaign has a larger distinct portrait, headline and CTA.
- FAQ dividers, numbering and disclosure spacing are refined without changing answers or native interaction. A blue closing campaign integrates the arrow and paired customer/provider actions; a stronger wordmark and quieter source credits anchor the footer.
- Entrance motion is limited to the hero and finite workflow. Category and CTA feedback use transforms; no content depends on scroll reveals or ongoing motion. Normal text uses dark neutral colours; gold is paired with navy/blue and focus rings remain distinct.

## Integration and truthful product communication

Post a Job links to `/jobs/new`; the six configurable categories link to `/jobs/new?category=<existing-slug>`. Only validated category slugs initialize a new editor. Existing `draft` records always take priority over query prefill, and category entry itself does not silently save a record. Invalid categories follow the ordinary empty selection flow. The existing form, storage adapter, autosave, conflict handling and local preview publishing are reused.

Professional actions link to `/provider/onboarding`; customer/provider workspace entries use their existing dashboards. Section links target real IDs. No duplicate registration, booking or service-discovery engine was added. Footer photography credit is a real source link; there are no invented legal, contact or social destinations.

Hero context, trust copy, FAQ and footer distinguish the browser-local preview from a live marketplace. There are no fabricated metrics, customer testimonials, real verification claims, guaranteed outcomes or payment services. Homepage title, description and Open Graph fields are supplied without an invented production URL, canonical, business address or review aggregate. Existing `noindex, nofollow` remains appropriate for preview.

## Final targeted mobile hero refinement

The final adjustment is scoped to `.home-hero` at widths of 430px and below. Existing outer margins were already correct and remain 16px at 320px and 20px at 390/430px. The headline, supporting copy, CTA, image files and descriptive alternatives are unchanged. Desktop and other sections receive no new styles.

The asymmetric photography now uses a consistent 12px gutter, matching 8px corner radii, a fluid 280–320px technician image and a deliberately 24px lower starting position for the smaller image. The blue card remains 96px high and aligns with the technician photograph's bottom edge. The narrower photo split, crop position, caption spacing and card typography are balanced across the three requested sizes without clipping or overflow.

Focused browser checks passed at 320, 390 and 430px in both normal and reduced-motion modes, including reload, loaded images, symmetric outer margins, photo/card alignment, text containment, visible CTA, keyboard focus, mobile menu Enter/Escape/focus return and keyboard activation of Post a Job into the existing form. A 1440px desktop hero screenshot is pixel-identical to the pre-adjustment baseline. Focused ESLint, TypeScript and production build pass. Screenshots and the temporary verification harness remain under ignored `artifacts/stage-09/`; no application records were modified.

### Investigation of the red Next.js issue indicator

The existing development-server log recorded a hydration mismatch showing an extra `location="127.0.0.1"` attribute on `<body>`. Servify's root layout and returned server HTML do not emit this attribute, and no application source adds it. Six clean-browser load/reload checks produced no console errors, warnings or red issue badge. Injecting that exact attribute before hydration in an isolated test reproduced the same React warning and the red `1 Issue` badge.

The confirmed trigger is browser-side DOM modification outside Servify. The specific injecting extension or tool is not identified. The badge itself is Next.js development UI; the underlying warning is conditional on that external modification, rather than a confirmed application defect. No warning suppression, developer-indicator hiding or unrelated root-layout change was introduced. The development server remains running for review.

## Verification

Focused browser automation is `scripts/verify-homepage.mjs`, using the established external Playwright runtime and Chrome with no dependency installation. Tests run in isolated browser contexts; runtime fixtures and screenshots remain in ignored `artifacts/stage-09/`.

- Checked 1440, 1366, 1024, 768, 430, 390 and 320px: loaded local images, heading/main structure, FAQ keyboard operation, all four manual walkthrough states, stable canvas height, reduced motion, mobile menu/Escape/focus return, section destinations, CTA routes and no horizontal overflow. Full-page and hero screenshots at 1440, 390 and 320px, plus individual workflow states, were visually reviewed. Confirmed hero overlap and tablet/mobile panel-height variation were corrected during refinement.
- Checked all six category entries, saved-draft priority, finite playback, pause/replay, static no-JavaScript panels/FAQ and customer/provider/admin dashboard smoke routes. Checked console/page errors and external runtime requests.
- Focused customer regression at 390px covers all seven steps, field errors, keyboard, photo persistence/reload, editing, independent drafts, deletion, revision conflicts and explicit copy recovery, stale delete rejection, unavailable/failed storage and malformed/future data preservation. No review-browser records were modified.
- ESLint, TypeScript and production build pass. Production route verification preserves all 46 pages and the 404 response, including preview disclosures. The route check accepts the new accurate public preview disclosure alongside existing workspace disclosures.

## Remaining decisions and local review

No Stage 09 backend work, live authentication, payments, real verification, cloud resources or dependencies were added. Stages 01–08 remain in place. Production launch still requires confirmed coverage/categories, OTP delivery/cost decisions, verification/privacy/retention rules, cancellations/disputes, support/legal destinations and operational policy. Production SEO needs a confirmed domain/canonical, approved sharing image and an explicit decision to enable indexing. These are launch requirements, not missing homepage routes to fabricate.

Review at `http://127.0.0.1:3000/`; use the same origin to retain existing browser-local records. The development server remains running. Stage 09 is approved for this local Git checkpoint. Nothing was pushed or deployed.
