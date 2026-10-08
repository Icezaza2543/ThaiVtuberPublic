# VThaiDex — DESIGN.md

## 1. Product

**VThaiDex** is the public reference of the Thai VTuber scene: a searchable directory of every Thai
virtual creator we have verified, plus a data page that shows how the scene grew. It is run by one
independent researcher, not a company or an agency.

- Language: **Thai first**, English for platform names and creator names as the creators write them.
- Audience: Thai VTuber fans, VTubers themselves (checking their own entry), agency staff, journalists.
  Mostly on phones (opened from X/Twitter links), then desktop.
- Job of the site: answer "who is out there, where do they stream, and how big is the scene?" quickly,
  and invite people to report missing creators.
- Tone: friendly, warm, a little playful (VTuber culture), but credible: it is a data reference.
  Think "a fan-made almanac that is careful with facts", not a corporate dashboard and not a gacha game.

## 2. Hard content rules (do not design against these)

- **No rankings of creators or agencies.** No "top 10", no leaderboards, no "most popular".
- **No follower, subscriber, view or income numbers** on VThaiDex. Only counts of creators/platforms.
- Every number shown must come from the data below. No invented "live now" badges, trends or deltas.
- **Status is mostly unknown**: of 3,686 creators, 282 are *graduated* and 3,404 are *unknown*
  (we only mark a status when it is verified). Design must make "unknown" look normal and calm,
  never like an error or a missing field.
- A creator with no agency is shown as **Independent** (อิสระ), never "unknown agency".
- Only public profile links. No private data, no audience data, no comments.
- Debut year is known for only 1,074 of 3,686 creators; charts must say "of creators with a known
  debut year" and must not imply the rest debuted in a particular year.
- Creator names can be long, mix Thai/Japanese/English, and contain emoji and brackets
  (e.g. `Ookami Ch. 宏明狼【ECR】`, `Mysterica X.| RPG`). Layouts must wrap them, never clip.

## 3. Pages

### 3.1 Home `/`
- Hero: one sentence thesis + the headline number: **3,686 VTuber ไทย** (verified, including
  graduated creators). Secondary facts: **174 agencies/groups**, **2,965 independent creators**,
  **19 platforms**.
- Search box (jumps to the directory with the query).
- "Where they are" strip: platform coverage as counts of creators (see data 4.2).
- A small "growth" teaser chart: known debuts per year 2018–2026.
- Call to action: "รู้จักวีที่ยังไม่อยู่ในนี้?" → Contribute.
- Current home has a lazy-loaded 3D "universe" (agencies as planets sized by member count,
  independents as a spiral of points coloured by platform mix). Keep the idea of a playful
  centrepiece but it must not block the first screen on phones or hide the headline number.

### 3.2 Directory `/directory` — the most-used page
- Search by name, filter by platform, agency (or Independent), status (graduated / unknown),
  debut year. Sort A–Z / debut year. Paginate or virtualise (3,686 rows).
- Creator card or row: name, platform icons that link out, agency or "Independent",
  status chip only when graduated, debut year when known.
- Empty state, "no results" state, and a clear "data as of <date>" line.

### 3.3 Analytics `/analytics` — "ข้อมูลวงการ VTuber ไทย"
Sections that exist today (keep, restyle):
1. **ทั้งวงการ** — debuts per year, cumulative known debuts, change vs previous year, platform presence.
2. **ภาพรวมแพลตฟอร์ม** — size of each platform (creator counts), which platforms independents use,
   cumulative growth per platform, debuts per year per platform, platform mix by debut cohort.
3. **แยกตามแพลตฟอร์ม** — tabs per platform with the same small multiples.
4. **วีอิสระกับค่าย** — independent vs agency split, agency size bands (no names ranked),
   how many official channels creators keep, status.
5. **สิ่งที่ข้อมูลบอก** — 4–6 plain-language insight cards derived from the numbers.
Each chart has a short Thai help text ("นับอย่างไร").

### 3.4 Contribute `/contribute`
Explains what to prepare (public profile links, name, platforms) and links to a Google Form.
No submission happens on the site itself.

### 3.5 About, Terms, Privacy, Data licence
Long-form Thai text pages. Need a comfortable reading layout (≈65 characters line length, TOC on desktop).

## 4. Real data (snapshot 2026-10-07) — use these values in mockups

### 4.1 Summary
| Figure | Value |
|---|---:|
| Verified Thai VTubers (incl. graduated) | 3,686 |
| Independent creators | 2,965 |
| Agencies / groups | 174 |
| Graduated | 282 |
| Status unknown | 3,404 |
| Creators with a known debut year | 1,074 |

### 4.2 Platform coverage (creators with at least one official account there)
YouTube 2,932 · X 1,280 · Twitch 1,050 · Bluesky 817 · TikTok 796 · EasyDonate 515 · Facebook 380 ·
Website 336 · Instagram 187 · Tipme 97 · Gank 59 · Tipjai 53 · Ko-fi 27 · SociaBuzz 12 ·
Buy Me a Coffee 6 · Fansly 5 · Streamlabs 5 · StreamElements 1 · Other 4

