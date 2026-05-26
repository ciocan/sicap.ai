---
name: SICAP.ai
description: A search engine for Romanian public procurement, where the record is the interface.
colors:
  civic-blue: "#2563eb"
  civic-blue-contrast: "#f8fafc"
  ink: "#020817"
  paper: "#ffffff"
  slate-subtle: "#f1f5f9"
  slate-strong: "#0f172a"
  muted-ink: "#64748b"
  hairline: "#e2e8f0"
  danger: "#ef4444"
  type-direct: "#3b82f6"
  type-offline: "#f59e0b"
  type-public: "#10b981"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
  data:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.civic-blue}"
    textColor: "{colors.civic-blue-contrast}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
    typography: "{typography.label}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  badge-secondary:
    backgroundColor: "{colors.slate-subtle}"
    textColor: "{colors.slate-strong}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
    typography: "{typography.label}"
  badge-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
---

# Design System: SICAP.ai

## 1. Overview

**Creative North Star: "The Public Record"**

SICAP.ai is a clean public ledger of where Romanian public money goes. The interface earns trust the way a good record does: by being accurate, legible, and free of anything that distracts from the facts. The data is the design. A contract code, a sum in lei, a contracting authority, a date: these are the protagonists, and the chrome around them stays quiet so they read first.

The system is built on a restrained Civic Blue and Slate base (the shadcn Blue preset, with a slightly softer 12px corner radius) over a near-white paper in light mode and a deep slate-navy in dark mode. Color is rationed: a single accent for action, plus a disciplined three-hue code that tells procurement types apart at a glance. Surfaces are flat at rest and lift only when you reach for them. Typography splits cleanly in two, a modern grotesque for language and its monospace twin for every number.

It explicitly rejects the things that make the official source painful and the things that make modern tools forgettable: the bureaucratic clutter of e-licitatie.ro, the gradient-and-emoji theatrics of SaaS marketing, consumer-app playfulness, and the interchangeable purple-gradient AI-dashboard look. Nothing here should feel decorated. Everything should feel decided.

**Key Characteristics:**
- Data-forward: numbers, codes, and dates are set in monospace and treated as first-class content.
- Rationed color: one Civic Blue accent, plus a fixed blue/amber/emerald code for the three procurement types.
- Flat by default: subtle rest shadows, a gentle lift on hover, depth carried mostly by tonal slate tints.
- Search-first: the query field is the hero on the home surface and never buried elsewhere.
- Bilingual discipline: Romanian UI copy with diacritics intact, English code.

## 2. Colors

A restrained institutional palette: one working blue, slate neutrals, and a small semantic code reserved for meaning. Values are defined as HSL custom properties in `packages/ui/src/styles/styles.css`; hex equivalents are given here and in the frontmatter for tooling.

### Primary
- **Civic Blue** (`#2563eb`, `hsl(221.2 83.2% 53.3%)`; dark mode lightens to `hsl(217.2 91.2% 65.8%)`): The single accent. It marks links, primary buttons, focus rings, the SICAP.ai wordmark, and any hovered entity name. Institutional and trustworthy without tipping into bureaucratic navy. It is also the focus ring (`--ring`), so action and focus share one voice.

### Secondary (Type-Coding)
Not a decorative palette, a semantic one. Each procurement index owns one hue, used on the result row's accent, its type pill, and its date numerals.
- **Direct Blue** (`#3b82f6`, Tailwind blue-500): `achiziții directe` (direct acquisitions).
- **Offline Amber** (`#f59e0b`, Tailwind amber-500): `achiziții offline` (offline acquisitions).
- **Public Emerald** (`#10b981`, Tailwind emerald-500): `licitații publice` (public tenders).

### Neutral
- **Ink** (`#020817`, `hsl(222.2 84% 4.9%)`): Primary text on paper. A near-black tinted toward navy, never pure black.
- **Paper** (`#ffffff` light / `#020817` dark): Page and card background. Card and page share one surface; separation comes from a hairline border, not a fill change.
- **Slate Strong** (`#0f172a`, `hsl(222.2 47.4% 11.2%)`): Text on tinted (secondary/accent) surfaces.
- **Muted Ink** (`#64748b`, `hsl(215.4 16.3% 46.9%)`): Secondary text, labels, placeholder copy, inline metadata.
- **Slate Subtle** (`#f1f5f9`, `hsl(210 40% 96.1%)`; dark `hsl(217.2 32.6% 17.5%)`): The secondary / muted / accent fill. Hover washes (`slate-50/80`, `slate-100/80`) and dividers come from this family.
- **Hairline** (`#e2e8f0`, `hsl(214.3 31.8% 91.4%)`): Borders and input strokes. The same value drives `--border` and `--input`.

