/* PaperBack – count-up numbers. Every number in the About facts (and anything marked data-count) counts up
   from 0 to its value when it scrolls into view. "240+" counts 0+ -> 240+, "Up to 40%" counts Up to 0% -> Up to 40%.
   Works with numbers edited in the admin: it re-runs whenever the facts are replaced. */
(function () {
  const SEL = ".facts dd, [data-count]";
  const DURATION = 1800;                                   // milliseconds
  const NUM = /\d[\d,]*(?:\.\d+)?/g;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;   // keep the plain numbers

  const st = document.createElement("style");
  st.textContent = ".cu-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}";
  document.head.appendChild(st);

  const ease = t => 1 - Math.pow(1 - t, 3);
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); run(e.target); }
  }), { threshold: 0.4 });

  function parts(text) {
    const nums = text.match(NUM) || [];
    return { nums, texts: text.split(NUM) };
  }
  const fmt = (n, original) => {
    const dec = (original.split(".")[1] || "").length;
    const s = n.toFixed(dec);
    return original.includes(",") ? Number(s).toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s;
  };
  const build = (p, k) => p.texts.map((t, i) => t + (i < p.nums.length ? fmt(parseFloat(p.nums[i].replace(/,/g, "")) * k, p.nums[i]) : "")).join("");

  function prepare(el) {
    if (el.dataset.cu) return;
    const final = el.textContent.trim();
    if (!/\d/.test(final)) return;                          // no number: leave as it is
    el.dataset.cu = "1";
    const p = parts(final);
    el.textContent = "";
    const live = document.createElement("span"); live.setAttribute("aria-hidden", "true"); live.textContent = build(p, 0);
    const sr = document.createElement("span"); sr.className = "cu-sr"; sr.textContent = final;   // screen readers get the real value
    el.append(live, sr);
    el._cu = { live, p, final };
    io.observe(el);
  }

  function run(el) {
    const { live, p, final } = el._cu, t0 = performance.now();
    (function step(now) {
      if (!el.isConnected) return;
      const t = Math.min(1, (now - t0) / DURATION);
      live.textContent = t < 1 ? build(p, ease(t)) : final;
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  const scan = () => document.querySelectorAll(SEL).forEach(prepare);
  scan();
  // the facts are replaced when the admin's content loads (and whenever it changes): prepare the new ones
  document.querySelectorAll(".facts").forEach(box => new MutationObserver(scan).observe(box, { childList: true }));
})();
