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
    /* Only the homepage opens on a full-bleed dark hero photo that the
       nav should float over transparently before solidifying; secondary
       pages (404, privacidad) have no such photo, so the nav stays
       solid from the start instead of toggling on scroll. */
    if (document.querySelector(".hero")) {
      var onScroll = function () { nav.classList.toggle("is-solid", window.scrollY > 40); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      nav.classList.add("is-solid");
    }

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

    /* The marble panels drift hard against the section's own scroll —
       not the sticky photo wrap, whose box barely moves once pinned, but
       ".about" itself, so the parallax keeps running the whole time
       "Sobre mí" is on screen. Opposite directions so the two panels
       visibly pull apart as the page moves, instead of drifting in
       lockstep. */
    var aboutSection = document.querySelector(".about");
    var decoA = document.querySelector(".about-deco-a");
    var decoB = document.querySelector(".about-deco-b");
    if (aboutSection && decoA && decoB && !reduced) {
      var amp = window.innerWidth > 700 ? 1 : 0.55;
      gsap.fromTo(decoA, { y: -30 * amp, x: -10 * amp }, {
        y: 30 * amp, x: 10 * amp, ease: "none",
        scrollTrigger: { trigger: aboutSection, start: "top bottom", end: "bottom top", scrub: 0.5 },
      });
      gsap.fromTo(decoB, { y: 34 * amp, x: 11 * amp }, {
        y: -34 * amp, x: -11 * amp, ease: "none",
        scrollTrigger: { trigger: aboutSection, start: "top bottom", end: "bottom top", scrub: 0.5 },
      });
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

  /* ---------- gallery: lens rail ----------
     A draggable horizontal rail. Whichever card sits under the rail's
     center is "in focus": JS scales each card by its distance from that
     center line on every scroll frame, so the enlargement reads as one
     lens sweeping across the row as the visitor drags, swipes or scrolls.
     The track gets side padding (half the rail's width) so the first and
     last cards can still reach that center line instead of stopping short. */
  function initLensRail() {
    var rail = document.querySelector("[data-lens-rail]");
    var track = document.querySelector("[data-lens-track]");
    if (!rail || !track) return;
    var items = Array.prototype.slice.call(track.querySelectorAll(".lens-item"));
    if (!items.length) return;
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    var MIN_SCALE = 0.82, MAX_SCALE = 1.08, BELL = 220;

    function layout() {
      var railW = rail.clientWidth;
      var itemW = items[0].getBoundingClientRect().width;
      var pad = Math.max(0, (railW - itemW) / 2);
      track.style.paddingLeft = pad + "px";
      track.style.paddingRight = pad + "px";
    }

    function update() {
      var railRect = rail.getBoundingClientRect();
      var centerX = railRect.left + railRect.width / 2;
      items.forEach(function (item) {
        var r = item.getBoundingClientRect();
        var itemCenter = r.left + r.width / 2;
        var dist = Math.abs(itemCenter - centerX);
        var t = Math.max(0, 1 - dist / BELL);
        var scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
        item.style.transform = "scale(" + scale.toFixed(3) + ")";
        item.style.zIndex = Math.round(t * 100);
      });
    }

    layout();
    if (reduced) {
      items.forEach(function (item) { item.style.transform = "scale(1)"; });
    } else {
      update();
      var ticking = false;
      rail.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }, { passive: true });
    }
    window.addEventListener("resize", function () {
      layout();
      if (!reduced) update();
    });

    /* Mouse dragging with light momentum. Touch pointers are left to the
       browser's native (smoother, platform-consistent) momentum scroll;
       only "mouse" gets the hand-rolled version, since a mouse has no
       native horizontal drag-to-scroll of its own. */
    var isDown = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0, velocity = 0, momentumId = null;
    function cancelMomentum() {
      if (momentumId) { cancelAnimationFrame(momentumId); momentumId = null; }
    }
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      isDown = true;
      cancelMomentum();
      startX = e.clientX; startScroll = rail.scrollLeft; lastX = e.clientX; lastT = performance.now();
      rail.classList.add("is-dragging");
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      rail.scrollLeft = startScroll - dx;
      var now = performance.now();
      var dt = now - lastT;
      if (dt > 0) velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX; lastT = now;
    });
    function endDrag() {
      if (!isDown) return;
      isDown = false;
      rail.classList.remove("is-dragging");
      if (!reduced && Math.abs(velocity) > 0.05) {
        var v = velocity * 16;
        var step = function () {
          rail.scrollLeft -= v;
          v *= 0.95;
          if (Math.abs(v) > 0.5) momentumId = requestAnimationFrame(step);
        };
        momentumId = requestAnimationFrame(step);
      }
    }
    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("pointerleave", function () { if (isDown) endDrag(); });

    function scrollByItem(dir) {
      var w = items[0].getBoundingClientRect().width + 16;
      rail.scrollBy({ left: dir * w * 1.4, behavior: reduced ? "auto" : "smooth" });
    }
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollByItem(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollByItem(-1); }
    });
    var prevBtn = document.querySelector("[data-lens-prev]");
    var nextBtn = document.querySelector("[data-lens-next]");
    if (prevBtn) prevBtn.addEventListener("click", function () { scrollByItem(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { scrollByItem(1); });
  }

  /* ---------- faq: smooth open/close ----------
     Native <details> jumps instantly to/from display:none, which reads as
     abrupt. With JS we intercept the toggle, keep [open] true for the
     whole transition (so the browser never hides the content mid-animation)
     and let the .faq-body grid-rows transition (see styles.css) carry the
     actual open/close motion, only clearing [open] once the close finishes. */
  function initFaqAnimation() {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;
    items.forEach(function (item) {
      var summary = item.querySelector("summary");
      var body = item.querySelector(".faq-body");
      if (!summary || !body) return;
      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (item.classList.contains("is-open")) {
          item.classList.remove("is-open");
          var onEnd = function (ev) {
            if (ev.target !== body) return;
            item.open = false;
            body.removeEventListener("transitionend", onEnd);
          };
          body.addEventListener("transitionend", onEnd);
        } else {
          item.open = true;
          requestAnimationFrame(function () { item.classList.add("is-open"); });
        }
      });
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
    safe(initLensRail, "initLensRail");
    safe(initFaqAnimation, "initFaqAnimation");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
