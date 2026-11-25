/* PaperBack – the manuscript form opens as a pop-up 5 seconds after the page loads.
   The real form (#form) is moved into the pop-up while it is open and put back in its section when it closes,
   so validation and the Gmail hand-off keep working. Close with the cross, Esc, or a click outside. */
(function () {
  const form = document.getElementById("form");
  const section = document.getElementById("submit");
  if (!form || !section) return;
  const DELAY = 5000;

  const pop = document.createElement("div");
  pop.className = "pb-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-labelledby", "pb-pop-t");
  pop.innerHTML = '<div class="pb-pop-box"><div class="pb-pop-head"><h2 id="pb-pop-t">Submit your manuscript</h2>' +
    '<button type="button" class="pb-pop-x" aria-label="Close">&times;</button></div>' +
    '<div class="pb-pop-body"><p>Tell us about your book. Gmail will open with your details ready, so you only attach the manuscript and press Send.</p></div></div>';
  const box = pop.querySelector(".pb-pop-body"), closeBtn = pop.querySelector(".pb-pop-x");
  pop.hidden = false; document.body.appendChild(pop);

  const home = document.createComment("manuscript form"); form.before(home);   // remembers where the form lives
  let opener = null;

  function open() {
    if (pop.classList.contains("open")) return;
    opener = document.activeElement;
    box.appendChild(form);
    pop.classList.add("open"); document.body.classList.add("pb-pop-lock");
    const first = form.querySelector("input,select,textarea"); (first || closeBtn).focus({ preventScroll: true });
  }
  function close() {
    if (!pop.classList.contains("open")) return;
    pop.classList.remove("open"); document.body.classList.remove("pb-pop-lock");
    home.after(form);                       // back into the page section
    if (opener && opener.focus) try { opener.focus({ preventScroll: true }); } catch (e) {}
  }

  closeBtn.addEventListener("click", close);
  pop.addEventListener("mousedown", e => { if (e.target === pop) close(); });
  document.addEventListener("keydown", e => {
    if (!pop.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {   // keep Tab inside the pop-up
      const f = [...pop.querySelectorAll("button,input,select,textarea,a[href]")].filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  // "Submit manuscript" buttons and links open the pop-up too
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href="#submit"]');
    if (a && !pop.contains(a)) { e.preventDefault(); open(); }
  });

  // 5 seconds after every page load or reload
  setTimeout(open, DELAY);
})();