### Danger
- **Danger Red** (`#ef4444`, `hsl(0 84.2% 60.2%)`; dark deepens to `hsl(0 62.8% 30.6%)`): Destructive actions and adverse contract statuses (for example a canceled or contested state on a result).

### Named Rules
**The Civic Blue Rule.** There is exactly one accent. Civic Blue appears on roughly a tenth of any screen: actions, links, focus, brand. Its scarcity is what makes a blue word obviously clickable. Do not introduce a second decorative accent.

**The Type-Coding Rule.** Blue means direct, amber means offline, emerald means public. Always, and only. These three hues are spoken for; never reuse them for decoration, charts, or emphasis unrelated to procurement type, or the code stops meaning anything.

## 3. Typography

**Display / Body Font:** Geist Sans (with `ui-sans-serif, system-ui, sans-serif`)
**Data / Mono Font:** Geist Mono (with `ui-monospace, SFMono-Regular, monospace`)

**Character:** One family does all the talking. Geist is a clean, neutral modern grotesque that stays out of the way; its monospace twin handles every figure, so numbers align in columns and read as data, not prose. The pairing is deliberately narrow: no serif, no third voice.

### Hierarchy
- **Display** (700, `text-5xl`–`text-6xl`, 48–60px, line-height 1): The home wordmark only ("**SICAP**.ai", bold brand + regular `.ai` suffix), set in Civic Blue and centered.
- **Headline** (600, `text-2xl`, 24px, tight tracking): Section and card titles in detail views.
- **Title** (500, `text-base`, 16px, snug leading): The result-row contract title; truncated to two lines, turns Civic Blue on hover.
- **Body** (400, `text-sm`, 14px, line-height 1.5): Default running text and inline metadata. Cap measure at 65–75ch in prose contexts.
- **Label** (500, `text-xs`, 12px, slight tracking, occasionally uppercase): Type pills, the result-row month, field captions like `Localitate:` / `Judet:`.
- **Data** (Geist Mono, 600, 14px): Contract codes, monetary values (RON / EUR), CUI numbers, and dates. The home-page stat counts are mono-bold.

### Named Rules
**The Mono-for-Data Rule.** Every figure that is data, a contract code, a sum, a CUI, a date, is set in Geist Mono. Prose is never monospace; data is never proportional. This single split is the most recognizable thing about the type system. Honor it everywhere new numbers appear.

## 4. Elevation

The system is flat by default. At rest, cards carry only `shadow-sm`, a hairline of depth, and lean on the `hairline` border plus tonal slate fills to separate from the page. Lift is a response to intent: hovering a result row raises it to `shadow-md` and washes the surface with a faint slate tint. Depth is feedback, not decoration.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`, Tailwind `shadow-sm`): The default for cards and the result row.
- **Hover lift** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`, Tailwind `shadow-md`): Applied on hover of an interactive card, paired with a `slate-50/80` (dark `slate-800/80`) background wash and a 200ms ease-out transition.

### Named Rules
**The Flat-By-Default Rule.** Surfaces sit flat. A shadow heavier than `shadow-sm` may only appear as a response to state (hover, focus, an open popover or dialog). A card that floats at rest is wrong here.

## 5. Components

The component layer is shadcn/ui (Radix primitives) under `packages/ui`, tuned to a refined, restrained feel: quiet surfaces, generous padding, color reserved for meaning.

### Buttons
- **Shape:** `rounded-md` (10px). Height 40px default (`h-10`), 36px small, 44px large.
- **Primary:** Civic Blue fill, `civic-blue-contrast` text, `text-sm` medium, `px-4 py-2`. Hover drops to `bg-primary/90`. This is the "Caută" search action.
- **Outline / Ghost:** Transparent or paper background, `hairline` border (outline only), hover fills with `slate-subtle` (`accent`) and shifts text to its foreground. Used for the advanced-search filter icon button (`size="icon"`, 40x40).
- **Link:** Civic Blue text, underline on hover, no fill. Used for the "cautare avansata" affordance under the search bar.
- **Focus:** `focus-visible:ring-2 ring-ring ring-offset-2`. The ring is Civic Blue. Never remove it.

