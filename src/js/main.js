/* ==========================================================================
   ARKAND CARE — Main behaviour
   Warm, silky motion built on Lenis (smooth scroll) + GSAP/ScrollTrigger.
   Everything degrades gracefully: with JS off the content is fully readable,
   and with reduced-motion the flourishes quietly switch off.
   ========================================================================== */

import '../styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------------------------------------
   Motion preference — combines the OS setting with the visitor's own choice
   (offered by the guide on first visit). Stored as a gentle preference only;
   the site is fully usable without it.
   -------------------------------------------------------------------------- */
const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const MOTION_KEY = 'arkand-motion';

function readMotionPref() {
  try { return localStorage.getItem(MOTION_KEY); } catch (e) { return null; }
}
function writeMotionPref(v) {
  try { localStorage.setItem(MOTION_KEY, v); } catch (e) { /* private mode — ignore */ }
}

let motionPref = readMotionPref();                 // 'reduced' | 'full' | null
let prefersReduced = osReduced || motionPref === 'reduced';

/* --------------------------------------------------------------------------
   1. Smooth scrolling (Lenis) — soft, warm easing
   -------------------------------------------------------------------------- */
let lenis = null;
let lenisRaf = null;
function initSmoothScroll() {
  if (prefersReduced) return;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // gentle exponential ease-out
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);
  // Guard against a torn-down Lenis (e.g. when the visitor switches to
  // calmer motion mid-session) so the ticker never touches a null instance.
  lenisRaf = (time) => { if (lenis) lenis.raf(time * 1000); };
  gsap.ticker.add(lenisRaf);
  gsap.ticker.lagSmoothing(0);

  // In-page anchor links glide smoothly.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -90, duration: 1.4 });
        }
      }
    });
  });
}

/* --------------------------------------------------------------------------
   2. Header — condense on scroll, toggle dark/light over hero
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   3. Mobile menu
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

/* --------------------------------------------------------------------------
   4. Scroll reveals — text & elements rise/fade in with staggered timing
   -------------------------------------------------------------------------- */
function initReveals() {
  if (prefersReduced) {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger] > *').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }

  // Single elements
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => el.classList.add('is-visible'),
    });
  });

  // Staggered groups
  gsap.utils.toArray('[data-reveal-stagger]').forEach((group) => {
    const items = group.children;
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  });
}

/* --------------------------------------------------------------------------
   5. Parallax layers
   -------------------------------------------------------------------------- */
function initParallax() {
  if (prefersReduced) return;
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const depth = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: -depth * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('[data-parallax-scope]') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}

/* --------------------------------------------------------------------------
   6. Animated counters
   -------------------------------------------------------------------------- */
function initCounters() {
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.decimals && parseInt(el.dataset.decimals)) || 0;
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
        });
      },
    });
  });
}

/* --------------------------------------------------------------------------
   7. Magnetic buttons + warm card glow
   -------------------------------------------------------------------------- */
function initMagnetic() {
  if (prefersReduced || isTouch) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.35;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });

  // Cards: gold glow follows the cursor.
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/* --------------------------------------------------------------------------
   8. Custom cursor dot (fine-pointer desktops only)
   -------------------------------------------------------------------------- */
function initCursor() {
  if (prefersReduced || isTouch) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  let active = false;
  const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    if (!active) { active = true; dot.classList.add('is-active'); }
    xTo(e.clientX);
    yTo(e.clientY);
  });
  window.addEventListener('mouseleave', () => dot.classList.remove('is-active'));

  const hoverables = 'a, button, .card, .chooser-option, [data-magnetic]';
  document.querySelectorAll(hoverables).forEach((el) => {
    el.addEventListener('pointerenter', () => dot.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => dot.classList.remove('is-hover'));
  });
}

/* --------------------------------------------------------------------------
   9. "A day with Arkand" pinned scrollytelling
   -------------------------------------------------------------------------- */
