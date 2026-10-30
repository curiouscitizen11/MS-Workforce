# DESIGN.md: worker portal design guide

> **Approved 25 Oct 2026 by Marek.** These rules replace any line below that disagrees with them.
>
> - Fully round pill buttons, 48px tall (44px minimum tap size).
> - Primary is solid teal `#2ec4b6` with navy text. Secondary has a 1px outline. One main button per screen.
> - Cards and panels about 16px radius with a subtle border. No heavy glows or gradients.
> - Navy `#0b1a2e` dark background with lighter navy cards and teal accents.
> - Selected states are solid teal with a tick, never blue.
> - Long lists use tappable, searchable pickers.
> - Compact bottom areas.
> - Wording "Apply for work" and "Book labour".
> - A thin teal line between sections is for the website only. Do not add it to the portal.

The look for every screen of the MS Workforce worker portal. Coding agents follow this alongside `AGENTS.md`. Mav confirmed the choices on 24 Oct 2026: layout C, "Status strip and list". Source: `Competitor_Research/portal-mockups/mockups.html` and `portal_mockups_ABC.png` (in the Drive files, not in this repo). If this guide and the mockups disagree, this guide wins. If something isn't covered here, follow the approved rules at the top, then keep it plain: thin lines and navy.

## 1. Rules that always apply
- Dark navy `#0b1a2e` background, lighter navy cards, and teal accents.
- Buttons are fully round pills, 48px tall (44px minimum). Cards and panels are about 16px with a subtle border. No heavy glows or gradients.
- Selected states are solid teal with a tick, never blue.
- Icons are thin line icons only (see 6).
- Mobile first for iPhone Safari (360, 390 and 430px wide). It must also work on Mac Safari and desktop browsers.