### Chips (Badge)
The workhorse of the data UI. Pills, never rectangles.
- **Style:** `rounded-full`, `px-2.5 py-0.5`, `text-xs font-semibold`.
- **Variants:** `secondary` (slate-subtle fill, used for monetary values and status), `outline` (text-only with hairline border, used for CPV codes and procedure types), `default` (Civic Blue, sparingly), `destructive` (Danger Red, for adverse statuses).
- **Type pill:** A dedicated tinted pill carries the procurement type using the Type-Coding hue at its 100/800 light tints (for example `bg-blue-100 text-blue-800`, dark `bg-blue-900 text-blue-200`).

### Inputs / Fields
- **Style:** `h-10`, `rounded-md`, `hairline` border, paper background, `px-3 py-2`. Placeholder in Muted Ink.
- **Focus:** `focus-visible:ring-2 ring-ring ring-offset-2` (Civic Blue ring), border unchanged. No glow, no color flood.
- **Search input:** `type="search"`, autofocus on the home surface, full width inside a `max-w-lg` (512px) centered column, placeholder "cauta achizitii publice...".

### Cards / Containers
- **Corner Style:** `rounded-lg` (12px).
- **Background:** Paper (shares the page surface); separation via the `hairline` border.
- **Shadow Strategy:** `shadow-sm` at rest (see Elevation).
- **Internal Padding:** `p-6` (24px) header and content, content trimmed `pt-0`.

### Navigation
- A top bar carries the SICAP.ai wordmark and search; a light/dark toggle (next-themes, class-based) is always available. The footer carries the institutional tagline "Sistem Inteligent de Căutare Achiziții Publice." Navigation stays text-led and quiet; the wordmark is the only place the brand asserts itself at scale.

### Signature Component: The Search Bar
The product's center of gravity. On the home surface it sits directly under the wordmark and stat line, centered, capped at `max-w-lg`: a full-width search input beside a primary "Caută" button, with a quiet "cautare avansata" link below opening the advanced dialog. Elsewhere it collapses to the input plus an outline filter-icon button. The query is always one tab away.

### Signature Component: The Result Row (`ListItem`)
The atom of every search and listing. A horizontal card holding, in order: a type pill (Type-Coding hue) and any EU-funds note; the contract title as a mono **code** plus proportional **name**, truncated to two lines, turning Civic Blue on hover; a row of badges for value (mono RON/EUR) and CPV code; linked contracting authority and supplier blocks with `Building` / `Briefcase` icons and locality metadata; status badges; and a right-hand date block with the day in large mono, the month uppercase, and the year, all in the Type-Coding hue. It currently also draws a 3px colored left edge for the type; see Do's and Don'ts.

## 6. Do's and Don'ts

### Do:
- **Do** keep Civic Blue (`#2563eb`) to roughly 10% of a screen: actions, links, focus, brand. Let a blue word always mean "clickable."
- **Do** set every figure (code, sum, CUI, date) in Geist Mono, and keep prose in Geist Sans. The split is the brand.
- **Do** signal procurement type with the fixed code: blue = direct, amber = offline, emerald = public. Reuse it consistently across rows, pills, and dates.
- **Do** keep surfaces flat at rest (`shadow-sm`) and reserve `shadow-md` for hover and open overlays.
- **Do** preserve Romanian diacritics (ă, â, î, ș, ț) in all copy, and keep contrast and focus rings at WCAG 2.1 AA in both themes.
- **Do** lead with the search field. It is the hero; never make a user hunt for it.

### Don't:
- **Don't** use a colored left-border stripe thicker than 1px as a type marker. The current `ListItem` uses `border-l-[3px]` in blue/amber/emerald; new surfaces should carry type through the tinted pill and colored date numerals instead, not a side stripe.
- **Don't** reproduce government-portal bloat: the cluttered, slow, bureaucratic, deep-nested feel of e-licitatie.ro. Being its opposite is the whole point.
- **Don't** drift into hypey SaaS marketing: gradient blobs, gradient text, hero-metric templates, or emoji enthusiasm. (Use `background-clip: text` gradients never; emphasis comes from weight and size.)
- **Don't** go consumer-playful: no mascots, jokey microcopy, or gamified flourishes. Public money is a serious subject.
- **Don't** settle into generic AI-dashboard sameness: identical card grids, purple gradients, decorative glassmorphism, or the template-y "modern" look that signals nothing was decided.
- **Don't** introduce a second accent hue for decoration, or spend the type-coding blue/amber/emerald on anything unrelated to procurement type.
- **Don't** use em dashes in UI copy (the result-row title separator included); prefer a spaced middot, comma, or colon.
