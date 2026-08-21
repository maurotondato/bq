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

  /* ---------- signature motion: the hero photo breathes, the spine draws itself ----------
     The hero photo carries its own continuous Ken Burns drift (pure CSS, see
     styles.css) so it never fights this scroll-linked layer: as the visitor
     scrolls, the photo layer drifts for parallax depth and the text recedes.
     Further down, entering the Pillars section, a vertical spine draws itself
     and a joint marker seats at the midpoint — the same circular motif from
     the logo, now standing for the one point where Kinesiología and
     Osteopatía meet. */
  function initSignatureMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    var media = document.querySelector(".hero-media");
    var inner = document.querySelector(".hero-inner");
    if (media && inner && !reduced) {
      gsap.to(media, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 },
      });
      gsap.to(inner, {
        y: -50,
        opacity: 0.1,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "65% top", scrub: 0.5 },
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

    /* The portrait rises and settles a beat behind the marble panels
       fixed underneath it — that lag, plus its own deep drop shadow, is
       what reads as the photo floating above them rather than sitting
       flat against the collage. */
    var aboutPhoto = document.querySelector(".about-photo");
    var aboutWrap = document.querySelector(".about-photo-wrap");
    if (aboutPhoto && aboutWrap && !reduced) {
      gsap.fromTo(aboutPhoto,
        { y: 26, scale: .978 },
        {
          y: 0, scale: 1, ease: "none",
          scrollTrigger: { trigger: aboutWrap, start: "top 88%", end: "top 42%", scrub: 0.6 },
        }
      );
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

  /* ---------- gallery reveal: each photo wipes open, staggered ----------
     A curtain-style clip-path reveal on the "En acción" mosaic, one image
     opening after the next as the grid enters view — the wipe is the
     authored moment for that section, distinct from the hero's breathe. */
  function initGalleryReveal() {
    var items = document.querySelectorAll(".m-item");
    if (!items.length) return;
    if (!window.gsap || !window.ScrollTrigger) {
      items.forEach(function (el) { el.style.clipPath = "inset(0% 0% 0% 0%)"; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(items, { clipPath: "inset(0% 0% 0% 0%)" });
      return;
    }
    var mosaic = document.querySelector(".mosaic");
    gsap.set(items, { clipPath: "inset(0% 0% 100% 0%)" });
    gsap.to(items, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: { trigger: mosaic, start: "top 85%" },
    });
  }

  /* ---------- gallery parallax: each photo drifts at its own pace ----------
     Every mosaic photo is oversized inside its frame and scrubbed against
     its own scroll position, so each one glides slightly as the page
     scrolls past it — independent of the one-time wipe above, which
     lives on the frame (.m-item); this drift lives on the photo layer
     inside it (.m-photo), so the two never touch the same transform. */
  function initGalleryParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var photos = document.querySelectorAll(".m-photo");
    if (!photos.length) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    photos.forEach(function (el) {
      gsap.fromTo(el,
        { yPercent: -9 },
        {
          yPercent: 9, ease: "none",
          scrollTrigger: { trigger: el.closest(".m-item"), start: "top bottom", end: "bottom top", scrub: 0.4 },
        }
      );
    });
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
    safe(initGalleryReveal, "initGalleryReveal");
    safe(initGalleryParallax, "initGalleryParallax");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
