// Sample catalogue – replace with your real titles
const books = [
  { title: "The Salt Road", author: "Meera Sengupta", genre: "Fiction", color: "blue" },
  { title: "Monsoon Ledger", author: "Arjun Dutta", genre: "Fiction", color: "green" },
  { title: "Quiet Algorithms", author: "Ritika Bose", genre: "Non-fiction", color: "navy" },
  { title: "Rivers of Kolkata", author: "Sourav Mitra", genre: "Non-fiction", color: "moss" },
  { title: "Little Lantern", author: "Ananya Roy", genre: "Children", color: "green" },
  { title: "Counting Stars at Noon", author: "Tanmoy Paul", genre: "Children", color: "blue" },
  { title: "Notes from a Tea Garden", author: "Isha Banerjee", genre: "Poetry", color: "navy" },
  { title: "Ink & Alum", author: "Kabir Chanda", genre: "Poetry", color: "moss" }
];

const esc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const grid = document.getElementById("books");

const coverHTML = b => b.image
  ? `<div class="cover has-img"><img src="${esc(b.image)}" alt="Cover of ${esc(b.title)}" loading="lazy" decoding="async" width="400" height="600"></div>`
  : `<div class="cover c-${esc(b.color)}">
          <strong>${esc(b.title)}</strong>
          <span>${esc(b.author)}</span>
        </div>`;

// Text typed in the top search bar (empty = show everything). Set through pbCatalogueSearch().
let searchTerm = "";
const matches = (b, q) => [b.title, b.author, b.genre].some(v => String(v || "").toLowerCase().includes(q));

// Price line for a book card. PB_OFFERS (set by cms.js) holds the offers the admin marked "Show on website".
const pbOff = (price, o) => Math.min(price, o.type === "percent" ? Math.round(price * o.value / 100) : o.value);
const inr = n => "\u20B9" + Number(n).toLocaleString("en-IN");
function priceHTML(b) {
  const p = Number(b.price); if (!(p > 0)) return "";
  let best = null;
  (window.PB_OFFERS || []).forEach(o => { const off = pbOff(p, o); if (off > 0 && (!best || off > best.off)) best = { off, code: o.code }; });
  return best
    ? `<span class="price"><s>${inr(p)}</s> <b>${inr(p - best.off)}</b> <em>with ${esc(best.code)}</em></span>`
    : `<span class="price"><b>${inr(p)}</b></span>`;
}
(function () { const s = document.createElement("style"); s.textContent =
  ".price{display:block;margin-top:.25rem;font-size:.95rem}.price s{opacity:.6}.price b{color:var(--green-deep,#4F7A12)}.price em{font-style:normal;font-size:.8rem;font-weight:700;background:#e4f2cc;color:#4F7A12;border-radius:99px;padding:.05rem .5rem;white-space:nowrap}" +
  ".offer-strip{background:#4F7A12;color:#fff;text-align:center;padding:.6rem 1rem;font-weight:500}.offer-strip b{background:#fff;color:#4F7A12;border-radius:6px;padding:.05rem .45rem;margin:0 .15rem}";
  document.head.appendChild(s); })();

function renderBooks(genre) {
  let list = genre === "All" ? books : books.filter(b => b.genre === genre);
  if (searchTerm) list = list.filter(b => matches(b, searchTerm.toLowerCase()));
  grid.scrollLeft = 0;
  grid.innerHTML = list.length ? list.map(b => `
    <figure class="book">
      <a class="book-link" href="book.html?book=${slug(b.title)}">
        ${coverHTML(b)}
        <figcaption><b>${esc(b.title)}</b><span class="author">${esc(b.author)}</span> · ${esc(b.genre)}${priceHTML(b)}</figcaption>
      </a>
    </figure>`).join("") : `<p class="cat-empty">No books found${searchTerm ? " for \u201c" + esc(searchTerm) + "\u201d" : ""}.</p>`;
  const bar = catalogueBar();
  bar.hidden = !searchTerm;
  bar.querySelector("span").textContent = searchTerm ? "Showing results for \u201c" + searchTerm + "\u201d" : "";
}

// The little "Showing results for ... Clear" bar above the catalogue
function catalogueBar() {
  let bar = document.getElementById("cat-status");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "cat-status"; bar.className = "cat-status"; bar.setAttribute("role", "status"); bar.hidden = true;
    bar.innerHTML = '<span></span><button type="button">Show all books</button>';
    bar.querySelector("button").addEventListener("click", () => pbCatalogueSearch(""));
    grid.before(bar);
  }
  return bar;
}

// Used by the search bar: show only the matching books in the catalogue and scroll to it
function pbCatalogueSearch(q, scroll) {
  searchTerm = String(q || "").trim();
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("is-active", c.dataset.genre === "All"));
  renderBooks("All");
  if (scroll) document.getElementById("catalogue").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" });
}

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    searchTerm = "";   // choosing a genre replaces any search from the top bar
    renderBooks(chip.dataset.genre);
  });
});
renderBooks("All");

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", e => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  }
});

// Manuscript form validation
const form = document.getElementById("form");
const status = document.getElementById("status");
const messages = {
  name: "Enter your full name.",
  email: "Enter a valid email address.",
  genre: "Choose a genre.",
  message: "Tell us a little about your book."
};

form.addEventListener("submit", e => {
  e.preventDefault();
  let valid = true;
  form.querySelectorAll("label").forEach(label => {
    const field = label.querySelector("input,select,textarea");
    const error = label.querySelector(".error");
    const ok = field.value.trim() !== "" && field.checkValidity();
    label.classList.toggle("invalid", !ok);
    error.textContent = ok ? "" : messages[field.name];
    if (!ok) valid = false;
  });
  if (!valid) {
    status.textContent = "";
    form.querySelector(".invalid input, .invalid select, .invalid textarea").focus();
    return;
  }
  // Open Gmail with the message ready to send. Manuscripts always go to this address.
  const to = "work.paperback@gmail.com";
  const v = n => (form.elements[n] ? form.elements[n].value.trim() : "");
  const subject = "Manuscript submission: " + v("genre") + " \u2013 " + v("name");
  const body = ["Name: " + v("name"), "Email: " + v("email"), "Phone: " + v("phone"), "Genre: " + v("genre"), "", "About the book:", v("message").slice(0, 1200), "", "(Please attach your manuscript file before sending.)"].join("\n");
  const url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to) + "&su=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  const win = window.open(url, "_blank");
  if (win) win.opener = null;
  status.textContent = win
    ? "Gmail has opened in a new tab. Attach your manuscript file and press Send."
    : "";
  if (!win) {
    status.textContent = "Your browser blocked the Gmail window. ";
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Open Gmail to send your manuscript";
    status.appendChild(a);
  }
  form.reset();
});

document.getElementById("year").textContent = new Date().getFullYear();
