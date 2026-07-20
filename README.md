# Arkand Care — website

Static marketing site for **Arkand Care Ltd** — founder-led home care in
Chelmsford and the surrounding Essex villages. *Delivered with dignity.*

Design system: **"Light through the door"** — warm forest-green and gold
glass, built around the idea of a threshold: the moment a door opens and a
stranger is trusted to come in.

## Stack

No framework, no build step, no CDN. Plain HTML, one CSS file, one small JS
file. Deploys as-is to Vercel (or any static host) from the repository root.

```
index.html            Home (8 sections: hero, services, founder, a day at
                      home, whole family, pricing, CQC + coming soon, contact)
about.html            The complete About page
services.html         Services + pricing terms + CQC/coming-soon + FAQ
areas.html            Chelmsford + 10 villages, distinct local content each
join-us.html          Recruitment
contact.html          Enquiry form (with consent + privacy link)
privacy.html          Privacy Notice (UK GDPR, special-category data)
accessibility.html    Accessibility statement
complaints.html       Complaints & safeguarding
sitemap.xml  robots.txt
assets/
  css/arkand.css      the single stylesheet
  js/arkand.js        the single script (drawer, hero, reveals, form validation)
  fonts/*.woff2       self-hosted Playfair Display, DM Sans, Cormorant Garamond
  img/                arkand-mark.png (logo), mark-glyph.svg (hero mask),
                      favicon.svg, founder.jpg, og.png (1200×630)
```

## Deploying to Vercel

The site is static files at the repo root — no configuration needed. Point a
Vercel project at this repository and it will serve `index.html` and friends
directly. All internal links and asset paths are **root-relative** (`/assets/…`,
`/about.html`), so they resolve correctly when served from the domain root.

> **Local preview:** open the site through a local web server, not `file://`,
> or the root-relative paths won't resolve. For example:
> `python3 -m http.server` then visit `http://localhost:8000`.

## What still needs filling in / confirming

These are the only open items. Everything else is production copy — no lorem,
no placeholders in shipped text.

1. **Domain / canonical.** Canonicals, Open Graph URLs, `sitemap.xml` and
   `robots.txt` all point at `https://arkandcare.co.uk`. Make sure that domain
   is the one Vercel serves (add it as a custom domain) so the canonicals
   resolve. If you launch on a different domain, find-and-replace
   `https://arkandcare.co.uk` across the HTML, `sitemap.xml` and `robots.txt`.

2. **Enquiry form endpoint.** The contact form has no backend. As shipped it
   validates in the browser and shows a confirmation message; it does **not**
   deliver the enquiry anywhere yet. Wire it up before launch — e.g. add an
   `action="…"` pointing at a form handler (Formspree, a Vercel serverless
   function, etc.). The client-side validation in `assets/js/arkand.js` runs
   first and then submits normally once an `action` is present. Because the
   form can carry health information, make sure the handler stores/transmits it
   securely and that its data handling matches the Privacy Notice.

3. **Opening hours.** The JSON-LD advertises `Mo-Su 08:00-20:00` as a
   reasonable default. Confirm these are the hours you want published, or edit
   the `openingHours` value in each page's structured data.

4. **Founder photograph.** `assets/img/founder.jpg` is the supplied portrait.
   If you replace it, keep it roughly square (it's displayed 1:1).

## Compliance notes (please keep these intact)

This site is written to specific legal/regulatory constraints. If you edit
copy, preserve them:

- **No claim of CQC registration.** Arkand is **not** CQC-registered. The site
  never states or implies otherwise. Regulated services (personal care,
  dementia, medication, night care, hospital discharge) appear **only** in the
  visually separate *"Coming soon — subject to CQC registration"* block, never
  alongside live services, and **never with a date or timeline**.
- **No prices** anywhere — including structured data. Pricing is explained as
  *terms* ("How our pricing works") and the number is discussed in person.
- **No invented testimonials, reviews, ratings or statistics.**
- **One person only** is named or implied across the whole site: the founder,
  **Abdelkadir Abdirahman**, described as *director and registered manager*.
- **Meal preparation scope** is stated honestly: toaster, microwave and air
  fryer only — no oven, no hob, no flame.
- Statutory trading disclosures (company name, no. 17291178, "Registered in
  England and Wales", registered office) are in the footer of every page.
- Contact address is **team@arkandcare.co.uk** sitewide.

## Accessibility & performance

- Body text ≥ 17px; visible gold focus rings; 48px minimum tap targets; zoom
  never disabled; one `<h1>` and one `<nav>` landmark per page; skip link.
- Honours `prefers-reduced-motion` (animations off) and
  `prefers-reduced-transparency` (glass becomes solid), plus an
  `@supports` fallback where `backdrop-filter` is unsupported.
- Fonts self-hosted as `woff2` with `font-display: swap`; one weight of each
  family preloaded. No blur radius is ever animated; glass surfaces are kept
  to a small count per view.
