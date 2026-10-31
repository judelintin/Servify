# Servify design foundations

Stage 02 update: see [STAGE_02.md](STAGE_02.md) and the `/design-system` local route
for the implemented shell and current component reference. The brand values below
remain the baseline. The current application adds white #FFFFFF, app background
#F7F8FA, 8/12/16px radii and a bundled Inter Tight variable font. The Stage 01 font
and asset-evaluation notes below are retained as the historical planning record.

Tagline: **Find the right person. Get it done.** The product should feel clear,
dependable and local, with mobile task completion ahead of decorative marketing.

| Token | Value | Intended use |
| --- | --- | --- |
| Ink | #151A2D | Primary text |
| Primary blue | #3155C8 | Links, primary actions, keyboard focus |
| Navy | #172554 | Strong headings or dark surfaces |
| Orange accent | #F59E0B | Restrained emphasis with dark text |
| Warm white | #FFFBF5 | Main background |

CSS tokens are in `src/app/globals.css`, exposed through Tailwind v4 `@theme`.
Use a 4px base spacing unit; favor 4, 8, 12, 16, 24, 32 and 48px gaps. Use 4px
and 8px radii, reserving pills for meaningful status labels rather than all cards.
Typography direction is Inter Tight with a readable body size (16px minimum),
comfortable line height and restrained weights. Stage 01 declares the family with
Arial/sans-serif fallbacks; the font file is not bundled or remotely fetched.
In Stage 02 select licensed Inter Tight WOFF2 assets and self-host with next/font/local
to avoid build-time font downloads; validate font loading, wrapping and performance.

Check WCAG AA contrast for actual foreground/background pairs: at least 4.5:1 for
normal text, 3:1 for large text and essential non-text controls. Blue on warm white
and warm white on blue are candidate action pairs; never assume every brand color
combination passes. Orange is an accent, not normal light-background text or a
white-text button. Convey states with words and icons as well as color. Preserve
visible keyboard focus, logical heading order, skip navigation, accessible labels,
adequate touch targets (aim for 44px), reduced motion and 320px viewport reflow.

## Figma reference inventory and later evaluation

[Reference file, Page 1](https://www.figma.com/design/g0oK2Z56TczYWL8jyhJwVz/servify?node-id=0-1)
was inspected read-only through Figma metadata during Stage 01. Observed:

- Node `1933:4`: a rounded rectangle named
  `screencapture-vetic-webflow-io-home-home-1-2026-09-05-12_52_38 1`, 838×4096.
  It is website screenshot/reference material, not an editable Servify component library.
- Repeated ~26px category frames include plumbing (`1933:54`), electrical
  (`1933:38`), AC (`1933:66`), generator (`1933:86`), cleaning (`1933:98`) and
  appliance (`1933:6`), with several variations of each.
- Nested names mention MDI, Material Symbols, Boxicons, Reicon and Emojione styles;
  those names alone do not establish origin, license, visual consistency or approval.
- Additional image rectangles exist; metadata alone does not establish their content
  or reuse rights. No assets were exported and no Figma changes were made.

In the UI stage, visually inspect shortlisted variants at real mobile sizes and
compare recognizability, optical weight, filled/outline consistency, alignment,
contrast and touch-target context. Check source/license/attribution before export.
Choose one coherent icon direction; normalize viewBoxes and sizes (typically
20/24px) and use accessible SVGs with text labels. Decorative icons should be
hidden from assistive technology; icon-only controls require accessible names.
Do not mix all variations or add multiple icon packages merely to reproduce them.

Use the website reference to discuss hierarchy, spacing and content density, then
design original Servify flows around the approved transaction journey. Do not copy
the screenshot, its branding, copy or layout as an approved Servify screen. Establish
responsive wireframes, tokens and reusable components deliberately in Stage 02.
There are no polished marketing screens or production component-library claims here.
