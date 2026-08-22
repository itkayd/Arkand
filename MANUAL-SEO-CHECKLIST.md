# Arkand Care — Manual SEO checklist (owner actions)

Everything in this file has to be done by a person with access to the relevant
accounts. The website code is already set up for it; these are the steps we
cannot do from the codebase. Work top to bottom.

British English throughout. **Never invent or buy reviews, and never state DBS,
insurance, prices, staff numbers, or opening hours that are not true.**

---

## 1. Search Console & indexing
- [ ] Verify **https://arkandcare.co.uk** in [Google Search Console](https://search.google.com/search-console) (DNS TXT record is the most durable method).
- [ ] Set the canonical property to the **https, non-www** version. The site already 301-redirects www → non-www and http → https.
- [ ] Submit the sitemap: `https://arkandcare.co.uk/sitemap.xml`.
- [ ] Use **URL Inspection → Request indexing** for the home page, services, areas, contact, resources and the three guides.
- [ ] Repeat verification + sitemap submission in [Bing Webmaster Tools](https://www.bing.com/webmasters) (you can import from Search Console).

## 2. Google Business Profile
- [ ] Create/claim a [Google Business Profile](https://www.google.com/business/).
- [ ] Set it up as a **service-area business** covering **East London** — do **not** show the office as a place customers visit unless you intend to receive them there. Hide the street address if it is not a walk-in location.
- [ ] Category: start with **Home help service agency** / **Aged care** as fits; add companionship where available.
- [ ] Phone **020 8050 0095**, website **https://arkandcare.co.uk**, email **team@arkandcare.co.uk**.
- [ ] Do **not** upload a photo of any individual person as the founder/owner. Logo and neutral brand imagery only.

## 3. NAP consistency (Name, Address, Phone)
Use this exact, single canonical block **everywhere**:

```
Arkand Care
Office 173, 1st Floor, The Type Building, Sugar House Island, 135 High Street, London E15 2TP, United Kingdom
020 8050 0095
team@arkandcare.co.uk
https://arkandcare.co.uk
```

- [ ] **Correct the old Nextdoor listing** (and any other directory) that shows **66 Paul Street, EC2A 4NA** — that address is retired. Update to the E15 address above.
- [ ] Audit and fix: Nextdoor, Yell, Bing Places, Apple Business Connect, any care directories (e.g. homecare.co.uk), Facebook/Instagram business info, Companies House correspondence address if applicable.
- [ ] Make sure the phone number is written identically (spacing) across listings.

## 4. Reviews (honestly)
- [ ] Invite **real** clients and families to leave Google reviews — only genuine ones.
- [ ] **Do not** write, buy, incentivise, or fabricate reviews. No star ratings or testimonials go on the website until they are real and permitted.
- [ ] Respond to reviews politely, without sharing anyone's care details.

## 5. Do NOT restore the founder portrait
- [ ] The site deliberately shows a branded panel, **not** a photo of the founder or any person. Keep it that way across the website, Google Business Profile, and social — per the owner's instruction.

## 6. Baseline metrics (record before promoting)
Capture these now so you can measure progress later:
- [ ] Search Console: impressions, clicks, average position (first full week).
- [ ] Google Business Profile: calls, direction requests, website clicks.
- [ ] Any call-tracking / form submissions from the website.
- [ ] Note the date you submitted the sitemap and requested indexing.

## 7. Ongoing
- [ ] Keep the CQC wording accurate. If registration status changes, update the compliance line in every page footer, the JSON-LD, and the guides.
- [ ] When you add or change a page, update `sitemap.xml` (URL + `lastmod`) and re-run the audit script (`node seo-audit.mjs` or `python3 seo-audit.py`).
- [ ] Refresh guide `dateModified` / "Reviewed" dates when you revise them.