function initScrolly() {
  const scrolly = document.querySelector('[data-scrolly]');
  if (!scrolly) return;
  const panels = gsap.utils.toArray('.scrolly-panel', scrolly);
  const bars = gsap.utils.toArray('.scrolly-progress span i', scrolly);
  if (!panels.length) return;

  if (prefersReduced) {
    panels.forEach((p) => (p.style.opacity = 1));
    return;
  }

  // Show first panel immediately.
  gsap.set(panels[0], { opacity: 1 });

  const sticky = scrolly.querySelector('.scrolly-sticky');
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scrolly,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
    },
  });

  panels.forEach((panel, i) => {
    if (i === 0) {
      if (bars[0]) gsap.set(bars[0], { scaleX: 1 });
      return;
    }
    const prev = panels[i - 1];
    tl.to(prev, { opacity: 0, y: -40, duration: 0.5 }, i)
      .fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, i)
      .to(bars[i - 1] || {}, { scaleX: 0, duration: 0.5 }, i)
      .to(bars[i] || {}, { scaleX: 1, duration: 0.5 }, i);
  });
}

/* --------------------------------------------------------------------------
   10. "What kind of help are you looking for?" chooser
   -------------------------------------------------------------------------- */
const CHOOSER_CONTENT = {
  company: {
    title: 'A friendly face and good company',
    body: 'If the days feel a little quiet, our companionship visits bring warmth, conversation and a familiar face — someone to share a cup of tea, a hobby, or a gentle walk with.',
    tags: ['Conversation & company', 'Hobbies & games', 'Accompanied walks', 'Outings & appointments'],
    cta: 'Talk to us about companionship',
  },
  home: {
    title: 'A helping hand around the home',
    body: 'When everyday jobs get harder, we lend a hand — keeping things tidy, the laundry done and the fridge stocked, so home stays comfortable and calm.',
    tags: ['Light cleaning & tidying', 'Laundry & ironing', 'Shopping & prescriptions', 'Meals & snacks'],
    cta: 'Talk to us about help at home',
  },
  respite: {
    title: 'A well-earned break for family carers',
    body: 'Caring for someone you love is a labour of love — but everyone needs a rest. We step in with warm, companionship-based sitting so you can take the time you need.',
    tags: ['Companionship sitting', 'Flexible visits', 'Peace of mind', 'Regular or one-off'],
    cta: 'Talk to us about respite',
  },
  future: {
    title: 'Personal care — coming soon',
    body: 'We’re completing our CQC registration so we can offer personal care in the future. It isn’t available just yet, but we’d be glad to note your interest and keep you posted.',
    tags: ['Subject to CQC registration', 'Register your interest'],
    cta: 'Register your interest',
    note: true,
  },
};

function initChooser() {
  const chooser = document.querySelector('[data-chooser]');
  if (!chooser) return;
  const options = chooser.querySelectorAll('.chooser-option');
  const result = chooser.querySelector('[data-chooser-result]');
  if (!result) return;

  const render = (key) => {
    const c = CHOOSER_CONTENT[key];
    if (!c) return;
    const tags = c.tags.map((t) => `<li>${t}</li>`).join('');
    result.innerHTML = `
      <div class="result-inner">
        <h3>${c.title}</h3>
        <p>${c.body}</p>
        <ul>${tags}</ul>
        <a class="btn" href="contact.html">${c.cta} <span class="arrow" aria-hidden="true">→</span></a>
      </div>`;
    // Trigger the fade-in on next frame.
    requestAnimationFrame(() => {
      const inner = result.querySelector('.result-inner');
      inner && inner.classList.add('show');
    });
  };

  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      options.forEach((o) => o.setAttribute('aria-pressed', 'false'));
      opt.setAttribute('aria-pressed', 'true');
      render(opt.dataset.help);
    });
  });

  // Pre-select the first option so the panel is never empty.
  if (options[0]) {
    options[0].setAttribute('aria-pressed', 'true');
    render(options[0].dataset.help);
  }
}

/* --------------------------------------------------------------------------
   11. Hero headline reveal + parallax content
   -------------------------------------------------------------------------- */
