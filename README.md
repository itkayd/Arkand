# Arkand Care — website

The live Arkand Care website. Plain, fast static HTML/CSS/JS — **no build step**.
Just upload the files.

## Structure
```
index.html  about.html  services.html  areas.html  join-us.html  contact.html
privacy.html  accessibility.html  complaints.html  404.html
assets/
  css/arkand.css        one stylesheet
  js/arkand.js          small progressive-enhancement script
  fonts/*.woff2         self-hosted, preloaded
  img/*                 logo mark, favicon, apple-touch-icon, og.jpg
.htaccess               caching + compression for Apache/LiteSpeed (Hostinger)
vercel.json             static config for Vercel (no build)
robots.txt  sitemap.xml
```

## Editing
- **Service area:** East London (no towns/boroughs named). Appears in copy, meta,
  footer and JSON-LD `areaServed`.
- **Office address:** Office 173, 1st Floor, The Type Building, Sugar House Island,
  135 High Street, London E15 2TP — shown on the Contact page and every footer,
  with a Google Maps directions link. It's one canonical string; search for
  `E15 2TP` to find every instance.
- **Contact form** posts to Formspree and shows a thank-you in place (no redirect).
  Change the inbox by editing the form `action` in `contact.html`.
- **No photographs of people** are used anywhere.

## Deploy
- **Hostinger:** upload the contents of this folder into `public_html`
  (include the hidden `.htaccess`). No Node/build needed.
- **Vercel:** static — `vercel.json` disables the build and serves the files.
