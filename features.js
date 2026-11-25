// PaperBack – added features. Existing logic in script.js is untouched.

// Phone validation for the manuscript form's phone field.
// Runs in the capture phase so it can stop the existing handler when the phone is missing/invalid.
(function () {
  const form = document.getElementById("form");
  const phone = document.getElementById("phone");
  if (!form || !phone) return;
  const wrap = phone.closest(".field");
  const err = wrap.querySelector(".error");

  const isValid = v => {
    const digits = v.replace(/\D/g, "");
    return /^\+?[\d\s()-]+$/.test(v.trim()) && digits.length >= 10 && digits.length <= 13;
  };
  const show = ok => {
    wrap.classList.toggle("invalid", !ok);
    err.textContent = ok ? "" : "Enter a valid phone number (10 digits, with or without +91).";
  };

  phone.addEventListener("input", () => { if (wrap.classList.contains("invalid")) show(isValid(phone.value)); });

  document.addEventListener("submit", e => {
    if (e.target !== form) return;
    const ok = isValid(phone.value);
    show(ok);
    if (ok) return;               // phone fine: the existing handler validates the rest
    e.preventDefault();
    e.stopPropagation();          // keep the existing handler from showing "thank you"
    // still surface the other fields' errors so the user sees everything at once
    const msg = { name: "Enter your full name.", email: "Enter a valid email address.", genre: "Choose a genre.", message: "Tell us a little about your book." };
    form.querySelectorAll("label").forEach(l => {
      const f = l.querySelector("input,select,textarea");
      const good = f.value.trim() !== "" && f.checkValidity();
      l.classList.toggle("invalid", !good);
      l.querySelector(".error").textContent = good ? "" : msg[f.name];
    });
    const s = document.getElementById("status"); if (s) s.textContent = "";
    const first = form.querySelector(".invalid input, .invalid select, .invalid textarea");
    if (first) first.focus();
  }, true);
})();

// Close the mobile menu is already handled by script.js (any <a> in the nav closes it).