function initHeroReveal() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const content = hero.querySelector('.hero-content');
  if (!content) return;

  if (!prefersReduced) {
    const items = content.querySelectorAll('[data-hero-item]');
    gsap.set(items, { opacity: 0, y: 34 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.14,
      delay: 0.25,
    });

    // Content drifts up slightly as you scroll past the hero.
    gsap.to(content, {
      yPercent: -12,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* --------------------------------------------------------------------------
   12. Contact form (Formspree / AJAX) with friendly inline status
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('[type="submit"]');
  const endpoint = form.getAttribute('action') || '';
  const isMailto = endpoint.startsWith('mailto:');

  const setStatus = (msg, type) => {
    if (!status) return;
    status.textContent = msg;
    status.className = `form-status is-${type}`;
    // Bring the message into view kindly, without a jarring jump.
    status.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
  };

  // If a no-JS visitor was returned via ?sent=1, greet them warmly.
  if (/[?&]sent=1\b/.test(window.location.search)) {
    setStatus('Thank you — your message is on its way. We’ll be in touch very soon, with warmth and no obligation.', 'success');
  }

  form.addEventListener('submit', async (e) => {
    // ALWAYS handle the submission ourselves so the visitor is never taken
    // away to another website — they stay right here and see a warm reply.
    e.preventDefault();

    // mailto: endpoints simply open the visitor's email app (no redirect).
    if (isMailto) { window.location.href = endpoint; return; }

    if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
      setStatus('This form isn’t connected yet. Please call us on 020 8050 0095 or email team@arkandcare.co.uk and we’ll help straight away.', 'error');
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'Sending…'; }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        // Accept: application/json tells Formspree/Web3Forms to reply with
        // JSON instead of redirecting to their own thank-you page.
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        setStatus('Thank you — your message is on its way. We’ll be in touch very soon, with warmth and no obligation.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data && data.errors ? data.errors.map((x) => x.message).join(', ') : 'something went wrong';
        setStatus(`Sorry, we couldn’t send that (${msg}). Please call us on 020 8050 0095 and we’ll help straight away.`, 'error');
      }
    } catch (err) {
      setStatus('Sorry, there was a connection problem. Please call us on 020 8050 0095 and we’ll help straight away.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || 'Send message'; }
    }
  });
}

/* --------------------------------------------------------------------------
   13. Gentle page-transition curtain on internal navigation
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  if (prefersReduced) return;
  const curtain = document.querySelector('.page-curtain');
  if (!curtain) return;
  const mark = curtain.querySelector('svg');

  // Reveal (curtain rises away) on load.
  gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
  gsap.set(mark, { opacity: 1 });
  const intro = gsap.timeline();
  intro.to(mark, { opacity: 0, duration: 0.3, delay: 0.15 })
       .to(curtain, { scaleY: 0, duration: 0.7, ease: 'power3.inOut', transformOrigin: 'top' }, '-=0.1')
       .set(curtain, { visibility: 'hidden' });

  const sameOrigin = (href) => {
    try { const u = new URL(href, location.href); return u.origin === location.origin; }
    catch { return false; }
  };

  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (a.target === '_blank' || !sameOrigin(href)) return;
    if (href.replace('./', '') === location.pathname.split('/').pop()) return; // same page

    a.addEventListener('click', (e) => {
      e.preventDefault();
      curtain.style.visibility = 'visible';
      const tl = gsap.timeline({ onComplete: () => (window.location.href = href) });
      tl.set(curtain, { transformOrigin: 'bottom' })
        .to(curtain, { scaleY: 1, duration: 0.55, ease: 'power3.inOut' })
        .to(mark, { opacity: 1, duration: 0.25 }, '-=0.25');
    });
  });

  // Restore on back/forward cache.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(curtain, { scaleY: 0, visibility: 'hidden' });
      gsap.set(mark, { opacity: 0 });
    }
  });
}

/* --------------------------------------------------------------------------
   14. Hero 3D (lazy) — dynamic import keeps Three.js off other pages' path
   -------------------------------------------------------------------------- */
async function initHero3DIfPresent() {
  const wrap = document.querySelector('[data-hero3d]');
  if (!wrap) return;
  const fallback = wrap.querySelector('.hero-fallback');
  try {
    const { initHero3D } = await import('./hero3d.js');
    const controller = await initHero3D(wrap, {
      onReady: () => {
        // Fade the static fallback out once the 3D is drawing.
        if (fallback) {
          fallback.style.transition = 'opacity 1s ease';
          fallback.style.opacity = '0';
          setTimeout(() => { fallback.style.display = 'none'; }, 1000);
        }
      },
      onFallback: () => {
        // Rendering failed mid-run — gracefully bring the branded panel back.
        if (fallback) {
          fallback.style.display = '';
          fallback.style.transition = 'opacity 0.8s ease';
          fallback.style.opacity = '1';
        }
      },
    });
    if (!controller && fallback) {
      fallback.style.opacity = '1'; // keep graceful fallback
    }
  } catch (e) {
    // Any failure → the static branded fallback simply remains.
  }
}

/* --------------------------------------------------------------------------
   15. Footer year
   -------------------------------------------------------------------------- */
function initYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* --------------------------------------------------------------------------
   16. The Guide — a 3D Arkand "A" companion that travels down every page as
       you scroll, showing you where to read. On first visit it gently offers
       calmer motion (accessibility). Static & silent when motion is reduced.
   -------------------------------------------------------------------------- */
let companion = null;

function buildGuideDOM() {
  const existing = document.querySelector('[data-guide]');
  if (existing) return existing;
  const guide = document.createElement('div');
  guide.className = 'guide';
  guide.setAttribute('data-guide', '');
  guide.setAttribute('aria-hidden', 'true');
  guide.innerHTML = `
    <div class="guide-rail">
      <div class="guide-mark" data-guide-mark>
        <svg class="guide-fallback" viewBox="0 0 80 88" xmlns="http://www.w3.org/2000/svg">
          <path d="M 2 86 L 40 8 L 44 16 L 20 86 Z" fill="#F1EAD9"/>
          <path d="M 78 86 L 40 8 L 36 16 L 60 86 Z" fill="#F1EAD9"/>
          <path d="M 36 16 L 40 8 L 44 16 Z" fill="#B8892A"/>
          <rect x="9" y="51.5" width="62" height="3.5" fill="#B8892A"/>
        </svg>
      </div>
    </div>`;
  document.body.appendChild(guide);
  return guide;
}

function initGuideScroll(markEl) {
  const rail = markEl.parentElement;
  let lastY = window.scrollY;
  let raf = 0;
  const apply = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const travel = Math.max(0, rail.clientHeight - markEl.offsetHeight);
    markEl.style.transform = `translateY(${p * travel}px)`;
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    if (companion) companion.setLean(Math.max(-1, Math.min(1, dy / 45)));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', apply);
  apply();

  // Nod toward each heading as it comes into reading position.
  const heads = document.querySelectorAll('main h2, main h3');
  if (heads.length) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && companion) companion.nudge(1); });
    }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
    heads.forEach((h) => nio.observe(h));
  }
}

