# Mali Group — Brandbook

Version 1.0 · Real estate / direct property buyer · Nationwide (US)

This document is the single source of truth for the Mali Group visual identity as implemented on maligroup.com. All values below are taken directly from the live codebase (`app/globals.css`, `lib/site-config.ts`, `components/ui/button.tsx`, `app/layout.tsx`).

---

## 1. Brand Foundation

### Who we are

Mali Group is a **direct property buyer** — not a broker, not an agent. We buy houses and land for cash, nationwide, and close on the seller's timeline.

### Positioning statement

> Mali Group buys houses and land directly from owners nationwide. Skip the agents, fees, and waiting — get a no-obligation cash offer and close on your schedule.

### Brand pillars

| Pillar | What it means | How it shows up |
| --- | --- | --- |
| **Speed** | Offers in 24 hours, closings in as little as 7 days | Numbers-forward stats, urgent CTA copy |
| **Transparency** | Zero fees, zero commissions, no obligation | Plain-language copy, explicit disclaimers |
| **Directness** | We are the buyer, no middlemen | Short sentences, no jargon, no hedging |
| **Reach** | All 50 states, any property condition | "Nationwide" language, no city/state specificity |

### Brand personality

Confident, plainspoken, and reassuring. We are the calm professional in a stressful transaction — never pushy, never salesy, never cute.

**We are:** direct, credible, efficient, warm-but-businesslike
**We are not:** flashy, aggressive, jargon-heavy, overly casual

---

## 2. Logo

### Primary mark

The **MG lettermark** — a bold dark "MG" monogram with a gold chevron forming a roofline between the two letters, underscored by a gold rule with `REAL ESTATE` in wide-tracked caps beneath.

- **Asset:** `/public/images/mg-logo.png`
- **The chevron is load-bearing.** It reads as a roof and is the only literal real-estate cue in the identity. Never remove or recolor it independently of the mark.

### Usage in product

| Placement | Height | Treatment |
| --- | --- | --- |
| Site header | `h-10` (40px) | `brightness-0 invert` → renders solid white |
| Site footer | `h-12` (48px) | `brightness-0 invert` → renders solid white |

Because both the header and footer sit on the dark navy primary, the logo is inverted to pure white via CSS filter rather than shipping a second asset.

```tsx
<Image
  src="/images/mg-logo.png"
  alt={site.businessName}
  width={72}
  height={48}
  className="h-10 w-auto object-contain brightness-0 invert"
  priority
/>
```

### Clear space & minimum size

- Maintain clear space equal to the cap-height of the `M` on all sides.
- Minimum digital height: **32px**. Below this the `REAL ESTATE` lockup becomes illegible — use the MG monogram alone.

### Logo don'ts

- Do not stretch, skew, or rotate the mark.
- Do not place the full-color mark on a mid-tone background — use the inverted white version on anything darker than `--muted`.
- Do not re-typeset "Mali Group" as a substitute for the mark.
- Do not add drop shadows, glows, or outlines.
- Do not recolor the chevron to cyan or coral.

---

## 3. Color

The palette is **five colors total**: one dark primary, one bright accent, one warm secondary accent, and a neutral ramp. Colors are authored in `oklch` — treat these as canonical and the hex column as approximate reference only.

### Core palette

| Token | oklch (canonical) | ~Hex | Role |
| --- | --- | --- | --- |
| `--primary` | `oklch(0.28 0.07 220)` | `#0B2E40` | Dark teal/navy. Hero, header, footer, banners |
| `--accent` | `oklch(0.72 0.14 195)` | `#22C1D6` | Bright cyan. Primary CTAs, links, stats, highlights |
| `--coral` | `oklch(0.65 0.18 28)` | `#E75A3F` | Coral/red. Secondary accent, step numbers, emphasis |
| `--background` | `oklch(0.98 0.005 220)` | `#F8FAFB` | Page surface |
| `--foreground` | `oklch(0.18 0.04 220)` | `#0D1E27` | Body text on light |

### Supporting neutrals

| Token | oklch | ~Hex | Role |
| --- | --- | --- | --- |
| `--card` | `oklch(1 0 0)` | `#FFFFFF` | Card surfaces |
| `--secondary` | `oklch(0.93 0.02 220)` | `#DCE7EC` | Subtle tinted surfaces |
| `--muted` | `oklch(0.95 0.01 220)` | `#EDF1F3` | Muted fills |
| `--muted-foreground` | `oklch(0.48 0.03 220)` | `#5F7280` | Secondary/label text |
| `--border` | `oklch(0.89 0.015 220)` | `#D3DEE3` | Hairlines, dividers |

### Foreground pairings

Never change a background without changing its paired foreground.

