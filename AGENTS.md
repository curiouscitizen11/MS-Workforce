# AGENTS.md: standing rules for any coding agent

These rules apply to every coding agent (Cursor, cloud agents or anyone else) working on this repo for MS Workforce. Read them before you start and follow them every time. They were approved by Mav on 23 Oct 2026.

## 1. Never merge or deploy
- Never merge a pull request, never push to `main`, never deploy to production.
- Never change Vercel settings, plans, environment variables, domains or DNS.
- Keep draft pull requests as drafts. Mav reviews and approves everything before it goes live.

## 2. Commit and push as you go
- Commit and push after every finished item, with a short, clear message.
- Work only on the branch you were given. Don't create new branches or new pull requests unless told to.

## 3. Check your work before saying "done"
- Run all of these and make sure they pass: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Review your own code for bugs before finishing (edge cases, wrong totals, broken links, missing checks).
- Check the logs (build, test and server output) for errors and warnings, and fix them or report them.

## 4. Stop and report if stuck
- If you are stuck, going round in circles, or repeating the same fix, stop. Write down what you tried, what failed and what you need, then report it. Don't keep spending usage.

## 5. Stay inside the batch
- Only build what the current batch asks for. Don't add extra features, refactors or "nice to haves".
- If you spot something outside the batch, write it in the pull request as a note instead of doing it.

## 6. Privacy
- Never put real personal data in code, tests, fixtures, logs or screenshots. Use the demo people only.
- Ticket and licence numbers are always masked (last 4 digits only, e.g. "•••• 4821") anywhere other than the worker's own screen and the admin screen.
- The builder pass (the public QR check page) must never show a phone number, email, address, date of birth, medical, allergy or emergency contact details, or full card numbers.
- Never add fields for a tax file number, bank account, BSB or superannuation. Those live in Xero Payroll only.

## 7. Business name
- The public name is "MS Workforce" only. Never write "Pty Ltd" or any company suffix anywhere.

## 8. Test for iPhone and Mac
- Mav uses an iPhone and a Mac. Test every screen in iPhone Safari sizes (360, 390 and 430 px wide) and on Mac Safari/desktop.
- Touch targets at least 44 x 44 px (48 px preferred).

## 9. Design
- Follow `DESIGN.md`.
- Approved 25 Oct 2026 by Marek:
  - Fully round pill buttons, 48px tall (44px minimum). Primary is solid teal `#2ec4b6` with navy text. Secondary has a 1px outline. One main button per screen.
  - Cards and panels about 16px radius with a subtle border. No heavy glows or gradients.
  - Navy `#0b1a2e` dark background, lighter navy cards, and teal accents.
  - Selected states are solid teal with a tick, never blue.
  - A ☰ menu button in the top-left corner.
  - Thin line icons (inline SVG).