async function initGuide() {
  const guide = buildGuideDOM();
  const markEl = guide.querySelector('[data-guide-mark]');
  requestAnimationFrame(() => guide.classList.add('show'));

  if (prefersReduced) {
    // A calm, still presence — no travel, no spin.
    guide.classList.add('is-static');
    markEl.style.transform = 'translateY(40vh)';
  } else {
    initGuideScroll(markEl);
    try {
      const { initCompanion } = await import('./companion3d.js');
      companion = await initCompanion(markEl, { onReady: () => markEl.classList.add('has-3d') });
    } catch (e) { /* the fallback SVG simply stays */ }
  }

  // Offer calmer motion on a first, full-motion visit.
  if (motionPref === null && !osReduced) {
    setTimeout(showMotionPrompt, 1700);
  }
}

function showMotionPrompt() {
  if (document.querySelector('.guide-prompt')) return;
  const prompt = document.createElement('div');
  prompt.className = 'guide-prompt';
  prompt.setAttribute('role', 'dialog');
  prompt.setAttribute('aria-label', 'Comfort and motion settings');
  prompt.innerHTML = `
    <button class="guide-prompt-close" type="button" aria-label="Close">&times;</button>
    <p class="guide-prompt-text">Hello — I’m your little guide. Would you like <strong>calmer motion</strong> as you browse?</p>
    <div class="guide-prompt-actions">
      <button type="button" class="btn btn--small" data-motion-choice="reduced">Yes, calmer</button>
      <button type="button" class="btn btn--ghost btn--small" data-motion-choice="full">No, I’m happy</button>
    </div>`;
  document.body.appendChild(prompt);
  requestAnimationFrame(() => prompt.classList.add('show'));

  const dismiss = (choice) => {
    if (choice) setMotion(choice);
    else writeMotionPref('full'); // closed without choosing → don't ask again
    prompt.classList.remove('show');
    setTimeout(() => prompt.remove(), 500);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') dismiss(null); };

  prompt.querySelector('.guide-prompt-close').addEventListener('click', () => dismiss(null));
  prompt.querySelectorAll('[data-motion-choice]').forEach((b) =>
    b.addEventListener('click', () => dismiss(b.dataset.motionChoice)));
  document.addEventListener('keydown', onKey);
  setTimeout(() => { const f = prompt.querySelector('[data-motion-choice]'); f && f.focus(); }, 80);
}

/* Apply / persist a motion choice. */
function setMotion(choice) {
  writeMotionPref(choice);
  motionPref = choice;
  if (choice === 'reduced') {
    if (!prefersReduced) applyReducedMotion();
  } else if (prefersReduced && !osReduced) {
    // Turning motion back on from a reduced state — reload for a clean start.
    window.location.reload();
    return;
  }
  updateMotionToggle();
}

/* Gracefully switch the running page to reduced motion, no reload needed. */
function applyReducedMotion() {
  prefersReduced = true;
  document.documentElement.classList.add('reduced-motion');

  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
  document.querySelectorAll('[data-reveal-stagger] > *').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const d = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = parseFloat(el.dataset.count).toFixed(d) + (el.dataset.suffix || '');
  });

  try { ScrollTrigger.getAll().forEach((t) => t.kill()); } catch (e) { /* ok */ }
  try { gsap.set('.hero-content, [data-parallax], .scrolly-panel', { clearProps: 'transform,opacity' }); } catch (e) { /* ok */ }
  document.querySelectorAll('.scrolly-panel').forEach((p) => (p.style.opacity = '1'));

  if (lenisRaf) { try { gsap.ticker.remove(lenisRaf); } catch (e) { /* ok */ } lenisRaf = null; }
  if (lenis) { try { lenis.destroy(); } catch (e) { /* ok */ } lenis = null; }
  if (companion) { companion.setPaused(true); }
  const gm = document.querySelector('[data-guide-mark]');
  if (gm) gm.style.transform = 'translateY(40vh)';
  const dot = document.querySelector('.cursor-dot');
  if (dot) dot.classList.remove('is-active');
}

/* Persistent motion toggle in the footer so anyone can change their mind. */
function initMotionToggle() {
  const bottom = document.querySelector('.footer-bottom');
  if (!bottom || bottom.querySelector('.motion-toggle')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'motion-toggle';
  bottom.appendChild(btn);
  btn.addEventListener('click', () => setMotion(prefersReduced ? 'full' : 'reduced'));
  updateMotionToggle();
}
function updateMotionToggle() {
  const btn = document.querySelector('.motion-toggle');
  if (!btn) return;
  btn.textContent = prefersReduced ? 'Gentle motion is off — turn on' : 'Prefer calmer motion?';
  btn.setAttribute('aria-pressed', String(prefersReduced));
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function boot() {
  if (prefersReduced) document.documentElement.classList.add('reduced-motion');
  initSmoothScroll();
  initHeader();
  initMobileMenu();
  initHeroReveal();
  initReveals();
  initParallax();
  initCounters();
  initMagnetic();
  initCursor();
  initScrolly();
  initChooser();
  initContactForm();
  initPageTransitions();
  initYear();
  initHero3DIfPresent();
  initGuide();
  initMotionToggle();

  // Recalculate triggers after fonts settle to avoid layout jumps.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
