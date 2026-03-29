(() => {
  const KEY = "twm_lang";
  const supported = ["en", "es"];
  const CHAT_KEY = "twm_chat_messages_v1";
  const CART_KEY = "twm_cart_modern_v1";
  const ORDERS_KEY = "twm_orders_modern_v1";
  const PLACEHOLDER_IMAGE = "1.png";
  const CATALOG = window.TWM_CATALOG || {};
  const resolveProductImage = CATALOG.resolveProductImage || ((product) => String(product?.image || PLACEHOLDER_IMAGE));

  function resolveCartImage(item) {
    const stored = String(item?.image || "").trim();
    if (stored && stored !== PLACEHOLDER_IMAGE) return stored;
    return resolveProductImage(item);
  }

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

  function countItems(cart) {
    return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  function categoryLabel(value) {
    const key = String(value || "").trim().toUpperCase();
    const map = {
      FUNDA: "Cases",
      FUNDAS: "Cases",
      SIM: "SIM Cards",
      "PROTECTORES PANTALLA": "Screen Protectors",
      PROTECTORES_PHONE: "Screen Protectors",
      "PROTECTORES CAMERA": "Camera Protectors",
      PROTECTORES_CAMERA: "Camera Protectors",
      "POWER BANK": "Power Banks",
      POWER_BANK: "Power Banks",
      AUDIO: "Audio",
      OFERTA: "Offers",
      OFFERS: "Offers",
      SMART_WATCH: "Smart Watches",
      "MOBILE ACCESSORIES": "Mobile Accessories",
      MOBILE_ACCESSORIES: "Mobile Accessories",
      ACCESSORIES: "Accessories",
      CARGADORES: "Accessories",
      CABLE: "Accessories",
      GADGETS: "Accessories",
      PHONE: "Accessories",
      SAMSUNG: "Samsung",
      XIAOMI: "Xiaomi",
    };
    return map[key] || value || "Category";
  }

  function syncHeaderCartCount() {
    const badge = document.getElementById("cart-count");
    if (!badge) return;
    const cart = readJson(CART_KEY, []);
    badge.textContent = String(Array.isArray(cart) ? countItems(cart) : 0);
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
        <a class="twm-wa-fab" href="https://wa.me/34600000000?text=Hello%20The%20World%20Mobile,%20I%20want%20product%20details." target="_blank" rel="noopener" aria-label="Open WhatsApp chat">WA</a>
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

    const bubble = (message) => `
      <div class="twm-msg ${message.role === "user" ? "user" : "agent"}">
        <p>${esc(message.text || "")}</p>
      </div>`;

    let messages = read();

    const render = () => {
      body.innerHTML = messages.map(bubble).join("");
      body.scrollTop = body.scrollHeight;
    };

    const toggle = (open) => {
      panel.classList.toggle("open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) input.focus();
    };

    const autoReply = (text) => {
      const t = text.toLowerCase();
      if (t.includes("price") || t.includes("precio")) return "Please share the product name. We will confirm the latest price.";
      if (t.includes("stock")) return "Stock is updated daily. Send the model and color and we will confirm availability.";
      if (t.includes("delivery") || t.includes("envio")) return "Ready stock usually dispatches within 24 hours. Express options are available.";
      return "Thanks. Our team will contact you shortly. You can also use WhatsApp for faster support.";
    };

    fab.addEventListener("click", () => toggle(true));
    close.addEventListener("click", () => toggle(false));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
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
      const cart = readJson(CART_KEY, []);
      return Array.isArray(cart) ? cart : [];
    }

    function saveCart(cart) {
      writeJson(CART_KEY, cart);
      document.dispatchEvent(new Event("twm:cart-sync"));
    }

    function readOrders() {
      const orders = readJson(ORDERS_KEY, []);
      return Array.isArray(orders) ? orders : [];
    }

    function saveOrders(orders) {
      writeJson(ORDERS_KEY, orders.slice(0, 40));
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
            (order) => `<div class="twm-oh-row">
              <span>#${esc(order.orderId)}</span>
              <span>${esc(order.customer?.name || "-")}</span>
              <strong>${money(order.total)}</strong>
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
      syncHeaderCartCount();

      if (!cart.length) {
        els.items.innerHTML = `<p class="twm-empty">Your cart is empty.</p>`;
        return;
      }

      els.items.innerHTML = cart
        .map(
          (item) => `
            <article class="twm-cart-item">
              <img src="${esc(resolveCartImage(item))}" alt="${esc(item.name || "Product")}" />
              <div class="twm-ci-body">
                <h5>${esc(item.name || "Product")}</h5>
                <p>${esc(categoryLabel(item.category))}</p>
                ${item.variantLabel ? `<p>${esc(item.variantLabel)}</p>` : ""}
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

    function openCart() {
      els.panel.classList.add("open");
      els.panel.setAttribute("aria-hidden", "false");
    }

    function closeCart() {
      els.panel.classList.remove("open");
      els.panel.setAttribute("aria-hidden", "true");
    }

    function addToCart(item, qty = 1) {
      if (!item || !item.id) return;
      const cart = readCart();
      const existing = cart.find((entry) => String(entry.id) === String(item.id));

      if (existing) {
        existing.qty = Number(existing.qty || 0) + Number(qty || 1);
      } else {
        cart.push({
          id: String(item.id),
          name: String(item.name || "Product"),
          price: String(item.price || "EUR 0"),
          image: resolveCartImage(item),
          category: categoryLabel(item.category),
          variantLabel: String(item.variantLabel || ""),
          qty: Number(qty || 1),
        });
      }

      saveCart(cart);
      renderCart();
      openCart();
    }

    function openCheckout() {
      if (!readCart().length) {
        els.checkoutMsg.textContent = "Add products to cart first.";
        return;
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

    els.close.addEventListener("click", closeCart);

    els.clear.addEventListener("click", () => {
      saveCart([]);
      renderCart();
    });

    els.checkoutBtn.addEventListener("click", openCheckout);
    els.checkoutClose.addEventListener("click", closeCheckout);
    els.checkoutModal.addEventListener("click", (event) => {
      if (event.target === els.checkoutModal) closeCheckout();
    });

    els.items.addEventListener("click", (event) => {
      const qtyButton = event.target.closest("[data-qty]");
      const removeButton = event.target.closest("[data-remove]");
      if (!qtyButton && !removeButton) return;

      const cart = readCart();

      if (qtyButton) {
        const id = qtyButton.getAttribute("data-id");
        const type = qtyButton.getAttribute("data-qty");
        const item = cart.find((entry) => String(entry.id) === String(id));
        if (item) {
          if (type === "inc") item.qty = Number(item.qty || 1) + 1;
          if (type === "dec") item.qty = Math.max(1, Number(item.qty || 1) - 1);
        }
      }

      if (removeButton) {
        const id = removeButton.getAttribute("data-remove");
        const next = cart.filter((entry) => String(entry.id) !== String(id));
        saveCart(next);
        renderCart();
        return;
      }

      saveCart(cart);
      renderCart();
    });

    els.checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
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

      const order = {
        orderId: `TWM-${Date.now().toString().slice(-8)}`,
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
      els.checkoutMsg.textContent = `Order placed successfully. Order ID: ${order.orderId}`;
      els.checkoutForm.reset();
    });

    window.addEventListener("storage", (event) => {
      if (event.key === CART_KEY || event.key === ORDERS_KEY) {
        renderCart();
        renderHistory();
      }
    });

    renderCart();

    window.TWM_CART = {
      addToCart,
      openCart,
      openCheckout,
      refresh: renderCart,
    };
  }

  function initHeaderControls() {
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("nav-links");
    const search = document.getElementById("global-search");
    const cartBtn = document.getElementById("cart-btn");

    syncHeaderCartCount();

    navToggle?.addEventListener("click", () => {
      if (!navLinks) return;
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks?.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      navLinks.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    });

    search?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const query = (search.value || "").trim();
      const target = query ? `store.html?q=${encodeURIComponent(query)}` : "store.html";
      window.location.href = target;
    });

    cartBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      window.TWM_CART?.openCart();
    });

    document.addEventListener("twm:cart-sync", syncHeaderCartCount);
    window.addEventListener("storage", (event) => {
      if (event.key === CART_KEY) syncHeaderCartCount();
    });
  }

  function initVisualBoost() {
    document.body.classList.add("twm-premium");

    const header = document.querySelector(".nav-wrap");
    if (header && !document.querySelector(".twm-topline")) {
      const strip = document.createElement("div");
      strip.className = "twm-topline";
      strip.innerHTML = `
        <div class="twm-topline-track">
          <span>Entrega 24h en Espana</span>
          <span>Atencion mayorista profesional</span>
          <span>Pagos seguros y soporte rapido</span>
          <span>Nuevos accesorios cada semana</span>
          <span>Envio premium para tiendas y retail</span>
          <span>Entrega 24h en Espana</span>
          <span>Atencion mayorista profesional</span>
          <span>Pagos seguros y soporte rapido</span>
          <span>Nuevos accesorios cada semana</span>
          <span>Envio premium para tiendas y retail</span>
        </div>
      `;
      header.insertAdjacentElement("afterend", strip);
    }

    const targets = document.querySelectorAll(
      "main > section, .contact-card, .pd-wrap, .flash-sale, .daraz-categories, .fan-collabs, .case-studio, .accessory-lab, .fundas-spotlight, .accessory-premium, .store-locator"
    );

    targets.forEach((el) => el.classList.add("twm-reveal"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => io.observe(el));
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        initLanguageSwitch();
        initSupportChat();
        initCommerce();
        initHeaderControls();
        initVisualBoost();
      },
      { once: true }
    );
  } else {
    initLanguageSwitch();
    initSupportChat();
    initCommerce();
    initHeaderControls();
    initVisualBoost();
  }
})();
