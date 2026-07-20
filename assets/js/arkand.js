/* Arkand Care — one small script. No framework.
   Progressive enhancement only: the site works with JS disabled. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile drawer --------------------------------------------------- */
  var toggle = document.querySelector(".nav__toggle");
  var drawer = document.getElementById("drawer");
  if (toggle && drawer) {
    var closeEls = drawer.querySelectorAll("[data-close]");
    var open = function () {
      drawer.setAttribute("data-open", "true");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = drawer.querySelector("a, button");
      if (first) first.focus();
    };
    var close = function () {
      drawer.setAttribute("data-open", "false");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      toggle.focus();
    };
    toggle.addEventListener("click", open);
    closeEls.forEach(function (el) { el.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.getAttribute("data-open") === "true") close();
    });
  }

  /* ---- Hero load sequence --------------------------------------------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    requestAnimationFrame(function () { hero.classList.add("is-in"); });
  }

  /* ---- Scroll reveal --------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- Enquiry form (client-side validation, no backend assumed) ------- */
  var form = document.querySelector("form[data-enquiry]");
  if (form) {
    var setError = function (field, message) {
      var wrap = field.closest(".field") || field.parentElement;
      var err = wrap.querySelector(".error");
      wrap.setAttribute("data-invalid", message ? "true" : "false");
      if (err) err.textContent = message || "";
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    };

    form.addEventListener("submit", function (e) {
      var ok = true;
      var firstBad = null;

      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var phone = form.querySelector("#phone");
      var consent = form.querySelector("#consent");

      if (name && !name.value.trim()) { setError(name, "Please tell us your name."); ok = false; firstBad = firstBad || name; }
      else if (name) setError(name, "");

      var emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      var phoneOk = phone && phone.value.replace(/[^0-9]/g, "").length >= 7;
      if (email && phone && !emailOk && !phoneOk) {
        setError(email, "Please leave an email or a phone number so we can reply.");
        ok = false; firstBad = firstBad || email;
      } else {
        if (email) setError(email, "");
        if (phone) setError(phone, "");
      }

      if (consent && !consent.checked) {
        setError(consent, "Please tick the box so we can respond to your enquiry.");
        ok = false; firstBad = firstBad || consent;
      } else if (consent) {
        setError(consent, "");
      }

      if (!ok) {
        e.preventDefault();
        if (firstBad) firstBad.focus();
        return;
      }

      /* No backend is wired up in this static build. Prevent a broken POST
         and show a clear confirmation; see README for wiring the endpoint. */
      if (!form.getAttribute("action")) {
        e.preventDefault();
        var okBox = document.getElementById("form-ok");
        if (okBox) {
          okBox.hidden = false;
          okBox.setAttribute("tabindex", "-1");
          okBox.focus();
          form.reset();
        }
      }
    });
  }

  /* ---- Footer year ----------------------------------------------------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