### 4.3 How many platforms one creator uses
1 platform: 1,772 · 2: 715 · 3: 440 · 4: 297 · 5 or more: 462

### 4.4 Known debuts per year
2018: 1 · 2019: 2 · 2020: 16 · 2021: 143 · 2022: 201 · 2023: 244 · 2024: 260 · 2025: 163 · 2026 (to Oct): 44

### 4.5 Agency size bands (groups by member count — show bands, not a ranking)
1 member: 48 groups · 2–5: 96 groups (308 creators) · 6–10: 17 groups (123) · 11+: 13 groups (242)

### 4.6 Sample directory entries (exact snapshot values)
| Name | Platforms | Agency | Status | Debut |
|---|---|---|---|---|
| "คาเอ็น" KAEN Official | TikTok, X, YouTube | Independent | unknown | 2021 |
| Ookami Ch. 宏明狼【ECR】 | Bluesky, Facebook, Instagram, Twitch, X, YouTube | Independent | unknown | — |
| Tiara Rexa Ch. 【POLYGON】 | Facebook, TikTok, X, YouTube | Polygon | graduated | 2023 |
| Mysterica X. Ch. \| RPG | Bluesky, YouTube | Independent | unknown | — |
| Shinah | Twitch | Independent | unknown | — |

"—" means the debut year is not known; render it quietly, not as an error.

## 5. Current visual identity (starting point — improve, do not copy blindly)

- Fonts (self-hosted, must stay self-hosted): **Sriracha** (display, Thai+Latin) and **Sarabun**
  (body, Thai+Latin, 400/500/600). A redesign may propose a different Thai-capable pairing
  (e.g. a geometric Thai display face), but Thai glyphs must render well at 14–16px.
- Dark theme (default) — "night concert stage": paper `#150f3a`, card `#211a55`, raised `#2e2470`,
  deep `#0e0a2a`, ink `#fbf9ff`, muted `#c9c0f2`, faint `#9a90d0`, line `#3b3088`,
  brand pink `#ff5fa2`, accents sky `#43e0ff`, lemon `#ffe45c`, lilac `#b48cff`, mint `#7dffb3`,
  peach `#ff9f5c`.
- Light theme exists: paper `#f6f3fc`, card `#ffffff`, ink `#1d1638`, brand `#db2f74`.
- Backdrop: code-drawn aurora, data dot-grid, gradient waves, small twinkles.
- Type scale ≈1.25: 12 / 13 / 15 / 18.75 / 23.4 / 29.3 / 36.6 px.

What feels weak today (owner feedback over the project): too many saturated colours at once,
small text, low contrast secondary text, evidence/links hard to tap, busy backgrounds behind charts.

## 6. Design direction for the redesign

**Keep the current look and feel; make it more polished.** The owner wants the same tone: the dark
"night concert stage" purple background, pink as the main brand colour, Sriracha/Sarabun type and the
cosy, playful VTuber mood. This is a refinement, not a rebrand.

Keep:
- the deep purple/indigo palette and pink brand colour (small adjustments for contrast are fine);
- Sriracha for display headings, Sarabun for body text;
- a subtle starry/aurora atmosphere behind the hero;
- dark theme as the default, with the existing light theme.

Improve:
- **Hierarchy and spacing**: clearer sections, more breathing room, consistent card padding and radius.
- **Colour discipline**: pink for primary actions and key numbers; at most one secondary accent
  (sky or lemon) for highlights. The other accents (lilac, mint, peach) only inside charts.
  Platform brand colours only on platform icons.
- **Readability**: body ≥16px on mobile, Thai line-height ≥1.6; secondary text `#c9c0f2` or lighter on dark
  so it passes WCAG AA (4.5:1); never place small text over the aurora/dot-grid.
- **Charts**: flat and clean on solid card backgrounds, direct labels, faint grid, a one-line Thai takeaway
  above each chart, colour-blind safe series.
- **Cards and directory rows**: easier to scan; name on one line with wrap, platform icons as ≥44px tap targets,
  agency pill and graduated chip with consistent placement.
- **Hero**: headline number large and immediately visible on a 390px phone; the playful 3D/illustrated
  centrepiece sits beside or below it and never delays the first screen.
- Motion only for small delights (hover, chart reveal); respect `prefers-reduced-motion`.
- Mobile first (390px), then tablet and 1440px desktop. No horizontal scrolling except inside charts/tables.

## 7. Components to design
Header with logo "VThaiDex" + nav (หน้าแรก · รายชื่อ · ข้อมูลวงการ · แจ้งข้อมูล), theme toggle ·
footer with data date, licence and support link · search field · filter chips and dropdowns ·
creator card and compact table row · platform icon button · status chip (graduated) · agency pill ·
stat tile (big number + label + "นับอย่างไร") · bar, stacked bar, line/area, treemap-like platform size,
small-multiple grid · tabs · pagination · empty/loading/error states · insight card · long-form text layout.

## 8. Technical constraints
React 19 + Tailwind CSS v4 + Vite multi-page site; fonts via `@fontsource` (no Google Fonts CDN, no
third-party requests at runtime); deployed on Vercel. Charts are custom React/SVG today. Accessibility:
semantic headings, keyboard focus visible, charts have text alternatives.
