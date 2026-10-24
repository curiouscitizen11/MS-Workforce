# Worker portal — setup for Mav

The worker portal lives at `/portal` on the same website as www.msworkforce.au. Workers log in with a text message code. You (Mav) are the only admin.

You can try the whole portal on your computer with no accounts. Real texts, emails, Notion and photo storage stay switched off until you follow the steps below.

The public name stays **MS Workforce**. Do not add a company suffix on the website or in the portal.

Do not ask workers for a tax file number, bank details or super. Those stay in Xero. Pay is fortnightly, on Thursday. The pay fortnight starts on a Thursday. The default is Thursday 5 November 2026. To use another Thursday, set `PORTAL_PAY_ANCHOR` in `.env.local` (see `.env.example`). Signed hours export from Admin → Hours as a Xero CSV.

## Try it first (no accounts)

1. Open a terminal in this project folder.
2. Run `npm install`.
3. Run `npm test`. You should see the compliance tests pass.
4. Run `npm run dev`.
5. On your phone, or in a narrow browser window, open `http://localhost:3000/portal/login`.

Leave `PORTAL_MODE` unset, or set it to `mock` in `.env.local`. Demo mode never calls Notion, Twilio or email, even if those keys are sitting in the file.

A Vercel preview of this branch is also demo mode. It does not need Neon, Twilio, Notion or Blob. It switches to the real accounts only when `PORTAL_MODE` is set to `live`. On the production site, if `PORTAL_MODE` is left blank and both the database address and the Notion token are set, the portal treats that as live.

Demo logins are on the login screen:

- **Sam Lee**, mobile `0400 111 222` — a ready worker with an open shift offer and a signed timesheet.
- **Mav**, mobile `0400 000 001` — admin. After the text code, the screen shows a second demo authenticator code.

The login screen shows the demo code. No real text is sent.

Other demo people:

- Alex Nguyen `0400 333 444` — answered No to the white card. The portal will not let this person accept a shift.
- Priya Shah `0400 555 666` — answered No to asbestos Class B. Ordinary labour is still allowed.
- Jordan Blake `0400 777 888` — answered No to heights. Can still accept a normal labour shift.
- Casey Morgan `0400 999 000` — new applicant.

## What you need before it goes live

Create these accounts yourself. Put the keys in Vercel (Project → Settings → Environment Variables), not in the code. Copy the names from `.env.example`.

Set `PORTAL_MODE` to `live` only after every item below is filled in, and only on production. Preview links stay in demo mode. On production, if `PORTAL_MODE` is left blank and both the database address and the Notion token are set, the portal treats that as live. Missing login secrets are rejected only in live mode. Demo mode uses stand-in secrets so a preview can open with no environment variables.

### 1. Neon (the login database)

Notion stays the record of each worker. Neon only keeps logins, a short cache, and a queue of updates so we do not hammer Notion (it allows about 3 requests a second; the portal stays under 2).

