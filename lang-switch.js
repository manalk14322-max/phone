(() => {
  const KEY = "twm_lang";
  const supported = ["en", "es"];
  const CHAT_KEY = "twm_chat_messages_v1";

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

  function initSupportChat() {
    if (document.getElementById("twm-chat-widget")) return;

    const widget = document.createElement("div");
    widget.id = "twm-chat-widget";
    widget.innerHTML = `
      <div class="twm-fab-stack">
        <a class="twm-wa-fab" href="https://wa.me/923185756022?text=Hello%20The%20World%20Mobile,%20I%20want%20product%20details." target="_blank" rel="noopener" aria-label="Open WhatsApp chat">✆</a>
        <button class="twm-chat-fab" id="twm-chat-fab" type="button" aria-label="Open chat">Messages</button>
      </div>
      <aside class="twm-chat-panel" id="twm-chat-panel" aria-hidden="true">
        <header class="twm-chat-head">
          <strong>The World Mobile Chat</strong>
          <button class="twm-chat-close" id="twm-chat-close" type="button" aria-label="Close">x</button>
        </header>
        <div class="twm-chat-body" id="twm-chat-body"></div>
        <form class="twm-chat-form" id="twm-chat-form">
          <input id="twm-chat-input" type="text" placeholder="Type your message..." autocomplete="off" />
          <button type="submit">Send</button>
        </form>
      </aside>
    `;
    document.body.appendChild(widget);

    const fab = document.getElementById("twm-chat-fab");
    const panel = document.getElementById("twm-chat-panel");
    const close = document.getElementById("twm-chat-close");
    const body = document.getElementById("twm-chat-body");
    const form = document.getElementById("twm-chat-form");
    const input = document.getElementById("twm-chat-input");

    const seed = {
      role: "agent",
      text: "Welcome to The World Mobile. Ask for price, stock, or delivery.",
      ts: Date.now(),
    };

    const read = () => {
      try {
        const arr = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
        if (!Array.isArray(arr) || !arr.length) return [seed];
        return arr;
      } catch {
        return [seed];
      }
    };

    const save = (messages) => localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));

    const bubble = (m) => `
      <div class="twm-msg ${m.role === "user" ? "user" : "agent"}">
        <p>${String(m.text || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;")}</p>
      </div>`;

    let messages = read();

    const render = () => {
      body.innerHTML = messages.map(bubble).join("");
      body.scrollTop = body.scrollHeight;
    };

    const toggle = (open) => {
      panel.classList.toggle("open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        input.focus();
      }
    };

    const autoReply = (txt) => {
      const t = txt.toLowerCase();
      if (t.includes("price") || t.includes("precio")) return "Please share product name. I will send latest wholesale price.";
      if (t.includes("stock")) return "Stock is updated daily. Send model + color and we confirm instantly.";
      if (t.includes("delivery") || t.includes("envio")) return "Dispatch in 24h for ready stock. Express options available.";
      return "Thanks. Our team will contact you shortly. You can also tap WhatsApp for faster support.";
    };

    fab.addEventListener("click", () => toggle(true));
    close.addEventListener("click", () => toggle(false));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = (input.value || "").trim();
      if (!value) return;
      messages.push({ role: "user", text: value, ts: Date.now() });
      messages.push({ role: "agent", text: autoReply(value), ts: Date.now() + 1 });
      save(messages);
      render();
      input.value = "";
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initLanguageSwitch();
      initSupportChat();
    }, { once: true });
  } else {
    initLanguageSwitch();
    initSupportChat();
  }
})();
