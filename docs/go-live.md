# Portal go-live checklist

The public site is already on `main`. The portal stays on **Portal opening soon** until `PORTAL_MODE` is exactly `live`.

Sign-in is a 6-digit code sent by email (Resend). Text-message codes stay in the code and switch on only when all three Twilio values are set. Until then the login screen does not mention texts, and nothing tries to send one.

Alerts to the office go to `hello@msworkforce.au` unless `ADMIN_EMAIL` is set to something else. The sender is `portal@msworkforce.au` (`EMAIL_FROM`).

Do not change DNS from this repository. Resend will show DNS records for `msworkforce.au`. Whoever manages the domain adds those.

## Environment variables

Put these in Vercel → Project `ms-workforce` → Settings → Environment Variables, for Production. Do not commit them.

Generate the random secrets on your own computer:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Run that once per secret. Each result is 43 characters. Use a different result for each name.

| Name | Required for live? | Purpose | Format | Who provides it |
| --- | --- | --- | --- | --- |
| `PORTAL_MODE` | Yes | Opens the real portal. Anything other than the exact word `live` (including blank, `mock`, or `LIVE`) keeps the demo, or **Portal opening soon** on production. | The five letters `live` | Owner |
| `DATABASE_URL` | Yes | Neon Postgres. Logins, sessions, the Notion queue, and the audit log. | Starts with `postgres://` or `postgresql://`. Neon looks like `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require` | Owner, from the Neon project |
| `NOTION_TOKEN` | Yes | Notion integration secret. | Starts with `ntn_` or `secret_`, at least 20 characters | Owner, from notion.so/my-integrations |
| `NOTION_WORKERS_DB` | Yes | Workers database id | 32 hex characters. Hyphens are optional (`8-4-4-4-12` or one block) | Owner, from the database URL |
| `NOTION_PLACEMENTS_DB` | Yes | Placements database id. Book labour adds a row here | Same Notion id | Owner |
| `NOTION_TIMESHEETS_DB` | Yes | Timesheets database id | Same Notion id | Owner |
| `NOTION_SHIFT_OFFERS_DB` | Yes | Shift offers database id. Create it with the script below, on a TEST page first | Same Notion id | Owner, after the script |
| `RESEND_API_KEY` | Yes | Sends login codes, login links, shift emails and reminders | Starts with `re_`, at least 12 characters | Owner, from resend.com |
| `EMAIL_FROM` | Yes | From address on the verified domain | `portal@msworkforce.au` or `MS Workforce <portal@msworkforce.au>` | Owner. Planned address: `portal@msworkforce.au` |
| `ADMIN_TOTP_SECRET` | Yes | Second code for the admin login, after the email code | Base32: letters `A`–`Z` and digits `2`–`7` only. Spaces and `=` are ignored. At least 16 characters (10 bytes). Use 32 characters. 6 digits, 30-second step, one step either side is accepted | Can be generated. Put the same secret in the authenticator app |
| `PORTAL_SESSION_SECRET` | Yes | Signs the login cookie (HMAC-SHA256). The string is the key. It is not base64-decoded | Any characters, at least 32. The 43-character command above is right | Can be generated. Use a new value |
| `PORTAL_SIGNING_SECRET` | Yes | Signs the short photo links (HMAC-SHA256). Same rule as the session secret | At least 32 characters. A different value from the session secret | Can be generated |
| `PORTAL_ENCRYPTION_KEY` | Yes | Passphrase for passport numbers. The portal runs scrypt with salt `msw-portal` and uses the 32-byte result as an AES-256-GCM key. The passphrase is not decoded as hex or base64 | At least 32 characters. A different value again | Can be generated |
| `CRON_SECRET` | Yes | Lets Vercel run the daily jobs, and lets you open the readiness check. Vercel sends `Authorization: Bearer` plus this value when the variable is named exactly `CRON_SECRET` | At least 32 characters. Compared in full | Can be generated |
| `NEXT_PUBLIC_SITE_URL` | Yes | Origin for login links and invite links | `https://www.msworkforce.au` with no path. A trailing slash is removed. `http://localhost` fails the readiness check | Owner |
| `NOTION_INDUCTION_DB` | No | Not written by the portal. A pass is saved on the worker | Notion id, or leave blank | Owner, only if you want the id stored |
| `NOTION_SITE_CONFIRMATIONS_DB` | No | Not read by the portal | Leave blank | — |
| `NOTION_PARENT_PAGE_ID` | No | Only for the shift-offers setup script | Notion page id | Owner, for the script |
| `PORTAL_NOTION_ENV` | No | Must be `test` before the script will create a database | The word `test` | Owner, for the script |
| `CONFIRM_CREATE_SHIFT_OFFERS` | No | Must be `yes` as well, after you have read the script's printout | The word `yes` | Owner, for the script |
| `ADMIN_EMAIL` | No | Office alerts: new labour request, incident, Monday ticket list. The admin signs in with this address | An email address. Blank uses `hello@msworkforce.au` | Owner. Planned: `hello@msworkforce.au` |
| `ADMIN_MOBILE` | No | Stored on the admin row. Used for a text only when Twilio is set | `+` then 8 to 15 digits, for example `+614…`. Blank uses `+61400000001` | Owner, before the first live request if you care about the stored mobile |
| `BLOB_READ_WRITE_TOKEN` | No | Private Vercel Blob store for ticket and ID photos | Starts with `vercel_blob_rw_` | Owner, from Vercel Storage → Blob, private |
| `TWILIO_ACCOUNT_SID` | No | Text-message codes. Leave blank for email-only | `AC` plus 32 hex characters | Owner, later, from Twilio |
| `TWILIO_AUTH_TOKEN` | No | With the other two Twilio values | 32 hex characters | Owner, later |
| `TWILIO_FROM` | No | The Twilio number | `+` then 8 to 15 digits | Owner, later |
| `PORTAL_PAY_ANCHOR` | No | First Thursday of the weekly pay calendar. Each week runs Thursday to Wednesday and is paid the following Thursday | `YYYY-MM-DD`. Blank uses `2026-11-05` | Owner |

