// PaperBack – WhatsApp order box for book pages. Existing files are untouched.
// Fallback only: the admin's "WhatsApp number" setting overrides this.
const WHATSAPP_NUMBER = "919000000000"; // country code + number, digits only (91 = India)

const BOOK_PRICES = {}; // prices come from the admin dashboard (Books → Price)

Object.assign(BOOK_PRICES, window.PB_PRICES || {});

// Coupons are managed in the admin dashboard (Coupons section) and checked on the server (/api/coupon).

(function () {
  const slug = new URLSearchParams(location.search).get("book");
  const price = BOOK_PRICES[slug];
  const info = document.querySelector(".book-info");
  if (!price || !info || typeof BOOK_DETAILS === "undefined" || !BOOK_DETAILS[slug]) return;
  const b = BOOK_DETAILS[slug];
  const inr = n => "₹" + n.toLocaleString("en-IN");
  let applied = null, final = price;

  const box = document.createElement("div");
  box.className = "order-box";
  box.innerHTML = `
    <div class="order-price" aria-live="polite">
      <span class="now">${inr(price)}</span><s class="was" hidden></s><span class="save" hidden></span>
    </div>
    <div class="coupon">
      <label for="coupon-input">Have a coupon code?</label>
      <div class="coupon-row">
        <input id="coupon-input" type="text" autocomplete="off" autocapitalize="characters" placeholder="Enter code">
        <button type="button" class="coupon-apply">Apply</button>
      </div>
      <p class="coupon-msg" role="status"></p>
    </div>
    <a class="wa-btn" target="_blank" rel="noopener">
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.3.7 4.5 1.9 6.4L4 29l7.9-2c1.8 1 3.9 1.5 6.1 1.5 6.6 0 12-5.3 12-11.900S22.6 3 16 3zm0 21.800c-1.900 0-3.800-.5-5.400-1.5l-.4-.2-4.200 1.100 1.100-4.100-.3-.4a9.7 9.7 0 0 1-1.5-5.200C5.3 9.600 10.100 5 16 5s10.7 4.600 10.7 10.300S21.9 24.800 16 24.800zm5.900-7.300c-.3-.2-1.900-.9-2.200-1s-.5-.2-.7.200-.8 1-1 1.2-.4.200-.7.100c-.3-.2-1.400-.5-2.600-1.600-1-.9-1.600-1.900-1.800-2.300-.2-.3 0-.5.100-.7l.5-.6c.2-.2.200-.3.300-.5.100-.2.100-.4 0-.6l-1-2.300c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.400s-1.2 1.2-1.2 2.800 1.2 3.300 1.400 3.500c.2.200 2.400 3.700 5.800 5.100.8.400 1.5.6 2 .7.800.3 1.600.2 2.200.1.700-.1 1.900-.8 2.200-1.5.3-.7.300-1.400.2-1.5-.1-.2-.3-.2-.6-.4z"/></svg>
      Order on WhatsApp
    </a>`;
  info.querySelector(".by").after(box);

  const $ = s => box.querySelector(s);
  const wa = $(".wa-btn"), msg = $(".coupon-msg"), input = $("#coupon-input");

  function render() {
    const off = price - final;
    $(".now").textContent = inr(final);
    $(".was").hidden = $(".save").hidden = !applied;
    $(".was").textContent = inr(price);
    $(".save").textContent = applied ? `You save ${inr(off)}` : "";
    let text = `Hello PaperBack Publishers! I would like to order:\n\nBook: ${b.title} by ${b.author}\n`;
    text += applied
      ? `Price: ${inr(price)}\nCoupon: ${applied} (-${inr(off)})\nTotal: ${inr(final)}`
      : `Price: ${inr(price)}`;
    wa.href = `https://wa.me/${window.PB_WA || WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  const offOf = c => Math.min(price, c.type === "percent" ? Math.round(price * c.value / 100) : c.value);
  // The public offer (if any) and the code the customer typed compete: the bigger saving wins.
  const pub = (window.PB_OFFERS || []).filter(o => offOf(o) > 0).sort((a, b) => offOf(b) - offOf(a))[0];
  let typed = null;
  function recompute(auto) {
    const best = [pub, typed].filter(Boolean).sort((a, b) => offOf(b) - offOf(a))[0];
    if (!best) { applied = null; final = price; render(); return; }
    final = Math.max(0, price - offOf(best)); applied = best.code;
    msg.className = "coupon-msg ok";
    msg.textContent = best === typed ? `Coupon ${best.code} applied.` : (typed ? `Offer ${best.code} gives a better price, so it was kept.` : `Offer ${best.code} applied automatically.`);
    render();
  }
  async function apply() {
    const code = input.value.trim().toUpperCase();
    msg.className = "coupon-msg";
    if (!code) { msg.textContent = "Please enter a coupon code."; msg.classList.add("bad"); return; }
    msg.textContent = "Checking…";
    try {
      const r = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { typed = null; recompute(); msg.className = "coupon-msg bad"; msg.textContent = (j.error || "That code isn't valid.") + (applied ? ` Offer ${applied} is still applied.` : ""); return; }
      typed = j; recompute();
    } catch (e) { msg.className = "coupon-msg bad"; msg.textContent = "Could not check the code. Please try again."; }
  }

  $(".coupon-apply").addEventListener("click", apply);
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  render();
  if (pub) recompute();
})();

// Scroll-to-top button
(function () {
  const t = document.createElement("button");
  t.type = "button"; t.className = "to-top"; t.setAttribute("aria-label", "Back to top");
  t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.append(t);
  const toggle = () => t.classList.toggle("show", scrollY > 300);
  addEventListener("scroll", toggle, { passive: true }); toggle();
  t.addEventListener("click", () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" }));
})();
