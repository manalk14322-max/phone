(() => {
  const KEY = "twm_lang";
  const supported = ["en", "es"];

  function safeLang(lang) {
    return supported.includes(lang) ? lang : "es";
  }

  function setTranslatableText(el, value) {
    if (!value) return;
    if (el.tagName === "INPUT" && /^(button|submit|reset)$/i.test(el.type || "")) {
      el.value = value;
      return;
    }
    el.textContent = value;
  }

  function applyLanguage(rawLang) {
    const lang = safeLang(rawLang);
    document.documentElement.lang = lang;
    localStorage.setItem(KEY, lang);

    document.querySelectorAll("[data-en][data-es]").forEach((el) => {
      setTranslatableText(el, el.getAttribute(`data-${lang}`));
    });

    document.querySelectorAll("[data-en-html][data-es-html]").forEach((el) => {
      const html = el.getAttribute(`data-${lang}-html`);
      if (html) el.innerHTML = html;
    });

    document.querySelectorAll("[data-en-ph][data-es-ph]").forEach((el) => {
      const ph = el.getAttribute(`data-${lang}-ph`);
      if (ph) el.setAttribute("placeholder", ph);
    });

    document.querySelectorAll("[data-en-aria][data-es-aria]").forEach((el) => {
      const aria = el.getAttribute(`data-${lang}-aria`);
      if (aria) el.setAttribute("aria-label", aria);
    });

    document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    document.body.setAttribute("data-lang", lang);
  }

  function initLanguageSwitch() {
    document.addEventListener("click", (event) => {
      const btn = event.target.closest(".lang-switch [data-lang]");
      if (!btn) return;
      applyLanguage(btn.getAttribute("data-lang"));
    });

    const initial = safeLang(localStorage.getItem(KEY) || document.documentElement.lang || "es");
    applyLanguage(initial);
    window.forceLanguage = applyLanguage;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguageSwitch, { once: true });
  } else {
    initLanguageSwitch();
  }
})();
