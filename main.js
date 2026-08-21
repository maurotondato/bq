(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  function escHTML(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- split text (preserves <br> / <em>) ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    var wrap = function (text) {
      return text.split(/(\s+)/).map(function (w) {
        return /^\s+$/.test(w) || w === "" ? w : '<span class="split-word">' + escHTML(w) + "</span>";
      }).join("");
    };
    var html = Array.prototype.map.call(el.childNodes, function (node) {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        return "<" + tag + ">" + wrap(node.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    el.classList.add("split-ready");
    var words = el.querySelectorAll(".split-word");
    words.forEach(function (w, i) { w.style.transitionDelay = Math.min(i * 30, 400) + "ms"; });
  }

  function initSplitText() {
    document.querySelectorAll("[data-split]").forEach(splitWords);
  }

  /* ---------- reveal on scroll ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- nav ---------- */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-solid", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.querySelector("[data-nav-links]");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("is-open"); });
      });
    }
  }

  /* ---------- smooth anchor scroll ---------- */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  }

  /* ---------- signature motion: the spine draws itself, the hero seal recedes ----------
     The circular seal fronts the hero; as the visitor scrolls into the Pillars
     section a vertical spine draws downward and a joint marker seats itself at
     the midpoint — the same circular motif from the logo, now standing for the
     one point where Kinesiología and Osteopatía meet. */
  function initSignatureMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    var seal = document.querySelector(".hero-seal");
    if (seal && !reduced) {
      gsap.to(seal, {
        scale: 0.72,
        y: -30,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.4 },
      });
    }

    var line = document.querySelector("[data-spine-line]");
    var joint = document.querySelector("[data-spine-joint]");
    var diptych = document.querySelector(".diptych");
    if (line && joint && diptych && window.innerWidth > 820) {
      gsap.set(line, { scaleY: 0 });
      gsap.set(joint, { scale: 0, opacity: 0 });
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: diptych,
          start: "top 75%",
          end: "top 30%",
          scrub: reduced ? false : 0.6,
        },
      });
      tl.to(line, { scaleY: 1, duration: 1, ease: "none" })
        .to(joint, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, "-=0.2");
    }
  }

  /* ---------- count up ---------- */
  function initCountUp() {
    var els = document.querySelectorAll("[data-count-to]");
    if (!els.length) return;
    var animate = function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      var target = parseFloat(el.getAttribute("data-count-to"));
      var numEl = el.querySelector(".stat-num");
      if (!numEl) return;
      var start = performance.now();
      var dur = 1200;
      var step = function (now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        numEl.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      els.forEach(function (el) {
        if (!el.dataset.counted && el.getBoundingClientRect().top < window.innerHeight) animate(el);
      });
    }, 6000);
  }

  /* ---------- brand-driven content ---------- */
  function initBrandLinks() {
    var brand = window.__BRAND__;
    if (!brand) return;
    var waUrl = "https://wa.me/" + brand.whatsapp + "?text=" + encodeURIComponent("Hola Bernardo, te escribo desde tu web para consultar por un turno.");
    document.querySelectorAll("[data-whatsapp-link]").forEach(function (a) { a.href = waUrl; });
    document.querySelectorAll("[data-instagram-link]").forEach(function (a) {
      a.href = brand.instagramUrl;
      if (!a.textContent.trim()) a.textContent = brand.instagramHandle;
    });
    document.querySelectorAll("[data-linkedin-link]").forEach(function (a) { a.href = brand.linkedinUrl; });
    document.querySelectorAll("[data-email-link]").forEach(function (a) { a.href = "mailto:" + brand.email; });
    var yearEl = document.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initBrandLinks, "initBrandLinks");
    safe(initSplitText, "initSplitText");
    safe(initReveals, "initReveals");
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initCountUp, "initCountUp");
    safe(initSignatureMotion, "initSignatureMotion");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