Set all three Twilio values, or none. One or two on their own does not turn texts on.

`PORTAL_SESSION_SECRET`, `PORTAL_SIGNING_SECRET`, `PORTAL_ENCRYPTION_KEY` and `CRON_SECRET` can be any non-empty string and the portal will start. The readiness check asks for 32 characters or more. Do not reuse one value for two names.

The encryption key is a passphrase. Generating 32 random bytes and pasting them as base64url is right. The portal does not treat that string as the raw AES key.

## Database

Neon only keeps logins, sessions, a cache and the queue. Notion stays the record of each worker.

The table is:

```sql
CREATE TABLE IF NOT EXISTS portal_records (
  collection text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY (collection, id)
);
```

It is created in three ways. Any one of them is enough:

1. Automatically, the first time the live portal handles a request.
2. Automatically, when the readiness check runs and `DATABASE_URL` is set. That works before `PORTAL_MODE=live`.
3. On your computer: `DATABASE_URL='postgresql://…' npm run portal:migrate`

The same SQL is in `drizzle/0001_portal_records.sql` if you prefer Neon's SQL editor.

The first live request also creates the admin login if there is not one yet. The email is `ADMIN_EMAIL`, or `hello@msworkforce.au`. The mobile is `ADMIN_MOBILE`. Later changes to those two variables do not rewrite the row. Sign in with the email, then the authenticator code.

Photos are not in this table when `BLOB_READ_WRITE_TOKEN` is set. Without that token they are stored in the table. Add the token before real ticket photos.

## Notion databases

A missing column is skipped and the rest of the row still saves. A dropdown or multi-select that is missing one of the choices below stops that row. The row waits and tries again. Names and capitals have to match.

The readiness check lists missing columns, wrong types, and missing choices. It does not print secrets.