## 2. Colour tokens
Add these as CSS variables (and as a `portal` colour group in Tailwind if you like). The `navy`/`teal` scales in `tailwind.config.ts` (#0A2540 / #0D9488) belong to the public website. Don't use them in the portal.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0b1a2e` | Page background (navy) |
| `--surface` | `#0e2240` | Side menu panel, raised areas |
| `--line` | `#22354f` | 1px dividers, row lines, header bottom line |
| `--line-strong` | `#33465f` | Outer frame, disabled borders |
| `--field-border` | `#5d728c` | Input and secondary button borders (3.5:1, passes 3:1 for UI parts) |
| `--text` | `#e8edf3` | Body text, row labels, icon stroke |
| `--text-strong` | `#ffffff` | Names, headings, status values, signature ink |
| `--text-muted` | `#8fa1b6` | Labels, greeting, captions (6.6:1) |
| `--text-faint` | `#5d728c` | › chevrons, "Sample data only", placeholder. Never use for real info. |
| `--status-bar` | `#c9d3df` | Small meta text |
| `--accent` | `#2ec4b6` | Teal accent (8.1:1 on navy) |
| `--on-accent` | `#0b1a2e` | Text on a teal fill |
| `--overlay` | `rgba(0,0,0,.45)` | Dim layer behind the open menu |
| `--error` | `#ff6b6b` | Errors only (6.3:1). New, not in the mockups. |

Where teal is allowed: the "WORKFORCE" half of the wordmark, the primary button (solid `#2ec4b6` with navy text), a selected state (solid teal with a tick), teal accents, and the focus ring. A thin teal line between sections is for the website only. Do not add it to the portal. Never use blue for a selected or focus state.

## 3. Type
Font stack: `-apple-system, "Helvetica Neue", Arial, sans-serif` (system font, no web fonts). Weights are 400 and 600 only.

| Role | Size / line height | Weight | Colour |
|---|---|---|---|
| Wordmark | 15px, letter-spacing 4px, uppercase | 600 | `--text`, with "WORKFORCE" in `--accent` |
| Page title / name | 21px / 1.25 | 400 | `--text-strong` |
| Row label, body | 16px / 1.4 | 400 | `--text` |
| Menu row | 15px / 1.4 | 400 | `--text` |
| Status value | 14px / 1.3 | 600 | `--text-strong` (or `--accent` if it needs attention) |
| Greeting, label, caption | 13px / 1.4 | 400 | `--text-muted` |
| Status label / sub-line | 11px / 1.35 | 400 | `--text-muted` |

Inputs are always 16px or larger, so iPhone Safari doesn't zoom in. Use sentence case, except for the wordmark. Don't go below 11px.

## 4. Spacing and sizes
- Base unit is 4px. Allowed steps: 4, 8, 12, 16, 18, 22, 24, 32.
- Screen side padding is 22px (18px in the header).
- Header height is 56px. List row height is 62px (54px in the menu). Every tap target is at least 44 x 44px, 48px preferred.
- Respect `env(safe-area-inset-*)` at the top and bottom on iPhone.
- On screens 768px wide and up, centre the content column at a max width of 480px. Lines stay full-width inside the column. Don't switch to a grid.

## 5. Radius, lines and dividers
- Buttons are fully round pills (`9999px`). Cards, panels and menu rows are about 16px. Dialogs are about 16px. Inputs and the signature pad stay at `--radius-sm: 4px` (see 11 and 12). The focus ring is 2px.
- All lines are 1px solid `--line`. The only exceptions are the strip's 3px teal left edge and the 2px focus ring.
- A list has a top line and a bottom line on every row. Rows span the full width with no inset.
- `box-shadow: none` everywhere. No heavy glows, gradients or button lift.

## 6. Icons
- Inline SVG, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.3"` (1.5 at most), round caps and joins.
- 24px in rows, 26px for ☰. Colour is `--text`. No filled, two-tone or emoji icons.
- Reuse the icon set in `mockups.html` (menu, shifts, time, id, ticket, induct, safety, help, logout). Draw any new icon in the same style.
- Decorative icons get `aria-hidden="true"`. The row label carries the meaning.

## 7. Header and ☰ menu
- Header: 56px tall, `--bg`, 1px `--line` bottom border, sticky at the top. The ☰ button is on the left (44 x 44px tap area, 26px icon, `aria-label="Menu"`, `aria-expanded`). The "MS WORKFORCE" wordmark is centred. Nothing goes on the right unless a batch asks for it.
- Menu: a side panel that slides in from the left, 290px wide (max 85vw), under the header. Background `--surface`, 1px `--accent` right edge, `--overlay` behind it. The top block reads "Signed in as" (13px muted) plus the name (17px white), with a `--line` underneath. Then come the menu rows (54px, icon, label, ›), with Log out last.
- The current page has a 3px teal left edge on its row. Don't use a filled background for it.
- Behaviour: opens on tap or Enter. Closes on the overlay, Esc, ✕/☰ or after choosing a link. Focus moves into the panel and is trapped there, then returns to ☰ on close. Body scroll locks while it's open. Slide is 200ms ease-out, and there's no animation under `prefers-reduced-motion`.

## 8. Home: status strip
Flagged: describes the older flat Home; not current. Marek to decide.
- Sits under the greeting (13px muted "Good morning" and a 21px white name, padding 18px 22px 10px).
- One row of 3 equal cells: **Next shift**, **Awaiting sign-off**, **Ticket expiring**. 1px `--line` dividers between cells and below the strip, plus a 3px `--accent` left edge. Cell padding is 12px.
- Each cell has an 11px muted label, a 14px/600 white value, and an 11px muted sub-line (site, count, days). Example: "Next shift / Mon 7:00am / Example Site, Parramatta".
- The value turns `--accent` when something needs action (ticket expires within 30 days, hours waiting). Expired tickets use `--error` and say "Expired".
- Leave out a cell when it has nothing to show, and let the others share the width. If all 3 are empty, show one cell: "Nothing due. You're all set."
- Each cell is a link to its page (Shifts, Timesheets, Tickets), with a 44px minimum height.
- At 360px, values may wrap to 2 lines. Never shrink below 11px.

## 9. List rows
Flagged: describes the older flat Home; not current. Marek to decide.
- Full width, 62px tall, padding 0 22px, `display:flex; align-items:center`.
- Order: 24px icon, 18px gap, 16px label, › on the far right (22px, `--text-faint`).
- Optional count goes before the ›: plain 13px `--accent` text, for example "2". Never a bubble or a badge.
- Optional second line is 13px `--text-muted` under the label. Raise the row to 72px when there is one.
- Pressed or hover state is a `rgba(255,255,255,.04)` background. No movement, no shadow.
- Home list order: My shifts, Timesheets, My ID pass, Tickets, Inductions, My details & safety, Help.

## 10. Buttons
- Height 48px (44px minimum), fully round (`9999px`), 16px/600 text, full width on mobile, auto width (min 160px) from 768px up. Flat: no lift and no shadow.
- **Primary**: solid `#2ec4b6`, navy `#0b1a2e` text, no border. Use at most one per screen.
- **Secondary**: transparent, 1px `#5d728c` outline, text `#e8edf3`.
- **Selected**: solid teal with a tick icon. Never blue.
- **Text button**: no border, `--accent` text, 44px tap height.
- **Destructive**: transparent, 1px `--error`, `--error` text. Always ask for confirmation.
- **Disabled**: opacity .4, `cursor:not-allowed`, and still readable.
- **Focus**: `outline: 2px solid var(--accent); outline-offset: 2px`. Use `:focus-visible` and never remove it.
- **Loading**: keep the label and add "…". Disable the button while the request runs.

## 11. Form fields
- Label sits above the field: 13px `--text-muted`, 8px gap, never only a placeholder.
- Input: height 48px, radius 4px, background `--bg`, 1px `--field-border`, padding 0 12px, 16px `--text`, placeholder `--text-faint`.
- Focus: border `--accent` plus the 2px focus ring.
- Error: border `--error`, with a 13px `--error` message under the field in plain words ("Enter a 10-digit mobile number"), linked with `aria-describedby`.
- Space fields 16px apart. Use the correct `inputmode` and `autocomplete` (`tel`, `one-time-code`, `numeric`). Dates use the native picker.
- Checkboxes and radios: native, `accent-color: var(--accent)`, 24px, with a 44px label tap area.

## 12. Signature pad
- Full content width, height 200px (160px minimum), radius 4px, background `--bg`, 1px `--field-border`, with a dashed `--line` baseline 40px from the bottom and an 11px muted "Sign here" note.
- **Pen: `#ffffff`, 3px line width** (scale by `devicePixelRatio`), round cap and join. Never navy or grey ink on navy.
- Add `touch-action: none` on the canvas so the page doesn't scroll while signing. Support Pointer Events (finger, Apple Pencil, mouse or trackpad on Mac).
- "Clear" is a text button above the pad, on the right. "Sign" or "Submit" stays disabled until there is ink.
- When stored or exported, the signature must stay visible on a light background. Save the strokes as an image with a transparent background and a white stroke, and draw it on navy when shown, or save a dark-ink copy for PDFs and exports.

## 13. Empty, loading and error states
- **Empty**: a 32px line icon in `--text-faint`, a 16px `--text` line ("No shifts yet"), and a 13px muted next step. Centred, 48px top padding, no illustrations.
- **Loading**: thin rows (62px) with a `--line` placeholder bar, or the text "Loading…". No spinners in bubbles, and no shimmer under reduced motion.
- **Error banner**: 1px `--error` border, radius 6px, transparent background, padding 12px 16px, 13px text: what went wrong plus one action ("Couldn't save. Check your signal and try again."). Use `role="alert"`.
- **Success**: a 1px `--accent` line banner, same style as the error banner. It fades after 4s, or stays if it holds a link.
- Never show raw error codes or stack traces to workers.

## 14. Contrast and accessibility
- Text meets WCAG AA: 4.5:1 for body text, 3:1 for 18px+ or 14px bold. Checked on `--bg`: white 17.5, `--text` 14.9, `--text-muted` 6.6, `--accent` 8.1, `--error` 6.3, `--field-border` 3.5 (UI parts only).
- `--text-faint` (3.5:1) is only for the ›, the placeholder and the sample note, never for information.
- Never use colour alone. Pair it with a word ("Expired", "Due in 21 days").
- Use semantic HTML: `<header>`, `<nav aria-label="Main">`, `<main>`, real `<a>` and `<button>`, one `<h1>` per screen.
- Respect `prefers-reduced-motion`. Text can be zoomed to 200% without content being cut off.
- The optional Light theme (already on the branch) keeps the same layout and lines. Its colours must also pass AA.

## 15. Do and don't
| Do | Don't |
|---|---|
| Cards and panels about 16px with a 1px subtle border | Heavy glows, gradients or drop shadows |
| Fully round pill buttons, 48px tall | Square buttons or blue selected states |
| Square list rows, strip and header | Drop shadows, glows, blur or gradients |
| Thin 1.3px stroke SVG icons | Filled, two-tone, emoji or icon-font icons |
| Teal for the primary button, a selected state, the wordmark and the focus ring | Blue selected states, teal body text, or more than one main button |
| Counts as plain teal numbers | Red dots or count badges in circles |
| ☰ top-left on every portal screen | A bottom tab bar or floating action buttons |
| White, thick signature ink | Dark ink on the navy pad |
| Test at 360, 390 and 430px and on Mac | Hover-only actions or tiny tap targets |
| Use demo data ("Jordan Example") | Real names, numbers or photos |

## 16. Long lists: chosen rows and an add picker
When a screen offers a long catalogue, show only the items the person has chosen. Each chosen item is a list row from section 9: the name, a status word when there is one, and ›. Tapping the row opens that item.

Under the rows, one button reads "+ Add …". It opens a scrollable picker with a search box at the top. Options are grouped, for example Licences and Training. An item already chosen is greyed out and cannot be added twice. If the catalogue can grow, an Other row at the bottom lets the person type a name. Choosing an item opens its form.

Use this for catalogues, not for a short fixed set. Days of the week, a yes or no, and a safety checklist (allergies, medical conditions, and tasks an injury affects) stay fully visible so nothing is missed. A single-choice select of a few options stays a select.

This section does not change the home tiles or the bottom bar. Those stay until the batch that owns the home and menu.

Note: the 2x2 tile home and bottom bar already on the branch (Phase 1 item 2.2) are replaced by this layout. Do that only in the batch that owns the home and menu screens (Batch 2), not as a side change.