| Background | Foreground token |
| --- | --- |
| `--primary` | `--primary-foreground` `oklch(0.98 0.005 220)` |
| `--accent` | `--accent-foreground` `oklch(0.18 0.06 215)` — dark ink, not white |
| `--coral` | `--coral-foreground` `oklch(0.99 0 0)` — white |
| `--secondary` | `--secondary-foreground` `oklch(0.28 0.07 220)` |

> **Important:** cyan buttons use **dark** text (`--accent-foreground`), not white. White-on-cyan fails contrast at body sizes.

### Color proportion

Roughly **60 / 25 / 10 / 5**:

- 60% — dark navy primary and white/neutral surfaces
- 25% — neutral text and borders
- 10% — cyan accent (CTAs, links, stats)
- 5% — coral (sparingly, for sequence numbers and secondary emphasis)

### Color rules

- Cyan is the **action** color. If it is cyan, it should be clickable or a key metric.
- Coral is the **emphasis** color. It never carries a primary action.
- Never place coral directly adjacent to cyan at equal weight — they compete.
- Always theme through tokens. Never hardcode `bg-white`, `text-black`, or raw hex in components.
- Browser theme color: `#0a2540` (set in `app/layout.tsx` viewport).

---

## 4. Typography

### Typeface

**Inter** — one family, two loaded instances, via `next/font/google`.

| Variable | Weights | Applied via |
| --- | --- | --- |
| `--font-heading` | 700, 800, 900 | `font-heading` |
| `--font-body` | 400, 500, 600 | `font-sans` (default on `<body>`) |

All `h1`–`h6` automatically receive `font-heading font-bold` via a base layer rule in `globals.css`.

### Type scale in use

| Element | Classes |
| --- | --- |
| Hero H1 | `text-4xl sm:text-5xl lg:text-6xl` · `font-extrabold` · `leading-[1.1]` · `tracking-tight` |
| Page banner H1 | `text-4xl sm:text-5xl` · `font-extrabold` |
| Section heading | `text-3xl sm:text-4xl` · `font-extrabold` |
| Stat number | `text-3xl` · `font-extrabold` · `text-accent` |
| Lead paragraph | `text-lg` · `leading-relaxed` |
| Body | `text-base` · `leading-relaxed` |
| Eyebrow / label | `text-xs` or `text-sm` · `font-semibold` · `uppercase` · `tracking-widest` |
| Fine print | `text-xs` · `leading-relaxed` · `text-white/40` on dark |

### Typography rules

- Body line-height stays in the **1.4–1.6** range — use `leading-relaxed`.
- Headings are always **bold or heavier**. Never set a heading at 400 or 500.
- Wrap headings in `text-balance` and long paragraphs in `text-pretty`.
- Never set body copy below **14px**.
- Uppercase is reserved for eyebrows and small labels, always with wide tracking.

---

## 5. Buttons

Buttons are **outlined-first with rounded corners** — `rounded-lg`, `border-2`, `font-semibold`. Never pill-shaped, never square.

| Variant | Appearance | Use for |
| --- | --- | --- |
| `default` | Solid cyan, dark ink | The single primary action on a view |
| `outline` | Transparent with cyan border, fills cyan on hover | Secondary action, especially on dark surfaces |
| `secondary` | Solid coral, white ink | Alternate emphasis, used sparingly |
| `ghost` | Transparent with navy border | Neutral action on light surfaces |
| `link` | Cyan text, underline on hover | Inline navigation |

Shared behavior: `transition-all duration-150`, a 1px downward nudge on `:active`, and a 3px `--ring` focus ring at 50% opacity.

```tsx
<Link href="/get-offer" className={cn(buttonVariants(), "h-12 px-8 text-base")}>
  Get My Cash Offer
</Link>
```

### Button rules

- **One `default` button per view.** Everything else is `outline` or `ghost`.
- On the dark hero and CTA bands, pair a solid cyan `default` with an `outline` — never two solids.
- CTA sizing: `h-12 px-8 text-base`. Header CTA: `h-9 px-5 text-sm`.

---

## 6. Layout & Spacing

### Grid

- Content container: `max-w-6xl` (`max-w-4xl` for centered banner copy).
- Horizontal padding: `px-4 sm:px-6`.
- Section rhythm: `py-16 lg:py-24` for major sections, `py-8` for the trust strip.

### Method priority

1. **Flexbox** for most layouts — `flex items-center justify-between`
2. **CSS Grid** only for genuine 2D layouts — `grid grid-cols-1 lg:grid-cols-2 gap-10`
3. Never floats; absolute positioning only for overlays such as the hero vignette

### Spacing rules

- Use the Tailwind spacing scale (`p-4`, `gap-6`, `mt-5`) — avoid arbitrary values like `p-[17px]`.
- Use `gap-*` for spacing between siblings. Never mix `gap` with `margin` on the same element.
- Never use `space-x-*` / `space-y-*`.

### Radius