### Workers — `NOTION_WORKERS_DB`

People are matched by the phone property **Mobile** (`+614…`).

Core columns (the check fails without these):

| Column | Type | Choices the portal may send |
| --- | --- | --- |
| Name | title | |
| Mobile | phone | |
| Email | email | |
| Status | select | Applicant, Onboarding, Ready, Inactive |

Every other column below is written when it has a value. If the column is missing, that value is skipped.

| Column | Type | Choices |
| --- | --- | --- |
| Suburb | text | |
| Roles of interest | multi-select | General labourer, Trade assistant, Site clean, Materials handling, Demolition / strip-out, Concrete labourer, Asbestos removal labourer (Class B), Landscaping labourer, Other – please explain |
| Experience summary | text | |
| WhatsApp OK | checkbox | |
| Privacy consent | checkbox | |
| Date of birth | date | |
| Address | text | |
| Emergency contact | text | |
| Emergency phone | phone | |
| Preferred name | text | |
| Postcode | text | |
| Emergency relationship | select | Partner or spouse, Parent, Brother or sister, Son or daughter, Other relative, Friend, Housemate, Other – please explain |
| Experience level | select | No construction experience yet, Under 6 months, 6–12 months, 1–2 years, 3–5 years, More than 5 years, Other – please explain |
| Work history | text | |
| Available from | date | |
| Work areas | multi-select | Northern Beaches, North Shore, Sydney CBD and inner city, Eastern Suburbs, Inner West, Hills District, Parramatta and Western Sydney, South West Sydney, Sutherland Shire and St George, Central Coast, Anywhere in Greater Sydney, Other – please explain |
| Work days | multi-select | Monday through Sunday, Short notice OK. Individual weekdays are not in this column yet |
| RTW evidence | select | Australian citizen, Permanent resident, New Zealand citizen, Visa holder, Other |
| Right to work | select | Yes, No |
| VEVO consent | checkbox | |
| Visa subclass | text | |
| Visa expiry | date | |
| VEVO method | select | I'll email my VEVO result from the myVEVO app, Show my passport on a video call, Show my passport in person, Other – please explain |
| VEVO result | select | Work rights OK, Limited hours, No work rights |
| VEVO checked on | date | |
| White card | select | Yes – I have it; No; Booked in for the course. The same three are used for the other ticket selects. The screen still says "Yes, I have it" |
| Work at heights | select | same three answers |
| Asbestos class A | select | same three answers. The name uses a lowercase c |
| Asbestos class B | select | same three answers |
| Confined space | select | same three answers |
| Driver licence | select | same three answers |
| First aid | select | same three answers |
| Other tickets | text | |
| White card expiry, Work at heights expiry, Asbestos class A expiry, Asbestos class B expiry, Confined space expiry, Driver licence expiry, First aid expiry | date | |
| White card issued, Work at heights issued, Asbestos class A issued, Asbestos class B issued, Confined space issued, Driver licence issued, First aid issued | date | |
| Driver card number | text | |
| Next ticket expiry | date | |
| Other tickets held | multi-select | Asbestos awareness, Silica awareness, Manual handling, Forklift (LF), EWP over 11 m (WP licence), EWP under 11 m (yellow card), Telehandler, Dogging (DG), Basic rigging (RB), Basic scaffolding (SB), Plant ticket (excavator / skid steer / roller), Test and tag, None of these, Other – please explain |
| Transport | select | Own car, Public transport, Lift / carpool, Motorbike or bicycle, Other – please explain |
| Fitness declaration | select | Yes – I can safely do these tasks; Yes – with some adjustments (please call me); Not sure – please call me |
| Construction work in last 2 years | select | Yes, No, Not sure |
| Driver licence state | select | NSW, VIC, QLD, SA, WA, TAS, ACT, NT, Overseas, Other – please explain |
| D&A consent | checkbox | |
| Declaration | checkbox | |
| ID sighted | checkbox | |
| ID sighted method | select | Video call, In person, Service NSW app, Other |
| ID sighted on | date | |
| Allergies | select | No, Yes, I'd rather tell MS Workforce by phone |
| Allergy types | multi-select | Bee or wasp stings, Other insect bites, Foods (e.g. nuts or shellfish), Medicines (e.g. penicillin), Latex, Plants or pollen, Dust or chemicals, Other – please explain |
| Anaphylaxis risk | select | No, Yes, Not sure |
| Carries EpiPen | select | No, Yes – I always carry it, Yes – but not always |
| Medical conditions | multi-select | No, Asthma, Diabetes, Epilepsy or seizures, Heart condition, Fainting or blackouts, Hearing or vision condition that affects safety, I'd rather tell MS Workforce by phone, Other – please explain |
| Medical notes | text | |
| Injury affecting duties | select | No, Yes – a current injury, Yes – a past injury that still affects me, I'd rather tell MS Workforce by phone |
| Tasks affected | multi-select | Lifting or carrying, Bending or kneeling, Ladders or heights, Standing for long periods, Using hand or power tools, Working in heat, Other – please explain |
| Safety medication | select | No, Yes, I'd rather tell MS Workforce by phone |
| Medical sharing | select | Yes – share it with the site supervisor and first aider, Only in an emergency, Other – please explain |
| Health info consent | checkbox | |
| Policies acknowledged | checkbox | |
| Contract accepted in form | checkbox | |
| Onboarding submitted | date | |
| Terms signed | date | |
| Form status | text | For example Onboarding complete |
| Induction passed | date | |
| Site inductions | text | One line, for example `Harbour St (2026-10-02); Brookvale frame (2026-10-09)` |
| Induction score | number | |
| Induction version | text | |
| Tickets verified | checkbox | |
| Verified on | date | |
| Verified by | text | |
| Verification method | select | Sighted original, Photo in portal, Service NSW check, Video call |
| Images deleted on | date | |
| Notes | text | |

