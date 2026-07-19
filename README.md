# Arkand Care — Website

A warm, premium marketing website for **Arkand Care Ltd** — companionship and
help at home for older people and their families.

> *Delivered with dignity.*

Built with **Vite**, **GSAP + ScrollTrigger** (scroll animation), **Lenis**
(smooth scroll) and **Three.js** (the 3D “A” hero). The output is a fully
static site — no server, database, or backend — designed to be uploaded
straight into Hostinger’s `public_html`.

---

## Contents

- [Quick start](#quick-start)
- [Building for production](#building-for-production)
- [Deploying to Hostinger](#deploying-to-hostinger)
- [The contact form (Formspree)](#the-contact-form-formspree)
- [Project structure](#project-structure)
- [Editing content & brand](#editing-content--brand)
- [Compliance notes (please read)](#compliance-notes-please-read)
- [Accessibility & performance](#accessibility--performance)
- [Browser support & graceful fallbacks](#browser-support--graceful-fallbacks)

---

## Quick start

You’ll need **Node.js 18+** installed.

```bash
npm install     # install dependencies
npm run dev     # start the local dev server (http://localhost:5173)
```

Open the printed URL in your browser. Changes to HTML/CSS/JS reload instantly.

---

## Building for production

```bash
npm run build   # outputs an optimised static site into dist/
npm run preview # preview the built dist/ locally before uploading
```

Everything you upload to your host lives in **`dist/`** after a build.

> A pre-built `dist/` is already included in this repository, so you can deploy
> immediately without running a build. Re-run `npm run build` whenever you
> change any content.

---

## Deploying to Hostinger

This is a static site, so deployment is just copying files.

1. Run `npm run build` (or use the `dist/` folder already provided).
2. Log in to **Hostinger → hPanel → Files → File Manager**.
3. Open the **`public_html`** folder.
4. Upload **the contents of `dist/`** (not the `dist` folder itself) — i.e.
   `index.html`, `about.html`, the `assets/` folder, `favicon.svg`,
   `arkand-logo.png`, `robots.txt`, `sitemap.xml`, etc. — directly into
   `public_html`.
   - Tip: zip the contents of `dist/`, upload the zip, then use File
     Manager’s **Extract** to unzip in place. Delete the zip afterwards.
5. Visit your domain. That’s it.

**Updating later:** rebuild, then re-upload the contents of `dist/`, overwriting
the old files.

### A note on the sitemap / URLs

`public/robots.txt` and `public/sitemap.xml` reference
`https://arkandcare.co.uk`. If the live domain differs, edit those two files
(and the `<link rel="canonical">` / Open Graph URLs in each HTML page) before
building.

---

## The contact form (Formspree)

The contact form (on **`contact.html`**) submits via
[Formspree](https://formspree.io) using AJAX, so visitors stay on the page and
see a friendly confirmation message. It also degrades gracefully — if
JavaScript is off, it falls back to a standard form POST.

**The endpoint is already wired in** to the Formspree form provided:

```
https://formspree.io/f/maqrqdvk
```

### To use a different Formspree inbox

1. Create a form at [formspree.io](https://formspree.io) and copy your endpoint
   (it looks like `https://formspree.io/f/xxxxxxxx`).
2. Open **`contact.html`** and find the form:

   ```html
   <form class="form" data-contact-form
         action="https://formspree.io/f/maqrqdvk"
         method="POST" data-reveal>
   ```

3. Replace the `action` URL with your own endpoint.
4. Rebuild (`npm run build`) and re-upload.

The first time a real submission comes through, Formspree emails you to confirm
the address that receipts should go to.

> **Prefer no third-party service?** You can instead point the form at a
> `mailto:` address (e.g. `action="mailto:team@arkandcare.co.uk"`). The script
> detects `mailto:` and lets the browser handle it. Note that `mailto:` opens
> the visitor’s email app rather than sending silently, and is less reliable —
> Formspree (or [Web3Forms](https://web3forms.com)) is recommended.

---

## Project structure

```
arkand-care/
├── index.html              # Home (3D hero, scrollytelling, "what help?" chooser)
├── about.html              # Our story, values, honest CQC position
├── services.html           # Companionship & help at home; "coming soon" section
├── why-arkand.html         # Reasons to choose Arkand; testimonials
├── contact.html            # Contact methods + Formspree form
├── join-us.html            # Careers / recruitment
│
├── public/                 # Copied verbatim into dist/
│   ├── favicon.svg         # The "A" mark favicon
│   ├── arkand-logo.png     # Logo (apple-touch-icon / social share)
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── styles/
│   │   └── main.css        # Full design system (brand tokens, components, responsive)
│   └── js/
│       ├── main.js         # Smooth scroll, reveals, nav, chooser, form, transitions
│       └── hero3d.js       # Three.js 3D "A" hero (lazy-loaded, with fallback)
│
├── vite.config.js          # Multi-page build config
├── package.json
└── dist/                   # Built, ready-to-upload output (generated)
```

---

## Editing content & brand

- **Text content** lives directly in the `*.html` files — edit in plain HTML.
- **Brand colours, fonts and spacing** are CSS custom properties at the top of
  `src/styles/main.css` (the `:root { … }` block). Change a value once and it
  updates everywhere. For example:

  ```css
  --forest: #1B3028;   /* primary green   */
  --gold:   #B8892A;   /* accent gold     */
  ```

- **Fonts** are loaded from Google Fonts in each page’s `<head>`
  (Playfair Display, DM Sans, Cormorant Garamond).
- **The interactive “What kind of help?” chooser** copy is defined in
  `CHOOSER_CONTENT` in `src/js/main.js`.
- **The “A day with Arkand” scrolly panels** are plain HTML in `index.html`
  under `<section class="scrolly" …>`.
- **How it works** (`#how-it-works`) and the **FAQ** (`#faq`) are plain HTML in
  `index.html`. The FAQ uses native `<details>`/`<summary>` — it works without
  JavaScript and is fully keyboard-accessible. Add a question by copying a
  `<details class="faq-item">…</details>` block.

### The Guide (3D companion) & motion preferences

Every page shows **the Guide** — a small 3D Arkand “A” mark that travels gently
down the side of the page as you scroll and nods toward each section, quietly
showing you where to read (it never displays text). It’s defined in
`src/js/companion3d.js` and wired up in `src/js/main.js` (`initGuide`).

On a first visit the Guide offers **calmer motion** for accessibility. The
choice is remembered (as a lightweight preference only) and can be changed any
time via the **“Prefer calmer motion?”** toggle in the footer. Calmer motion:

- respects the operating-system “reduce motion” setting automatically;
- stills the Guide, stops smooth scrolling, and reveals all content without
  animation;
- can be turned on mid-visit with no page reload.

If WebGL is unavailable or motion is reduced, the Guide falls back to a calm,
static branded mark — the site always works perfectly either way.

### Contact form — stays on your site

The form **never redirects the visitor to another website**. It submits quietly
in the background (AJAX) and shows a warm confirmation in place. As a safety net
for the rare no-JavaScript case, a hidden `_next` field returns the visitor to
`contact.html` on your own domain — update that domain in `contact.html` if you
host the site elsewhere.

### Adding real photos

The warm illustrations sit in **photo-ready frames** (`<figure class="media-frame">`
in `index.html` and `about.html`). To use a real, licensed photograph instead,
replace the inline `<svg class="illus">…</svg>` with:

```html
<img class="media-photo" src="your-photo.jpg"
     alt="A short, warm description of the photo" loading="lazy">
```

The image will cover the frame automatically. Keep `alt` text descriptive for
screen-reader users, and compress photos (e.g. ~1600px wide, WebP/JPEG) for fast
loading. You can add more frames anywhere using the same `.split` + `.media-frame`
pattern.

After any change, run `npm run build` and re-upload `dist/`.

---

## Compliance notes (please read)

This site was built to specific, legally-important rules. Please keep them in
mind when editing:

- ✅ **Only companionship & help at home** are advertised as available **now**.
- 🚫 **Never** state or imply “CQC registered / regulated / approved provider.”
  Personal care, dementia support, medication, night care and hospital
  discharge appear **only** in the clearly-labelled
  *“Coming soon — subject to CQC registration”* sections.
- 🚫 **No pricing** anywhere — the site invites a friendly, no-obligation chat
  instead.
- 🚫 **No named service areas / towns / regions** — location language is kept
  open (“wherever you are”).
- ✅ Testimonials are companionship/home-help focused and modest.

If in doubt about any new claim, leave it out.

---

## Accessibility & performance

- **WCAG 2.1 AA-minded:** semantic HTML, labelled form fields, visible focus
  states, a skip link, `aria-current` navigation, `alt`/`aria-label` on
  graphics, and body text ≥ 17px with generous line-height.
- **Reduced motion:** everything respects `prefers-reduced-motion` — smooth
  scroll, reveals, the 3D hero and the custom cursor all switch off, and content
  is shown statically.
- **Keyboard friendly:** all interactive elements are reachable and operable by
  keyboard.
- **Performance:** Three.js is **lazy-loaded** and only initialises on the home
  hero when real (hardware) WebGL is available, so other pages stay light. The
  hero pauses rendering when scrolled out of view.

---

## Browser support & graceful fallbacks

Works in current Chrome, Safari, Firefox, Edge and mobile browsers.

The 3D hero **always** has a graceful fallback: if WebGL is unavailable, the
device is low-powered, the visitor prefers reduced motion, or rendering fails
for any reason, a static branded panel (the “A” mark on a warm gradient) is
shown instead — no errors, no broken visuals.

---

*Company No. 17291178 · Companionship & home help · Personal care coming soon,
subject to CQC registration.*