Driven by `--radius: 0.5rem`, with a derived scale from `--radius-sm` through `--radius-4xl`. Buttons and inputs use `rounded-lg`; media and cards use larger radii with soft shadows.

---

## 7. Signature Elements

### The hero grid

The hero's defining visual is a **cyan line grid on dark navy** — two `linear-gradient` layers at 12% opacity on a 40px cell, with a radial vignette fading the edges back into the primary.

```css
background-image:
  linear-gradient(oklch(0.72 0.14 195 / 0.12) 1px, transparent 1px),
  linear-gradient(90deg, oklch(0.72 0.14 195 / 0.12) 1px, transparent 1px);
background-size: 40px 40px;
```

This is the one place the design is allowed to be bold. Everything around it stays quiet. Do not add a second competing pattern elsewhere on the page.

### The pill eyebrow

A small rounded-full badge with a cyan border at 40% opacity, cyan text, and a 10% cyan fill — used above the hero H1 to state service area.

### The stat band

Four extrabold cyan numbers on near-primary navy with muted white labels beneath. Numbers carry meaning; they are never decorative.

---

## 8. Imagery

- Photography is **real and literal** — actual house and land exteriors, natural daylight, real-estate-photography framing, no people.
- Images are **large and rounded with subtle drop shadows**.
- Always supply meaningful `alt` text; mark purely decorative images `aria-hidden`.
- **Never** use abstract gradient blobs, glowing orbs, or blurred shapes as filler.
- **Never** use emojis as icons.

### Icons

**Lucide React**, at `size-4` (16px), `size-5` (20px), or `size-6` (24px). Consistent stroke weight, always paired with a text label or an `aria-label`.

---

## 9. Voice & Copy

### Principles

- **Lead with the benefit.** "Fair cash offer in 24 hours" — not "Our proprietary valuation process."
- **Short sentences.** One idea each.
- **Use "you" and "your."** The seller is the subject.
- **Be specific with numbers.** "7 days," "$0 fees," "24 hours."
- **Never overpromise.** Offers are non-obligation; say so.

### Approved phrasings

- "Get a no-obligation cash offer"
- "Close on your timeline" / "Close on your schedule"
- "Pay zero fees or commissions"
- "We buy houses and land for cash"
- "Skip the agents, fees, and waiting"

### Avoid

- "Cutting-edge," "revolutionary," "synergy," "leverage"
- Exclamation marks in body copy
- ALL CAPS for emphasis outside eyebrow labels
- Any language implying brokerage or agency

### Required legal disclaimer

Displayed in the site footer:

> Mali Group is a direct property buyer, not a licensed real estate broker or agent, and does not provide legal, tax, or financial advice. All offers are non-binding until a written purchase agreement is signed and are subject to review and inspection. Mali Group may assign its purchase contracts to other buyers.

---

## 10. Business Details

Canonical values live in `lib/site-config.ts` — change them there and they propagate site-wide.

| Field | Value |
| --- | --- |
| Business name | Mali Group |
| Phone | +1 (757) 904-7681 |
| Email | maligroup@maligroupco.com |
| Address | 1309 Coffeen Ave, Sheridan, WY 82801 |
| Service area | The United States (nationwide) |
| Years in business | 9 |
| Owner | Marcus Johnson |
| URL | https://www.maligroup.com |

### Property types

Single-family houses · Vacant land & lots · Multi-family & rental homes · Inherited & probate property · Rural & agricultural land · As-is or distressed homes

### Navigation

Home · How It Works · About · Reviews · FAQ · Contact

---

## 11. Accessibility

- Semantic HTML throughout — `main`, `header`, `footer`, `nav`, `section`.
- All interactive elements are keyboard reachable with a visible `--ring` focus state.
- Icon-only controls carry `aria-label`; decorative icons carry `aria-hidden="true"`.
- Screen-reader-only text uses the `sr-only` utility.
- Body text maintains a minimum 4.5:1 contrast ratio. This is why cyan surfaces take dark ink.
- Nav state is announced via `aria-expanded` on the mobile menu trigger.

---

## 12. Quick Reference

```
Primary       oklch(0.28 0.07 220)   ~#0B2E40   dark teal/navy
Accent        oklch(0.72 0.14 195)   ~#22C1D6   bright cyan
Coral         oklch(0.65 0.18 28)    ~#E75A3F   coral/red
Background    oklch(0.98 0.005 220)  ~#F8FAFB   near-white
Foreground    oklch(0.18 0.04 220)   ~#0D1E27   ink

Typeface      Inter — 700/800/900 headings, 400/500/600 body
Radius        0.5rem base, rounded-lg on controls
Container     max-w-6xl, px-4 sm:px-6
Section       py-16 lg:py-24
Buttons       border-2, rounded-lg, font-semibold
```

### The one rule

Commit to the dark navy foundation, spend boldness only on the hero grid, and let cyan mean **action** everywhere it appears.