Passport numbers, tax file numbers, bank details and super are never sent to Notion.

### Placements — `NOTION_PLACEMENTS_DB`

Book labour always adds a new row. It does not update an old one. These columns are the ones the form fills. The check treats them as required.

| Column | Type | Choices |
| --- | --- | --- |
| Placement | title | Company name, en dash, suburb |
| Client | text | |
| Site contact | text | |
| Site phone | phone | |
| Site email | email | |
| Site address | text | |
| Site suburb | text | |
| Roles requested | multi-select | General labourer, Trade assistant, Site clean, Materials handling, Other |
| Labour request details | text | |
| Workers needed | number | |
| Start | date | |
| Open ended | checkbox | |
| End | date | |
| Shift | text | |
| Heard about us | select | Google, Referral / word of mouth, LinkedIn, Facebook / Instagram, Saw a worker or ute on site, Other |
| Status | select | Enquiry |
| Request source | text | Website form |

### Timesheets — `NOTION_TIMESHEETS_DB`

Draft hours are not sent. Signed hours are.

| Column | Type | Choices |
| --- | --- | --- |
| Entry | title | Worker name, en dash, date. Core |
| Status | select | Submitted, Approved, Queried. Core |
| Source | select | Portal. Core |
| Worker name | text | Core |
| Placement ID | text | Core |
| Work date | date | Core |
| Total hours | number | Core |
| Start (form) | text | |
| Finish (form) | text | |
| Break (form) | text | |
| Break start | text | |
| Hours (form) | text | |
| Tasks | text | |
| Incident reported | checkbox | |
| Incident note | text | |
| Query note | text | |
| Worker confirmed | date | |
| Approved by | text | |
| Supervisor name | text | |
| Supervisor email | email | |
| Approver role | select | Site supervisor, Site manager, Foreman / leading hand, Project manager, Owner / director, Office / admin, Other |
| Approved at | date | |
| Pay week | text | One pay week, Thursday to Wednesday. Pay fortnight is accepted until you rename that column. |
| Signer mismatch | checkbox | |
| Corrected by MS Workforce | checkbox | |

