/* PaperBack – UX layer */
(function () {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const desktop = () => matchMedia("(min-width:861px)").matches;

  /* dropdown nav: hover on desktop, accordion on mobile, Esc closes */
  const dds = $$(".dd");
  const closeAll = except => dds.forEach(d => { if (d !== except) { d.classList.remove("open"); $(".dd-btn", d).setAttribute("aria-expanded", "false"); } });
  dds.forEach(d => {
    const b = $(".dd-btn", d);
    b.addEventListener("click", () => {
      if (desktop()) { location.hash = b.dataset.href; return; }
      const o = d.classList.toggle("open"); b.setAttribute("aria-expanded", o); closeAll(d);
    });
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeAll(); document.activeElement.blur(); } });

  /* ids so menu links jump to the exact card */
  const tag = (sel, ids) => $$(sel).forEach((c, i) => { if (ids[i]) c.id = ids[i]; });
  tag("#publishing .pb-card", ["pub-self", "pub-hybrid", "pub-marketing"]);
  tag("#events .pb-card", ["ev-workshops", "ev-launches", "ev-other"]);

  /* smart header: hides while scrolling down, returns on scroll up */
  const hdr = $(".site-header"); let last = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY, nav = $("#nav");
    hdr.classList.toggle("scrolled", y > 8);
    const lock = (nav && nav.classList.contains("open")) || $(".dd.open") || hdr.matches(":hover,:focus-within");
    hdr.classList.toggle("hide", y > last && y > 240 && !lock);
    last = y;
  }, { passive: true });
  addEventListener("hashchange", () => hdr.classList.remove("hide"));

  /* horizontal rails: arrows, drag, dots */
  const makeRail = el => {
    if (!el) return;
    const wrap = document.createElement("div"); wrap.className = "rail-wrap";
    el.before(wrap); wrap.append(el); el.classList.add("rail");
    const mk = (c, t, l) => Object.assign(document.createElement("button"), { className: "rail-btn " + c, innerHTML: t, type: "button", ariaLabel: l });
    const prev = mk("rail-prev", "&#8249;", "Scroll left"), next = mk("rail-next", "&#8250;", "Scroll right");
    const dots = Object.assign(document.createElement("div"), { className: "rail-dots", ariaHidden: "true" });
    wrap.append(prev, next, dots);
    const step = () => Math.max(el.clientWidth * .8, 240);
    prev.onclick = () => el.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" });
    next.onclick = () => el.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" });
    const update = () => {
      const max = el.scrollWidth - el.clientWidth, can = max > 4;
      wrap.classList.toggle("no-scroll", !can);
      prev.disabled = el.scrollLeft < 4; next.disabled = el.scrollLeft > max - 4;
      const n = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      if (dots.children.length !== n) dots.innerHTML = "<i></i>".repeat(n);
      const cur = max ? Math.round(el.scrollLeft / max * (n - 1)) : 0;
      [...dots.children].forEach((d, i) => d.classList.toggle("on", i === cur));
    };
    el.addEventListener("scroll", update, { passive: true }); addEventListener("resize", update); update(); setTimeout(update, 400);
    el.addEventListener("keydown", e => { if (e.key === "ArrowRight") next.click(); if (e.key === "ArrowLeft") prev.click(); });
    /* mouse drag */
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; el.classList.add("grabbing"); } if (moved) el.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { down = false; setTimeout(() => el.classList.remove("grabbing"), 0); });
    el.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  };
  makeRail($("#new-releases .books"));
  makeRail($("#authors .pb-grid"));
  makeRail($("#publishing .pb-grid"));
  makeRail($("#events .pb-grid"));

  /* footer: social icons cloned from the side bar */
  const side = $$(".side-social a"), ext = $(".foot-ext");
  if (ext && side.length) {
    const col = document.createElement("div");
    col.innerHTML = "<h4>Follow us</h4><div class='foot-social'></div>";
    side.forEach(a => { const c = a.cloneNode(true); c.removeAttribute("class"); $(".foot-social", col).append(c); });
    ext.append(col);
  }

  /* gentle section reveal */
  const secs = $$("main .section");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    secs.forEach(s => { s.classList.add("fx"); io.observe(s); });
  }
})();

/* scroll-to-top button */
(function () {
  const t = document.createElement("button");
  t.type = "button"; t.className = "to-top"; t.setAttribute("aria-label", "Back to top");
  t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.append(t);
  const toggle = () => t.classList.toggle("show", scrollY > 400);
  addEventListener("scroll", toggle, { passive: true }); toggle();
  t.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" }));
})();

/* feedback form (separate from the manuscript form in script.js) */
(function () {
  const f = document.getElementById("feedback-form");
  if (!f) return;
  const status = document.getElementById("fb-status");
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
  const savePending = fb => { try { localStorage.setItem("pb_pending_feedback", JSON.stringify([fb, ...read("pb_pending_feedback")])); } catch (e) {} };

  // show approved feedback under the form
  const list = document.getElementById("fb-list");
  const items = [...read("pb_approved_feedback"), ...(typeof APPROVED_FEEDBACK !== "undefined" ? APPROVED_FEEDBACK : [])];
  items.forEach(x => {
    const c = document.createElement("article"); c.className = "fb-card";
    const s = document.createElement("div"); s.className = "fb-stars";
    s.textContent = "\u2605".repeat(x.rating) + "\u2606".repeat(5 - x.rating);
    s.setAttribute("aria-label", x.rating + " out of 5 stars");
    const p = document.createElement("p"); p.textContent = x.message;
    const n = document.createElement("b"); n.textContent = x.name;
    c.append(s, p, n); list.append(c);
  });
  const ratingErr = document.getElementById("fb-rating-error");
  const fields = [
    { el: f.elements.name, msg: "Please enter your name." },
    { el: f.elements.message, msg: "Please write a few words of feedback." }
  ];
  const setErr = (el, msg) => {
    const box = el.closest(".fb-field");
    box.classList.toggle("invalid", !!msg);
    box.querySelector(".error").textContent = msg;
  };
  fields.forEach(({ el, msg }) => el.addEventListener("input", () => { if (el.value.trim()) setErr(el, ""); }));
  f.addEventListener("change", e => { if (e.target.name === "rating") ratingErr.textContent = ""; });

  f.addEventListener("submit", e => {
    e.preventDefault();
    let first = null;
    const rating = f.elements.rating.value;
    ratingErr.textContent = rating ? "" : "Please choose a star rating.";
    if (!rating) first = f.querySelector(".stars input");
    fields.forEach(({ el, msg }) => {
      const ok = el.value.trim() !== "";
      setErr(el, ok ? "" : msg);
      if (!ok && !first) first = el;
    });
    if (first) { status.textContent = ""; first.focus(); return; }
    // New feedback goes to the admin queue (Redis) and appears on the site after approval.
    const fb = { name: f.elements.name.value.trim(), rating: +rating, message: f.elements.message.value.trim() };
    const btn = f.querySelector("button[type=submit]"); if (btn) btn.disabled = true;
    fetch("/api/submit-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fb) })
      .then(r => { if (!r.ok) throw new Error(); status.textContent = "Thank you! Your feedback will appear on the site once our team has approved it."; f.reset(); })
      .catch(() => { status.textContent = "Sorry, we could not send your feedback right now. Please try again in a moment."; })
      .finally(() => { if (btn) btn.disabled = false; });
  });
})();
