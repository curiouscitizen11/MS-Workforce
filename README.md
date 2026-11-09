# MS Workforce Website

Simple, professional marketing website for MS Workforce – construction labour hire across Sydney.

## Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Deployed free on Vercel

## Colours
- Navy: `#0A2540`
- Teal: `#0D9488`

## Getting Started

```bash
cd msworkforce-website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel
1. Push this folder to a GitHub repository (or import directly).
2. Go to vercel.com → New Project → Import the repo.
3. Deploy. You get a free `.vercel.app` URL immediately.
4. The live site is already at [www.msworkforce.au](https://www.msworkforce.au). Do not change DNS.

## Pages
- `/` – Home
- `/services` – Services
- `/clients` – For Clients
- `/candidates` – For Candidates
- `/about` – About + Values
- `/contact` – Contact

## Notes
- Logo is currently text-based in the header for simplicity. You can replace it with the geometric logo image later.
- Contact form is currently a simple email prompt (can be upgraded with Formspree, Resend, or similar once ready).
- All content is realistic for a new labour hire company focused on construction, safety and straightforward service.

## Photos and phone number (hidden until filled in)
- **Photos:** put the image files in `public/photos/` (create the folder), then add one entry per photo to the `photos` list in `data/photos.ts` (`src: "/photos/name.jpg"`, plus a required `alt` description). With the list empty, no photo section shows. Photos appear on the home page, between "Where we work" and the two final buttons.
- **Phone / WhatsApp:** set `PHONE` and `WHATSAPP` in `data/contact.ts`. While empty, no button shows. When set, the buttons appear on the Contact page, under Book labour. Both are empty today.
