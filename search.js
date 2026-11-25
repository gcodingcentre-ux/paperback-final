/* PaperBack – search bar: sliding placeholder (English / Bengali) + live book results */
(function () {
  const form = document.getElementById("sb-form");
  if (!form) return;
  const input = document.getElementById("sb-input");
  const field = form.querySelector(".sb-field");
  const list = document.getElementById("sb-results");
  const spans = [...form.querySelectorAll(".sb-ph span")];
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const esc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---- placeholders take turns sliding in ---- */
  let cur = 0;
  spans[0].classList.add("on");
  const swap = () => {
    if (document.hidden || field.classList.contains("has-value")) return;
    const a = spans[cur], b = spans[(cur + 1) % spans.length];
    a.classList.remove("on"); a.classList.add("out"); b.classList.add("on");
    setTimeout(() => {   // park the old one below again, without a visible jump
      a.classList.add("no-t"); a.classList.remove("out"); void a.offsetWidth; a.classList.remove("no-t");
    }, reduce ? 250 : 650);
    cur = (cur + 1) % spans.length;
  };
  setInterval(swap, 3200);

  /* ---- results ---- */
  let items = [], active = -1;
  const catalogue = () => (typeof books !== "undefined" && Array.isArray(books)) ? books : [];
  const mark = (text, q) => {
    const t = String(text), i = t.toLowerCase().indexOf(q);
    return i < 0 ? esc(t) : esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length));
  };
  const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; };
  const setActive = i => {
    const lis = [...list.querySelectorAll("li[role=option]")];
    if (!lis.length) return;
    active = (i + lis.length) % lis.length;
    lis.forEach((li, n) => li.setAttribute("aria-selected", n === active));
    input.setAttribute("aria-activedescendant", lis[active].id);
    lis[active].scrollIntoView({ block: "nearest" });
  };
  const render = () => {
    const q = input.value.trim().toLowerCase();
    field.classList.toggle("has-value", input.value !== "");
    if (!q) { close(); return; }
    items = catalogue().filter(b => [b.title, b.author, b.genre].some(v => String(v || "").toLowerCase().includes(q))).slice(0, 6);
    list.innerHTML = items.length
      ? items.map((b, i) => `<li role="option" id="sb-o${i}" aria-selected="false"><a href="book.html?book=${slug(b.title)}">` +
          `<span class="sb-cv c-${esc(b.color || "blue")}">${b.image ? `<img src="${esc(b.image)}" alt="" loading="lazy" decoding="async">` : ""}</span>` +
          `<span><b>${mark(b.title, q)}</b><small>${mark(b.author, q)} · ${esc(b.genre)}</small></span></a></li>`).join("")
      : `<li class="sb-none" role="presentation">No book found for “${esc(input.value.trim())}”. Try another title or author.</li>`;
    list.hidden = false; input.setAttribute("aria-expanded", "true"); active = -1;
  };

  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) render(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Escape") { close(); input.blur(); }
  });
  /* Enter / search button:
       - an arrow-selected result            -> open that book
       - the typed text is exactly a title   -> open that book
       - other matches                       -> show them in the catalogue (scrolls down)
       - no matches                          -> stay here and say so */
  const norm = t => String(t || "").trim().toLowerCase().replace(/\s+/g, " ");
  const same = (a, b) => norm(a) === norm(b) || (slug(a) && slug(a) === slug(b));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const typed = input.value.trim();
    if (!typed) { input.focus(); return; }
    const sel = active;   // remember the arrow-key choice: render() below resets it
    render();
    if (sel >= 0 && items[sel]) { location.href = "book.html?book=" + slug(items[sel].title); return; }
    const exact = catalogue().find(b => same(b.title, typed));
    if (exact) { location.href = "book.html?book=" + slug(exact.title); return; }
    if (items.length && typeof pbCatalogueSearch === "function") { close(); input.blur(); pbCatalogueSearch(typed, true); }
    /* no match: the list already says "No book found" */
  });
  document.addEventListener("click", e => { if (!form.contains(e.target)) close(); });
})();
