(() => {
  const KEY = "twm_lang";
  const supported = ["en", "es"];
  const CHAT_KEY = "twm_chat_messages_v1";
  const CART_KEY = "twm_cart_v1";
  const ORDERS_KEY = "twm_orders_v1";

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
    const bar = document.querySelector(".site-header .bar");
    if (bar) {
      const profile = bar.querySelector("#profile-btn, .profile-btn");
      if (profile && profile.parentElement === bar) {
        bar.insertBefore(widget, profile);
      } else {
        bar.appendChild(widget);
      }
    } else {
      document.body.appendChild(widget);
    }

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

  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function parsePrice(raw) {
    const m = String(raw || "").replace(/,/g, ".").match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : 0;
  }

  function money(v) {
    return `EUR ${Number(v || 0).toFixed(2)}`;
  }

  function initCommerce() {
    if (document.getElementById("twm-cart-widget")) return;

    const widget = document.createElement("div");
    widget.id = "twm-cart-widget";
    widget.innerHTML = `
      <button class="twm-cart-fab" id="twm-cart-fab" type="button" aria-label="Open cart">
        <span class="twm-cart-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="20" r="1"></circle>
            <circle cx="18" cy="20" r="1"></circle>
            <path d="M2 3h2l2.2 11.2a2 2 0 0 0 2 1.6h9.9a2 2 0 0 0 2-1.5L22 7H7"></path>
          </svg>
        </span>
        <span class="twm-cart-badge" id="twm-cart-badge">0</span>
      </button>
      <aside class="twm-cart-panel" id="twm-cart-panel" aria-hidden="true">
        <header class="twm-cart-head">
          <strong>Your Cart</strong>
          <button class="twm-cart-close" id="twm-cart-close" type="button" aria-label="Close">x</button>
        </header>
        <div class="twm-cart-items" id="twm-cart-items"></div>
        <div class="twm-cart-foot">
          <div class="twm-cart-total">Subtotal: <strong id="twm-cart-subtotal">EUR 0.00</strong></div>
          <div class="twm-cart-row">
            <button class="twm-clear-btn" id="twm-cart-clear" type="button">Clear</button>
            <button class="twm-checkout-btn" id="twm-open-checkout" type="button">Checkout</button>
          </div>
        </div>
      </aside>
      <div class="twm-checkout-modal" id="twm-checkout-modal" aria-hidden="true">
        <div class="twm-checkout-box">
          <button class="twm-checkout-close" id="twm-checkout-close" type="button" aria-label="Close">x</button>
          <h3>Online Order</h3>
          <form id="twm-checkout-form" class="twm-checkout-form">
            <input id="co-name" type="text" placeholder="Full Name" required />
            <input id="co-phone" type="text" placeholder="Phone Number" required />
            <input id="co-email" type="email" placeholder="Email" required />
            <input id="co-city" type="text" placeholder="City" required />
            <input id="co-address" type="text" placeholder="Full Address" required />
            <select id="co-payment" required>
              <option value="COD">Cash on Delivery</option>
              <option value="Bank">Bank Transfer</option>
            </select>
            <textarea id="co-notes" rows="3" placeholder="Order notes (optional)"></textarea>
            <button type="submit" class="twm-place-order">Place Order</button>
          </form>
          <p class="twm-checkout-msg" id="twm-checkout-msg"></p>
          <p class="twm-order-link-wrap"><a class="twm-order-link" href="admin-orders.html">View all orders</a></p>
          <div class="twm-order-history" id="twm-order-history"></div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    const els = {
      fab: document.getElementById("twm-cart-fab"),
      badge: document.getElementById("twm-cart-badge"),
      panel: document.getElementById("twm-cart-panel"),
      close: document.getElementById("twm-cart-close"),
      items: document.getElementById("twm-cart-items"),
      subtotal: document.getElementById("twm-cart-subtotal"),
      clear: document.getElementById("twm-cart-clear"),
      checkoutBtn: document.getElementById("twm-open-checkout"),
      checkoutModal: document.getElementById("twm-checkout-modal"),
      checkoutClose: document.getElementById("twm-checkout-close"),
      checkoutForm: document.getElementById("twm-checkout-form"),
      checkoutMsg: document.getElementById("twm-checkout-msg"),
      history: document.getElementById("twm-order-history"),
    };

    function readCart() {
      const c = readJson(CART_KEY, []);
      return Array.isArray(c) ? c : [];
    }

    function saveCart(cart) {
      writeJson(CART_KEY, cart);
    }

    function readOrders() {
      const o = readJson(ORDERS_KEY, []);
      return Array.isArray(o) ? o : [];
    }

    function saveOrders(orders) {
      writeJson(ORDERS_KEY, orders.slice(0, 40));
    }

    function countItems(cart) {
      return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    }

    function subtotal(cart) {
      return cart.reduce((sum, item) => sum + parsePrice(item.price) * Number(item.qty || 0), 0);
    }

    function renderHistory() {
      const orders = readOrders().slice(0, 3);
      if (!orders.length) {
        els.history.innerHTML = "";
        return;
      }
      els.history.innerHTML = `
        <h4>Recent Orders</h4>
        ${orders
          .map(
            (o) => `<div class="twm-oh-row">
              <span>#${esc(o.orderId)}</span>
              <span>${esc(o.customer.name || "-")}</span>
              <strong>${money(o.total)}</strong>
            </div>`
          )
          .join("")}
      `;
    }

    function renderCart() {
      const cart = readCart();
      const qty = countItems(cart);
      els.badge.textContent = String(qty);
      els.subtotal.textContent = money(subtotal(cart));

      if (!cart.length) {
        els.items.innerHTML = `<p class="twm-empty">Your cart is empty.</p>`;
        return;
      }

      els.items.innerHTML = cart
        .map(
          (item) => `
            <article class="twm-cart-item">
              <img src="${esc(item.image || "1.png")}" alt="${esc(item.name || "Product")}" />
              <div class="twm-ci-body">
                <h5>${esc(item.name || "Product")}</h5>
                <p>${esc(item.category || "Category")}</p>
                <div class="twm-ci-row">
                  <span>${esc(item.price || "EUR 0")}</span>
                  <div class="twm-qty">
                    <button type="button" data-qty="dec" data-id="${esc(item.id)}">-</button>
                    <strong>${Number(item.qty || 1)}</strong>
                    <button type="button" data-qty="inc" data-id="${esc(item.id)}">+</button>
                  </div>
                </div>
                <button type="button" class="twm-remove" data-remove="${esc(item.id)}">Remove</button>
              </div>
            </article>`
        )
        .join("");
    }

    function addToCart(item, qty = 1) {
      if (!item || !item.id) return;
      const cart = readCart();
      const existing = cart.find((x) => String(x.id) === String(item.id));
      if (existing) {
        existing.qty = Number(existing.qty || 0) + Number(qty || 1);
      } else {
        cart.push({
          id: String(item.id),
          name: String(item.name || "Product"),
          price: String(item.price || "EUR 0"),
          image: String(item.image || "1.png"),
          category: String(item.category || "Category"),
          qty: Number(qty || 1),
        });
      }
      saveCart(cart);
      renderCart();
      els.panel.classList.add("open");
      els.panel.setAttribute("aria-hidden", "false");
    }

    function openCheckout() {
      if (!readCart().length) {
        els.checkoutMsg.textContent = "Add products to cart first.";
        return;
      }
      const session = readJson("twm_session_v1", null);
      if (session) {
        const name = document.getElementById("co-name");
        const phone = document.getElementById("co-phone");
        const email = document.getElementById("co-email");
        if (name && !name.value) name.value = session.name || "";
        if (phone && !phone.value) phone.value = session.phone || "";
        if (email && !email.value) email.value = session.email || "";
      }
      els.checkoutMsg.textContent = "";
      els.checkoutModal.classList.add("open");
      els.checkoutModal.setAttribute("aria-hidden", "false");
      renderHistory();
    }

    function closeCheckout() {
      els.checkoutModal.classList.remove("open");
      els.checkoutModal.setAttribute("aria-hidden", "true");
    }

    els.fab.addEventListener("click", () => {
      const open = !els.panel.classList.contains("open");
      els.panel.classList.toggle("open", open);
      els.panel.setAttribute("aria-hidden", open ? "false" : "true");
    });

    els.close.addEventListener("click", () => {
      els.panel.classList.remove("open");
      els.panel.setAttribute("aria-hidden", "true");
    });

    els.clear.addEventListener("click", () => {
      saveCart([]);
      renderCart();
    });

    els.checkoutBtn.addEventListener("click", openCheckout);
    els.checkoutClose.addEventListener("click", closeCheckout);
    els.checkoutModal.addEventListener("click", (e) => {
      if (e.target === els.checkoutModal) closeCheckout();
    });

    els.items.addEventListener("click", (e) => {
      const q = e.target.closest("[data-qty]");
      const rem = e.target.closest("[data-remove]");
      if (!q && !rem) return;

      const cart = readCart();
      if (q) {
        const id = q.getAttribute("data-id");
        const type = q.getAttribute("data-qty");
        const item = cart.find((x) => String(x.id) === String(id));
        if (item) {
          if (type === "inc") item.qty = Number(item.qty || 1) + 1;
          if (type === "dec") item.qty = Math.max(1, Number(item.qty || 1) - 1);
        }
      }
      if (rem) {
        const id = rem.getAttribute("data-remove");
        const next = cart.filter((x) => String(x.id) !== String(id));
        saveCart(next);
        renderCart();
        return;
      }
      saveCart(cart);
      renderCart();
    });

    els.checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cart = readCart();
      if (!cart.length) {
        els.checkoutMsg.textContent = "Cart is empty.";
        return;
      }

      const customer = {
        name: (document.getElementById("co-name")?.value || "").trim(),
        phone: (document.getElementById("co-phone")?.value || "").trim(),
        email: (document.getElementById("co-email")?.value || "").trim(),
        city: (document.getElementById("co-city")?.value || "").trim(),
        address: (document.getElementById("co-address")?.value || "").trim(),
        payment: document.getElementById("co-payment")?.value || "COD",
        notes: (document.getElementById("co-notes")?.value || "").trim(),
      };

      if (!customer.name || !customer.phone || !customer.email || !customer.city || !customer.address) {
        els.checkoutMsg.textContent = "Please fill all required fields.";
        return;
      }

      const orderId = `TWM-${Date.now().toString().slice(-8)}`;
      const order = {
        orderId,
        createdAt: new Date().toISOString(),
        customer,
        items: cart,
        total: subtotal(cart),
      };

      const orders = readOrders();
      orders.unshift(order);
      saveOrders(orders);
      saveCart([]);
      renderCart();
      renderHistory();
      els.checkoutMsg.textContent = `Order placed successfully. Order ID: ${orderId}`;
      els.checkoutForm.reset();
    });

    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-cart]");
      const buy = e.target.closest("[data-buy-now]");
      if (!add && !buy) return;
      e.preventDefault();
      const el = add || buy;
      addToCart({
        id: el.getAttribute("data-id") || "",
        name: el.getAttribute("data-name") || "Product",
        price: el.getAttribute("data-price") || "EUR 0",
        image: el.getAttribute("data-image") || "1.png",
        category: el.getAttribute("data-category") || "Category",
      }, 1);
      if (buy) openCheckout();
    });

    renderCart();
    window.TWM_CART = {
      addToCart,
      openCart: () => {
        els.panel.classList.add("open");
        els.panel.setAttribute("aria-hidden", "false");
      },
      openCheckout,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initLanguageSwitch();
      initSupportChat();
      initCommerce();
    }, { once: true });
  } else {
    initLanguageSwitch();
    initSupportChat();
    initCommerce();
  }
})();
