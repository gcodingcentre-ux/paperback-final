const params = new URLSearchParams(location.search);
const book = BOOK_DETAILS[params.get("book")];
const page = document.getElementById("book-page");
const esc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

if (book) {
  document.title = book.title + " – PaperBack Publishers";
  page.innerHTML = `
    ${book.image
      ? `<div class="cover has-img big-cover" role="img" aria-label="Cover of ${esc(book.title)}"><img src="${esc(book.image)}" alt="" decoding="async" width="400" height="600"></div>`
      : `<div class="cover c-${esc(book.color)} big-cover" role="img" aria-label="Cover of ${esc(book.title)}">
      <strong>${esc(book.title)}</strong>
      <span>${esc(book.author)}</span>
    </div>`}
    <div class="book-info">
      <p class="genre">${esc(book.genre)}</p>
      <h1>${esc(book.title)}</h1>
      <p class="by">by ${esc(book.author)}</p>
      ${book.summary ? `<h2>Summary</h2><p>${esc(book.summary)}</p>` : ""}
      ${book.bio ? `<h2>About the author</h2><p>${esc(book.bio)}</p>` : ""}
      <a class="btn" href="index.html#catalogue">Browse more titles</a>
    </div>`;
} else {
  page.innerHTML = `<div class="book-info"><h1>Book not found</h1>
    <p>We could not find that title.</p>
    <a class="btn" href="index.html#catalogue">Back to the catalogue</a></div>`;
}

const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
document.getElementById("year").textContent = new Date().getFullYear();
