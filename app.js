(() => {
  const state = {
    products: [],
    filtered: [],
    activeFilter: "ALL",
    query: "",
    cart: [],
  };

  const KEYS = {
    cart: "twm_cart_modern_v1",
    orders: "twm_orders_modern_v1",
  };

  const els = {
    navToggle: document.getElementById("nav-toggle"),
    navLinks: document.getElementById("nav-links"),
    search: document.getElementById("global-search"),
    resultChip: document.getElementById("result-chip"),
    productGrid: document.getElementById("product-grid"),
    bestGrid: document.getElementById("best-grid"),
    categoryGrid: document.getElementById("category-grid"),
    cartBtn: document.getElementById("cart-btn"),
    cartCount: document.getElementById("cart-count"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartClose: document.getElementById("cart-close"),
    cartItems: document.getElementById("cart-items"),
    cartSubtotal: document.getElementById("cart-subtotal"),
    clearCart: document.getElementById("clear-cart"),
    openCheckout: document.getElementById("open-checkout"),
    overlay: document.getElementById("overlay"),
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutClose: document.getElementById("checkout-close"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutMsg: document.getElementById("checkout-msg"),
    newsletterForm: document.getElementById("newsletter-form"),
  };

  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
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

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function parsePrice(raw) {
    const match = String(raw || "").replace(/,/g, ".").match(/(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }

  function formatMoney(value) {
    return `EUR ${Number(value || 0).toFixed(2)}`;
  }

  function isMatchByFilter(product, filterKey) {
    const name = String(product.name || "").toLowerCase();
    switch (filterKey) {
      case "IPHONE":
        return /iphone/.test(name);
      case "SAMSUNG":
        return /samsung/.test(name);
      case "XIAOMI":
        return /xiaomi/.test(name);
      case "ACCESSORIES":
        return /(funda|case|magsafe|protector|cargador|cable|auricular|audio|power|soporte)/.test(name);
      default:
        return true;
    }
  }

  function calcRating(id) {
    const n = Number(id || 0);
    return 4 + ((n % 10) / 10);
  }

  function starRow(rating) {
    const rounded = Math.round(rating);
    const full = "★".repeat(Math.min(5, Math.max(0, rounded)));
    const empty = "☆".repeat(Math.max(0, 5 - rounded));
    return `${full}${empty}`;
  }

  function productCard(product) {
    const rating = calcRating(product.id);
    return `
      <article class="product-card">
        <div class="product-media">
          <img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </div>
        <div class="product-body">
          <h3 class="product-title">${esc(product.name)}</h3>
          <div class="rating-row">
            <span class="stars">${starRow(rating)}</span>
            <span class="rating-value">${rating.toFixed(1)}</span>
          </div>
          <div class="price-row">
            <span class="price">${esc(product.price || "EUR 0")}</span>
            <button
              class="add-btn"
              type="button"
              data-add-cart="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(product.price || "EUR 0")}" 
              data-image="${esc(product.image)}"
              data-category="${esc(product.category || "ACCESSORY")}">Add to Cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderProducts() {
    els.productGrid.innerHTML = state.filtered.map(productCard).join("");
    els.resultChip.textContent = `${state.filtered.length} products`;
  }

  function renderBestSelling() {
    const phoneLike = state.products.filter((p) => /(iphone|samsung|xiaomi)/i.test(String(p.name || "")));
    const source = phoneLike.length ? phoneLike : state.products;
    const unique = [];
    const seen = new Set();

    for (const p of source) {
      if (seen.has(String(p.image))) continue;
      unique.push(p);
      seen.add(String(p.image));
      if (unique.length >= 8) break;
    }

    els.bestGrid.innerHTML = unique.map(productCard).join("");
  }

  function pickCategoryImage(filter) {
    const picked = state.products.find((p) => isMatchByFilter(p, filter) && p.image);
    return picked?.image || "1.png";
  }

  function renderCategoryCards() {
    const cards = [
      { key: "IPHONE", label: "iPhone" },
      { key: "SAMSUNG", label: "Samsung" },
      { key: "XIAOMI", label: "Xiaomi" },
      { key: "ACCESSORIES", label: "Accessories" },
    ];

    els.categoryGrid.innerHTML = cards
      .map(
        (c) => `
        <button type="button" class="category-card" data-filter-card="${c.key}">
          <img src="${esc(pickCategoryImage(c.key))}" alt="${esc(c.label)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
          <span class="overlay">
            <h3>${esc(c.label)}</h3>
            <span>Explore</span>
          </span>
        </button>`
      )
      .join("");
  }

  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    state.filtered = state.products.filter((p) => {
      if (!isMatchByFilter(p, state.activeFilter)) return false;
      if (!q) return true;
      return String(p.name || "").toLowerCase().includes(q);
    });
    renderProducts();
  }

  function setActiveNav(filterKey) {
    document.querySelectorAll(".nav-links a[data-filter]").forEach((a) => {
      a.classList.toggle("active", a.dataset.filter === filterKey);
    });
  }

  function openCart() {
    els.cartDrawer.classList.add("open");
    els.overlay.hidden = false;
  }

  function closeCart() {
    els.cartDrawer.classList.remove("open");
    els.overlay.hidden = true;
  }

  function readCart() {
    const cart = readJson(KEYS.cart, []);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCart(cart) {
    saveJson(KEYS.cart, cart);
    state.cart = cart;
    renderCart();
  }

  function cartCount(cart) {
    return cart.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  }

  function cartSubtotal(cart) {
    return cart.reduce((sum, i) => sum + parsePrice(i.price) * Number(i.qty || 0), 0);
  }

  function renderCart() {
    const cart = state.cart;
    els.cartCount.textContent = String(cartCount(cart));
    els.cartSubtotal.textContent = formatMoney(cartSubtotal(cart));

    if (!cart.length) {
      els.cartItems.innerHTML = "<p style='color:#5d739a;font-weight:600;'>Your cart is empty.</p>";
      return;
    }

    els.cartItems.innerHTML = cart
      .map(
        (item) => `
        <article class="cart-item">
          <img src="${esc(item.image)}" alt="${esc(item.name)}" />
          <div>
            <h4>${esc(item.name)}</h4>
            <p class="meta">${esc(item.category)}</p>
            <div class="qty-row">
              <strong>${esc(item.price)}</strong>
              <div class="qty-controls">
                <button type="button" data-qty="dec" data-id="${esc(item.id)}">-</button>
                <span>${Number(item.qty || 1)}</span>
                <button type="button" data-qty="inc" data-id="${esc(item.id)}">+</button>
              </div>
            </div>
            <button class="remove-btn" type="button" data-remove="${esc(item.id)}">Remove</button>
          </div>
        </article>`
      )
      .join("");
  }

  function addToCart(item) {
    const cart = readCart();
    const existing = cart.find((x) => String(x.id) === String(item.id));
    if (existing) {
      existing.qty = Number(existing.qty || 0) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart(cart);
    openCart();
  }

  function adjustQty(id, type) {
    const cart = readCart();
    const item = cart.find((x) => String(x.id) === String(id));
    if (!item) return;
    if (type === "inc") item.qty += 1;
    if (type === "dec") item.qty = Math.max(1, item.qty - 1);
    saveCart(cart);
  }

  function removeFromCart(id) {
    const next = readCart().filter((x) => String(x.id) !== String(id));
    saveCart(next);
  }

  function openCheckout() {
    if (!state.cart.length) {
      els.checkoutMsg.textContent = "Add products to cart first.";
      return;
    }
    els.checkoutMsg.textContent = "";
    els.checkoutModal.classList.add("open");
    els.overlay.hidden = false;
  }

  function closeCheckout() {
    els.checkoutModal.classList.remove("open");
    if (!els.cartDrawer.classList.contains("open")) {
      els.overlay.hidden = true;
    }
  }

  function placeOrder(e) {
    e.preventDefault();
    const cart = readCart();
    if (!cart.length) {
      els.checkoutMsg.textContent = "Cart is empty.";
      return;
    }

    const customer = {
      name: document.getElementById("co-name").value.trim(),
      phone: document.getElementById("co-phone").value.trim(),
      email: document.getElementById("co-email").value.trim(),
      city: document.getElementById("co-city").value.trim(),
      address: document.getElementById("co-address").value.trim(),
      payment: document.getElementById("co-payment").value,
      notes: document.getElementById("co-notes").value.trim(),
    };

    if (!customer.name || !customer.phone || !customer.email || !customer.city || !customer.address) {
      els.checkoutMsg.textContent = "Please complete all required fields.";
      return;
    }

    const order = {
      orderId: `TWM-${Date.now().toString().slice(-8)}`,
      customer,
      items: cart,
      total: cartSubtotal(cart),
      createdAt: new Date().toISOString(),
    };

    const orders = readJson(KEYS.orders, []);
    orders.unshift(order);
    saveJson(KEYS.orders, orders.slice(0, 50));

    saveCart([]);
    els.checkoutMsg.textContent = `Order placed successfully. ID: ${order.orderId}`;
    els.checkoutForm.reset();
    setTimeout(() => {
      closeCheckout();
      closeCart();
    }, 1200);
  }

  function bindEvents() {
    els.navToggle?.addEventListener("click", () => {
      els.navLinks.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      const nav = e.target.closest(".nav-links a[data-filter]");
      if (nav) {
        const key = nav.dataset.filter || "ALL";
        state.activeFilter = key;
        setActiveNav(key);
        applyFilters();
      }

      const card = e.target.closest("[data-filter-card]");
      if (card) {
        state.activeFilter = card.getAttribute("data-filter-card") || "ALL";
        setActiveNav(state.activeFilter);
        applyFilters();
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      const add = e.target.closest("[data-add-cart]");
      if (add) {
        addToCart({
          id: add.getAttribute("data-id") || "",
          name: add.getAttribute("data-name") || "Product",
          price: add.getAttribute("data-price") || "EUR 0",
          image: add.getAttribute("data-image") || "1.png",
          category: add.getAttribute("data-category") || "Category",
        });
      }

      const q = e.target.closest("[data-qty]");
      if (q) adjustQty(q.getAttribute("data-id"), q.getAttribute("data-qty"));

      const rem = e.target.closest("[data-remove]");
      if (rem) removeFromCart(rem.getAttribute("data-remove"));
    });

    els.search?.addEventListener("input", (e) => {
      state.query = String(e.target.value || "");
      applyFilters();
    });

    els.cartBtn?.addEventListener("click", openCart);
    els.cartClose?.addEventListener("click", closeCart);

    els.overlay?.addEventListener("click", () => {
      closeCart();
      closeCheckout();
    });

    els.clearCart?.addEventListener("click", () => saveCart([]));
    els.openCheckout?.addEventListener("click", openCheckout);
    els.checkoutClose?.addEventListener("click", closeCheckout);
    els.checkoutForm?.addEventListener("submit", placeOrder);

    els.newsletterForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = els.newsletterForm.querySelector("input")?.value?.trim();
      if (!email) return;
      alert("Thanks for subscribing. You will receive latest deals soon.");
      els.newsletterForm.reset();
    });
  }

  async function init() {
    bindEvents();
    state.cart = readCart();
    renderCart();

    const res = await fetch("products.json", { cache: "no-store" });
    const data = await res.json();
    state.products = Array.isArray(data) ? data : [];

    renderCategoryCards();
    applyFilters();
    renderBestSelling();
  }

  init().catch((err) => {
    console.error(err);
    if (els.productGrid) {
      els.productGrid.innerHTML = "<p>Failed to load products.</p>";
    }
  });
})();
