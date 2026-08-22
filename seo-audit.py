#!/usr/bin/env python3
"""
Arkand Care — static SEO audit.

Run from the site root:  python3 seo-audit.py
Exits non-zero if any check fails, so it can gate a deploy in CI.

Checks:
  * every page has exactly one <title>, one <h1>, a canonical link,
    a meta description, and og:title / og:description / og:image
  * titles are unique across the site
  * every JSON-LD block parses as valid JSON
  * internal links (href="/..." and relative) point at files that exist
  * no stale location words (Chelmsford, Essex, boroughs, old EC2A address)
  * the retired "Registered Manager" wording is gone
  * sitemap.xml lists only URLs that map to real files, and every
    indexable page is in the sitemap
"""

import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "https://arkandcare.co.uk"

# Pages that should exist and be indexable (in sitemap). 404 is excluded.
NOINDEX_FILES = {"404.html"}

STALE_WORDS = [
    r"\bChelmsford\b",
    r"\bEssex\b",
    r"\bRegistered Manager\b",
    r"66 Paul Street",
    r"EC2A\s*4NA",
    r"\bHavering\b",
    r"\bRedbridge\b",   # borough-name targeting we deliberately dropped
]

errors = []
warnings = []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def html_files():
    out = []
    for dirpath, _dirs, files in os.walk(ROOT):
        if "/.git" in dirpath:
            continue
        for f in files:
            if f.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, f), ROOT)
                out.append(rel)
    return sorted(out)


class Extract(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles = 0
        self.h1 = 0
        self.canonical = None
        self.meta = {}
        self.og = {}
        self.links = []
        self._in_title = False
        self._in_ld = False
        self.ld_blocks = []
        self._ld_buf = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.titles += 1
            self._in_title = True
        elif tag == "h1":
            self.h1 += 1
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        elif tag == "meta":
            if a.get("name") == "description":
                self.meta["description"] = a.get("content", "")
            if a.get("property", "").startswith("og:"):
                self.og[a["property"]] = a.get("content", "")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld = True
            self._ld_buf = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_ld:
            self._in_ld = False
            self.ld_blocks.append(self._ld_buf)

    def handle_data(self, data):
        if self._in_title:
            pass
        if self._in_ld:
            self._ld_buf += data


def check_internal_link(href, from_file):
    # Ignore external, anchors, mailto, tel.
    if re.match(r"^(https?:)?//", href) or href.startswith(("mailto:", "tel:", "#", "javascript:")):
        return
    path = href.split("#", 1)[0].split("?", 1)[0]
    if path == "" or path == "/":
        target = "index.html"
    elif path.startswith("/"):
        target = path.lstrip("/")
    else:
        # relative to the file's directory
        target = os.path.normpath(os.path.join(os.path.dirname(from_file), path))
    # Directory-style URL -> index.html
    if target.endswith("/"):
        target = target + "index.html"
    full = os.path.join(ROOT, target)
    if not os.path.exists(full):
        # Allow asset files and known roots
        fail(f"{from_file}: broken internal link -> {href} (expected {target})")


def main():
    files = html_files()
    seen_titles = {}
    indexable = set()

    for rel in files:
        with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            src = fh.read()

        p = Extract()
        p.feed(src)

        # title
        m = re.search(r"<title>(.*?)</title>", src, re.S)
        title = m.group(1).strip() if m else ""
        if p.titles != 1:
            fail(f"{rel}: expected exactly one <title>, found {p.titles}")
        if title:
            if title in seen_titles:
                fail(f"{rel}: duplicate <title> shared with {seen_titles[title]}: {title!r}")
            seen_titles[title] = rel

        # h1
        if p.h1 != 1:
            fail(f"{rel}: expected exactly one <h1>, found {p.h1}")

        # noindex handling
        is_noindex = rel in NOINDEX_FILES or 'name="robots" content="noindex"' in src
        if not is_noindex:
            indexable.add(rel)

        # canonical + meta + og (indexable pages only)
        if not is_noindex:
            if not p.canonical:
                fail(f"{rel}: missing canonical link")
            if not p.meta.get("description"):
                fail(f"{rel}: missing meta description")
            for key in ("og:title", "og:description", "og:image"):
                if not p.og.get(key):
                    fail(f"{rel}: missing {key}")

        # JSON-LD validity
        for block in p.ld_blocks:
            try:
                json.loads(block)
            except json.JSONDecodeError as e:
                fail(f"{rel}: invalid JSON-LD ({e})")

        # internal links
        for href in p.links:
            check_internal_link(href, rel)

        # stale words
        for pat in STALE_WORDS:
            if re.search(pat, src):
                fail(f"{rel}: stale/forbidden text matches /{pat}/")

    # ---- sitemap cross-check ----
    sm_path = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(sm_path):
        fail("sitemap.xml is missing")
    else:
        sm = open(sm_path, encoding="utf-8").read()
        locs = re.findall(r"<loc>(.*?)</loc>", sm)
        sm_files = set()
        for loc in locs:
            if not loc.startswith(BASE):
                fail(f"sitemap: URL not on canonical host: {loc}")
                continue
            path = loc[len(BASE):]
            target = "index.html" if path in ("", "/") else path.lstrip("/")
            sm_files.add(target)
            if not os.path.exists(os.path.join(ROOT, target)):
                fail(f"sitemap: {loc} has no matching file ({target})")
            if target in NOINDEX_FILES:
                fail(f"sitemap: lists a noindex page: {loc}")

        for rel in indexable:
            if rel not in sm_files:
                warn(f"sitemap: indexable page not listed: {rel}")

    # ---- report ----
    print(f"Scanned {len(files)} HTML files.")
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  FAIL  {e}")
    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s). FAILED.")
        sys.exit(1)
    print(f"\nOK — 0 errors, {len(warnings)} warning(s).")


if __name__ == "__main__":
    main()