1. Go to [neon.tech](https://neon.tech) and create a free project. Name it something like `ms-workforce-portal`.
2. Copy the connection string. It starts with `postgres://`.
3. In Vercel, add `DATABASE_URL` with that string.
4. On your computer, with `DATABASE_URL` set, run the SQL in `drizzle/0001_portal_records.sql` once (Neon’s SQL editor is fine). That creates one table, `portal_records`.

### 2. Twilio (text message login codes)

1. Go to [twilio.com](https://www.twilio.com) and create an account.
2. Buy an Australian mobile number that can send SMS.
3. From the Twilio console, copy:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth token → `TWILIO_AUTH_TOKEN`
   - The new number, in the form `+61…` → `TWILIO_FROM`
4. Start in Twilio’s trial if you like. Trial accounts only text numbers you have verified.

Workers enter their mobile. The portal texts a 6-digit code. The code lasts 10 minutes. Five wrong codes lock the phone for 15 minutes. A phone can ask for 3 codes in 15 minutes.

If a worker has no signal, they can ask for an email link instead. That uses the email account below.

### 3. Email (Resend)

1. Go to [resend.com](https://resend.com) and create an account.
2. Add the domain `msworkforce.au` and turn on the DNS records they show you (ask whoever manages the domain, or do it in Vercel’s domain page).
3. Create an API key → `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to a real address on that domain, for example `MS Workforce <hello@msworkforce.au>`.

This sends login links, the email after a supervisor signs a timesheet, and ticket reminders.

### 4. Notion (the source of truth)

Use a **test copy** of your HQ workspace first. Do not point the portal at the live Workers database until you have tried a full apply, ticket upload, shift offer and timesheet on the test copy.

1. In Notion, duplicate the HQ page into a page called something like `HQ – TEST`.
2. Go to [www.notion.so/my-integrations](https://www.notion.so/my-integrations) and create an internal integration named `MS Workforce portal`.
3. On the TEST page, open the `…` menu → Connections → add that integration.
4. Copy the integration secret → `NOTION_TOKEN`.
5. Open each TEST database as a full page. The id is the long code in the URL. Set:
   - `NOTION_WORKERS_DB`
   - `NOTION_PLACEMENTS_DB`
   - `NOTION_TIMESHEETS_DB`
   - `NOTION_INDUCTION_DB`
   - `NOTION_SITE_CONFIRMATIONS_DB`
6. Set `PORTAL_NOTION_ENV` to `test`.

Workers are matched by mobile number. A second apply with the same mobile updates the same person. It does not create a second Notion row.

Passport numbers and ticket photos never go to Notion. Visa and VEVO notes stay in the admin screen only.

**Shift offers** is a new database. It does not exist yet. The plan is in `lib/portal/notion/shift-offers.mjs`. To print that plan without changing Notion:

```bash
npm run portal:shift-offers
```

To create it, only inside the TEST workspace, after you have read the printout:

```bash
PORTAL_NOTION_ENV=test CONFIRM_CREATE_SHIFT_OFFERS=yes \
NOTION_TOKEN=your-test-token \
NOTION_PARENT_PAGE_ID=the-test-page-id \
NOTION_WORKERS_DB=the-test-workers-id \
NOTION_PLACEMENTS_DB=the-test-placements-id \
npm run portal:shift-offers -- --apply
```

The script refuses the live database ids. Do not run `--apply` against production. After it creates the database, copy the new id into `NOTION_SHIFT_OFFERS_DB`.

Before go-live, check that the dropdown names in TEST match the live Notion options (status, tickets, visa, right to work). If a name does not match, the portal stops that write instead of inventing a new option.

### 5. Private photo store (Vercel Blob)

Ticket photos are private. A link lasts at most 5 minutes.

1. In the Vercel project, open Storage → Blob → Create. Choose a **private** store.
2. Copy the read-write token → `BLOB_READ_WRITE_TOKEN`.

If this token is missing while the portal is live, photos are kept in the database instead. Add the token before real workers upload ticket photos. HEIC files are stored as taken. JPG and PNG are reduced on the phone first.

When a worker answers **Yes, I have it**, they must add a photo of the front and a photo of the back before they can continue. They can use the phone camera or the gallery. JPG, PNG and HEIC are accepted, and large photos are reduced before they are sent. Workers cannot open the photos again. Only you can, from the worker’s admin page, and each link lasts 5 minutes.

On that page the two photos sit side by side. You type the number and the expiry date you can see on the card, then choose **Mark checked**. That records your name and the time. If the card has no expiry date, tick **No expiry date on this card**.

Both photos are deleted 7 days after you mark that card checked. The number, the expiry, who checked it and when stay on file. **Delete images now** removes them sooner and writes the same audit note.

### 6. Your admin login (second code)

Your worker login is a text to `ADMIN_MOBILE` (default `+61400000001` — change this to your real mobile). Then a second code from an authenticator app (Google Authenticator or similar).

1. In the authenticator app, add a new key manually.
2. Generate a long random base32 secret (the app can do this, or use a password manager).
3. Put that secret in `ADMIN_TOTP_SECRET`.
4. Set `ADMIN_EMAIL` to `hello@msworkforce.au` unless you want alerts somewhere else.

Your admin session lasts 12 hours. A worker’s session lasts 30 days.

### 7. Three secret strings

In Vercel, add a long random value for each of these. They can be any mix of letters and numbers, at least 32 characters. Use a different value for each.

- `PORTAL_SESSION_SECRET` — signs the login cookie.
- `PORTAL_ENCRYPTION_KEY` — locks the passport number until you record the VEVO result, or for 14 days, whichever comes first.
- `PORTAL_SIGNING_SECRET` — signs the short photo links.
- `CRON_SECRET` — so only Vercel can run the daily jobs.

Also set `NEXT_PUBLIC_SITE_URL` to `https://www.msworkforce.au`.

### 8. Daily jobs

These addresses do the quiet work. Call them with header `Authorization: Bearer` plus your `CRON_SECRET`.

- `/api/portal/cron/outbox` — sends queued Notion updates.
- `/api/portal/cron/reminders` — texts workers when a ticket is inside the warning window (60 days for asbestos A/B and first aid, 30 days for other tickets), then again at 14 days, 7 days and on the day. On Mondays it also emails you a list of anyone who is not clear to book.
- `/api/portal/cron/purge` — deletes ticket photos 7 days after that card was marked checked, and passport numbers older than 14 days. The number, expiry and check record stay. Each deletion is written to the audit log. Vercel runs this once a day, at 16:15 UTC, after this branch is merged. Preview links do not run it. `CRON_SECRET` must be set or the live job is refused.

On Vercel’s free plan, scheduled jobs usually run once a day. Once a day is enough for reminders and the photo purge. For Notion updates, once a day is slow; a paid plan can run the outbox every few minutes. Until then, worker actions are saved in the database and reach Notion on the next run.

In mock mode these addresses are open and they do not call Notion.

## Email on file

Apply and the email login link both ask for the email twice. The two answers must match after trimming, and capital letters do not matter. If they differ, the form shows "Emails don't match." and does not send. A badly formed address shows "That email does not look right." Apply can leave both boxes empty. Only one address is saved. Onboarding does not ask for an email.

## Licence and ticket questions

Each of these questions has the same three answers: **Yes, I have it**, **No**, **Booked in for the course**.

- White card
- Work at heights
- Asbestos Class A
- Asbestos Class B
- Confined space
- First aid
- Driver licence
- Other ticket

The worker does not type a card number, expiry, issue date, issuing state, lost-card reason, driver licence class, or whether they have done construction work in the last 2 years. You enter the number and expiry when you check the photos. When White card is No or Booked in for the course, the form keeps the TAFE NSW course link and the SafeWork NSW white card link. The tickets page still links to the training provider list.

Forklift, EWP and the other listed licences work the same way. If the worker says they hold one, they add the front and the back before they can continue.

Tally and Notion selects for those eight questions should use the same three answers. Drop the old choices (Held, Not held, Expired, Booked in / training now, Not completed, Lost – replacement needed, and the driver licence classes).

## How booking rules work

- A white card is required. **No**, **Booked in for the course**, or a blank answer means **DO NOT BOOK**.
- Only **Yes, I have it** counts as holding a ticket.
- Asbestos Class A or B answered No or Booked in does not block ordinary labour.
- Expiry warnings use the date you enter when you mark the card checked. 60 days for asbestos A/B and first aid, 30 days for the rest, including forklift and EWP. A date that has passed still means DO NOT BOOK for a white card or asbestos A/B, and Restricted for any other ticket. A card with no expiry date does not raise a warning.

You send a shift to everyone who is Ready, or to people you pick. Anyone marked DO NOT BOOK is skipped if you choose “all”, and the send is refused if you pick them by name.

There is no availability calendar. A worker accepts or declines. The street address appears after they accept.

## Timesheets

The worker types start, finish and break. No GPS. They hand the phone to the supervisor, who signs on the screen. That signature is the approval. There is no builder login and no separate approval link. The worker and you both get an email.

## Going live

1. Finish a full practice run on the TEST Notion workspace.
2. Set the Vercel env vars to the live Notion ids only when you are happy.
3. Set `PORTAL_MODE` to `live`.
4. Smoke-test with your own mobile: log in, upload a ticket photo, send yourself an offer, sign a timesheet, confirm the Notion row.
5. Merging to `main` publishes the website. Do that only when you mean to.

The marketing pages are unchanged. The Apply button on the public site still goes where it did. Switch that later, after you have used the portal with real workers.
