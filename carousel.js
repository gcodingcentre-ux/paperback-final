(function () {
  const root = document.querySelector(".carousel");
  if (!root) return;
  const track = root.querySelector(".slides");
  const dotsBox = root.querySelector(".dots");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const getSlides = () => root.querySelectorAll(".slide");
  let index = 0, timer;

  function build() {
    dotsBox.innerHTML = "";
    getSlides().forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "dot";
      d.setAttribute("aria-label", "Go to slide " + (i + 1));
      d.addEventListener("click", () => { go(i); restart(); });
      dotsBox.appendChild(d);
    });
    go(0);
  }
  function go(i) {
    const slides = getSlides();
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, n) => s.setAttribute("aria-hidden", n !== index));
    dotsBox.querySelectorAll(".dot").forEach((d, n) => d.classList.toggle("is-active", n === index));
  }
  function start() { if (!reduce) timer = setInterval(() => go(index + 1), 5500); }
  function restart() { clearInterval(timer); start(); }

  root.querySelector(".car-prev").addEventListener("click", () => { go(index - 1); restart(); });
  root.querySelector(".car-next").addEventListener("click", () => { go(index + 1); restart(); });
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", restart);
  root.addEventListener("focusin", () => clearInterval(timer));
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { go(index - 1); restart(); }
    if (e.key === "ArrowRight") { go(index + 1); restart(); }
  });

  window.pbCarouselRefresh = build;   // called by cms.js after new slides are drawn
  build();
  start();
})();