### Shift offers — `NOTION_SHIFT_OFFERS_DB`

This database does not exist until you create it. Print the plan with `npm run portal:shift-offers`. Create it only in the TEST workspace:

```bash
PORTAL_NOTION_ENV=test CONFIRM_CREATE_SHIFT_OFFERS=yes \
NOTION_TOKEN=your-test-token \
NOTION_PARENT_PAGE_ID=the-test-page-id \
NOTION_WORKERS_DB=the-test-workers-id \
NOTION_PLACEMENTS_DB=the-test-placements-id \
npm run portal:shift-offers -- --apply
```

The script refuses the live database ids. Copy the new id into `NOTION_SHIFT_OFFERS_DB`.

| Column | Type | Written by the portal? | Choices |
| --- | --- | --- | --- |
| Offer | title | Yes. Core | |
| Placement | relation to Placements | No. The script creates it | |
| Worker | relation to Workers | No. The script creates it | |
| Shift dates | date | Yes. Core | |
| Start time | text | Yes. Core | |
| Role | text | Yes. Core | |
| Rate to worker | text | Yes. Core | |
| Status | select | Yes. Core | Offered, Accepted, Declined, Expired, Cancelled |
| Suburb | text | Yes. Core | |
| Offer expires | date | Yes | |
| Sent at | date | Yes | |
| Responded at | date | Yes | |
| Decline reason | text | Yes | |
| Created by | text | Yes | |
| Address | text | Yes | |
| Site name | text | Yes | |
| Site contact | text | Yes | |
| Site phone | phone | Yes | |
| Expected hours | number | Yes | |
| Bring | text | Yes | |
| Required tickets | multi-select | Yes | White card, Work at heights, Asbestos Class A, Asbestos Class B, Confined space, First aid, Driver licence, Other ticket |

**Asbestos Class A** on a shift offer uses a capital C. **Asbestos class A** on a worker uses a lowercase c. They are different columns. Do not rename one to match the other.

### Induction — `NOTION_INDUCTION_DB`

Optional. The portal does not write a separate induction database. A pass is saved on the worker: **Induction passed** (date), **Induction score** (number), **Induction version** (text).

## Readiness check

After the variables are in Vercel, open:

`https://www.msworkforce.au/api/portal/ready`

with the header `Authorization: Bearer` and the `CRON_SECRET`. This works while the portal still says opening soon.

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.msworkforce.au/api/portal/ready
```

Once you can sign in as admin, the same list is at `/portal/admin/ready`.

The JSON has `ready`, `mode`, `config` and `connections`. Each line has a name, whether it is required, whether it is present, whether it is ok, and a short detail. Values are not included.

Connections:

- **database** — creates `portal_records` if needed, then checks the table is there.
- **notion** — calls Notion with the token, then opens each database and compares columns and choices.
- **resend** — calls Resend's domain list with the API key. It does not send an email. A sending-only key is healthy: Resend answers that list with `restricted_api_key` and "This API key is restricted to only send emails." An invalid or inactive key still fails.

`ready` is true only when every required line is ok. Optional lines, including Twilio, can be unset.

## Sign-in

Workers, and the admin, enter the email on their record. The portal emails a 6-digit code. It lasts 10 minutes. Five wrong codes lock that email for 15 minutes. An email can ask for 3 codes in 15 minutes. One connection can ask for 20 codes an hour. The code is not stored in the notification log.

The admin then enters the authenticator code. That session lasts 12 hours. A worker's session lasts 30 days.

Join and apply ask for the email twice. The two answers have to match. An empty email is refused. A mobile or email that is already on file is asked to log in instead.

There is no client account yet. Book labour already asks for an email and does not send a code. The book-labour screen still says a client login is coming.

If the three Twilio values are set later, the login screen adds **Text me a code instead**. The text path uses the same limits. Invite links can then be handed to the phone's messages app as well as email.
