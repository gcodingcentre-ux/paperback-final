/* PaperBack – loads the website content saved in the admin dashboard (Redis, via /api/get-content).
   If the API is unreachable or nothing has been saved yet, the page simply keeps its built-in content. */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const link = (u, fb) => { u = String(u || "").trim(); return /^(#|\/|https?:\/\/|mailto:|tel:)/i.test(u) ? u : (fb || "#"); };
  const pick = (v, allowed, fb) => allowed.includes(v) ? v : fb;
  const COLORS = ["blue", "green", "navy", "moss"];
  const list = (c, k) => Array.isArray(c[k]) ? c[k].filter(x => x && typeof x === "object") : null;
  const IMG = /^\/api\/image\?id=[a-f0-9]{16}$/;
  const cover = b => IMG.test(String(b.image || "")) ? `<div class="cover has-img"><img src="${esc(b.image)}" alt="Cover of ${esc(b.title)}" decoding="async" width="400" height="600"></div>` : `<div class="cover c-${pick(b.color, COLORS, "blue")}"><strong>${esc(b.title)}</strong><span>${esc(b.author)}</span></div>`;

  function banners(c) {
    const L = list(c, "banners"), B = list(c, "books") || [];
    const track = $(".carousel .slides");
    if (!L || !L.length || !track) return;
    track.innerHTML = L.map((s, i) => {
      const art = B.length ? [0, 1, 2].map(j => cover(B[(i * 2 + j) % B.length])).join("") : "";
      return `<article class="slide is-${pick(s.color, ["blue", "navy", "green"], "navy")}"><div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>` +
        (s.button ? `<a class="btn" href="${esc(link(s.link, "#catalogue"))}">${esc(s.button)}</a>` : "") +
        `</div><div class="slide-art" aria-hidden="true">${art}</div></article>`;
    }).join("");
    if (window.pbCarouselRefresh) window.pbCarouselRefresh();
  }

  // Offers marked "Show on website": a strip under the banner, and discounted prices on the book cards.
  function offers(c) {
    const today = new Date(Date.now() + 19800000).toISOString().slice(0, 10);
    window.PB_OFFERS = (list(c, "coupons") || []).filter(o => o.code && Number(o.value) > 0 && (!o.expires || today <= o.expires))
      .map(o => ({ code: String(o.code), type: o.type === "flat" ? "flat" : "percent", value: Number(o.value) }));
    const old = $(".offer-strip"); if (old) old.remove();
    const host = $(".carousel"); if (!host || !window.PB_OFFERS.length) return;
    const strip = document.createElement("div"); strip.className = "offer-strip";
    strip.innerHTML = window.PB_OFFERS.slice(0, 2).map(o => `Use code <b>${esc(o.code)}</b> for ${o.type === "percent" ? o.value + "% off" : "\u20B9" + o.value + " off"}`).join(" &nbsp;\u00B7&nbsp; ") + " on any book";
    host.insertAdjacentElement("afterend", strip);
  }

  function booksSection(c) {
    const L = list(c, "books");
    if (!L || !L.length) return;
    // hero shelf
    $$(".shelf .spine em").forEach((em, i) => { if (L[i]) em.textContent = L[i].title; });
    // new releases
    const nr = $("#new-releases .books"), fresh = L.filter(b => b.isNew === "Yes");
    if (nr) {
      nr.innerHTML = fresh.map(b => `<figure class="book release"><span class="badge">New</span><a class="book-link" href="book.html?book=${slug(b.title)}">${cover(b)}<figcaption><b>${esc(b.title)}</b><span class="author">${esc(b.author)}</span> · ${esc(b.genre)}${typeof priceHTML === "function" ? priceHTML(b) : ""}</figcaption></a></figure>`).join("");
      const sec = $("#new-releases"); if (sec) sec.hidden = fresh.length === 0;
    }
    // catalogue (script.js owns `books` and renderBooks)
    if (typeof books !== "undefined" && typeof renderBooks === "function") {
      books.splice(0, books.length, ...L.map(b => ({ title: String(b.title || ""), author: String(b.author || ""), genre: String(b.genre || ""), color: pick(b.color, COLORS, "blue"), image: IMG.test(String(b.image || "")) ? b.image : "", price: Number(b.price) || 0 })));
      const chip = $(".chip.is-active");
      renderBooks(chip ? chip.dataset.genre : "All");
    }
  }

  function authors(c) {
    const L = list(c, "authors"), box = $("#authors .pb-grid");
    if (!L || !box) return;
    const cls = ["", "g", "n"];
    box.innerHTML = L.map((a, i) => `<article class="author-card"><span class="avatar ${cls[i % 3]}">${esc(String(a.name || "?").trim().charAt(0).toUpperCase())}</span><div><h3>${esc(a.name)}</h3><small>${esc([a.book, a.genre].filter(Boolean).join(" · "))}</small><p>${esc(a.bio)}</p></div></article>`).join("");
  }

  function publishing(c) {
    const L = list(c, "publishing"), box = $("#publishing .pb-grid");
    if (!L || !box) return;
    box.innerHTML = L.map(p => `<article class="pb-card"><span class="tag">${esc(p.tag)}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><ul>${String(p.points || "").split("\n").map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul><a class="btn btn-ghost" href="#submit">Get started</a></article>`).join("");
  }

  function services(c) {
    const L = list(c, "services"), box = $("#services .services");
    if (L && box) box.innerHTML = L.map(s => `<article><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join("");
  }

  function process(c) {
    const L = list(c, "process"), box = $("#process .steps");
    if (L && box) box.innerHTML = L.map(s => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("");
  }

  function events(c) {
    const L = list(c, "events"), box = $("#events .pb-grid");
    if (!L || !box) return;
    box.innerHTML = L.map(e => {
      let d = "";
      if (e.date) { const t = new Date(e.date + "T00:00:00"); if (!isNaN(t)) d = `<small style="display:block;font-weight:700;margin-bottom:.3rem">${esc(t.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))}</small>`; }
      return `<article class="pb-card event-card"><div class="ico" aria-hidden="true">${esc(e.icon)}</div><h3>${esc(e.title)}</h3>${d}<p>${esc(e.text)}</p>` +
        (e.button ? `<a class="btn btn-ghost" href="${esc(link(e.link))}" target="_blank" rel="noopener">${esc(e.button)}</a>` : "") + `</article>`;
    }).join("");
  }

  function feedback(c) {
    const L = list(c, "feedback"), box = $("#fb-list");
    if (!L || !box) return;
    box.innerHTML = "";
    L.filter(x => x.status === "approved").forEach(x => {
      const n = Math.min(5, Math.max(1, parseInt(x.rating, 10) || 5));
      const card = document.createElement("article"); card.className = "fb-card";
      const s = document.createElement("div"); s.className = "fb-stars"; s.textContent = "\u2605".repeat(n) + "\u2606".repeat(5 - n); s.setAttribute("aria-label", n + " out of 5 stars");
      const p = document.createElement("p"); p.textContent = x.message || "";
      const b = document.createElement("b"); b.textContent = x.name || "";
      card.append(s, p, b); box.append(card);
    });
  }

  function about(c) {
    const L = list(c, "about"), box = $(".facts");
    if (L && box) box.innerHTML = L.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("");
  }

  function settings(c) {
    const L = list(c, "settings"); if (!L) return;
    const m = {}; L.forEach(x => { if (x.label) m[String(x.label).trim().toLowerCase()] = String(x.value || "").trim(); });
    if (m["phone"]) {
      const d = m["phone"].replace(/\D/g, ""), tel = "tel:" + (m["phone"].startsWith("+") ? "+" + d : d.length === 10 ? "+91" + d : "+" + d);
      $$('a[href^="tel:"]').forEach(a => { a.href = tel; });
      $$('.foot-ext a[href^="tel:"]:not(.btn)').forEach(a => { a.textContent = m["phone"]; });
    }
    if (m["whatsapp number"]) {
      const d = m["whatsapp number"].replace(/\D/g, "");
      if (d) $$('a[href*="wa.me/"]').forEach(a => { a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + d); });
    }
    if (m["email"]) {
      $$('a[href^="mailto:"]').forEach(a => { a.href = "mailto:" + m["email"]; a.textContent = m["email"]; });
      const p = $(".foot-top p"); if (p) p.textContent = m["email"];
    }
    if (m["address"]) { const p = $(".foot-ext > div:first-child p"); if (p) p.innerHTML = "PaperBack Publishers<br>" + esc(m["address"]); }
    if (m["facebook"]) $$('a[href*="facebook.com"]').forEach(a => { a.href = link(m["facebook"]); });
    if (m["instagram"]) $$('a[href*="instagram.com"]').forEach(a => { a.href = link(m["instagram"]); });
  }

  function apply(c) {
    [banners, offers, booksSection, authors, publishing, services, process, events, feedback, about, settings].forEach(fn => { try { fn(c); } catch (e) { console.error(fn.name, e); } });
    // keep the menu links and the scroll rails working after the cards were redrawn
    const tag = (sel, ids) => $$(sel).forEach((el, i) => { if (ids[i]) el.id = ids[i]; });
    tag("#publishing .pb-card", ["pub-self", "pub-hybrid", "pub-marketing"]);
    tag("#events .pb-card", ["ev-workshops", "ev-launches", "ev-other"]);
    dispatchEvent(new Event("resize"));
  }

  fetch("/api/get-content", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d && d.content) apply(d.content); })
    .catch(() => { /* keep the built-in content */ });
})();
