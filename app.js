(() => {
  const state = {
    products: [],
    filtered: [],
    activeFilter: "ALL",
    query: "",
    cart: [],
    visibleCount: 24,
  };

  const KEYS = {
    cart: "twm_cart_modern_v1",
    orders: "twm_orders_modern_v1",
    productsCache: "twm_products_cache_v2",
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

  function getPageSize() {
    return window.innerWidth <= 680 ? 12 : 24;
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

  function readProductsCache() {
    try {
      const data = JSON.parse(sessionStorage.getItem(KEYS.productsCache) || "null");
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function writeProductsCache(products) {
    try {
      sessionStorage.setItem(KEYS.productsCache, JSON.stringify(products));
    } catch {
      // Ignore storage quota issues on low-end devices
    }
  }

  function debounce(fn, wait = 220) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function ensureProductsLoadButton() {
    let btn = document.getElementById("products-load-more");
    if (btn) return btn;
    if (!els.productGrid) return null;
    const wrap = document.createElement("div");
    wrap.className = "load-wrap";
    btn = document.createElement("button");
    btn.id = "products-load-more";
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Load More";
    wrap.appendChild(btn);
    els.productGrid.insertAdjacentElement("afterend", wrap);
    return btn;
  }

  let revealObserver = null;

  function refreshRevealTargets() {
    const targets = document.querySelectorAll(
      ".hero-grid, .section, .category-card, .product-card, .trust-item, .newsletter-box"
    );
    targets.forEach((el) => {
      if (!el.classList.contains("reveal-item")) {
        el.classList.add("reveal-item");
      }
      if (!revealObserver) {
        el.classList.add("in-view");
      } else {
        revealObserver.observe(el);
      }
    });
  }

  function initRevealAnimations() {
    if (!("IntersectionObserver" in window)) {
      refreshRevealTargets();
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    refreshRevealTargets();
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

  function isBlockedBrand(product) {
    const name = String(product?.name || "");
    return /(ellie|ellietech)/i.test(name);
  }

  function hasSuspiciousImagePath(raw) {
    const src = String(raw || "").toLowerCase();
    if (!src) return true;
    return (
      src.includes("ellietech") ||
      src.includes("wp-content") ||
      src.includes("assets/products/") ||
      src.includes("assets\\products\\") ||
      /%e[0-9a-f]{2}/i.test(src) ||
      /[\u4e00-\u9fff]/.test(src)
    );
  }

  function svgPlaceholder(product) {
    const xmlEscape = (v) =>
      String(v || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const category = xmlEscape(String(product?.category || "ACCESSORY").toUpperCase());
    const sku = xmlEscape(String(product?.id || "0000"));
    const nameRaw = String(product?.name || "Premium Mobile Product").trim().replace(/\s+/g, " ");
    const name = xmlEscape(nameRaw.length > 34 ? `${nameRaw.slice(0, 33)}...` : nameRaw);

    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0b2f6e'/>
      <stop offset='55%' stop-color='#1854b0'/>
      <stop offset='100%' stop-color='#ff8a00'/>
    </linearGradient>
    <linearGradient id='glass' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='rgba(255,255,255,0.46)'/>
      <stop offset='100%' stop-color='rgba(255,255,255,0.08)'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='1200' fill='url(#bg)'/>
  <circle cx='980' cy='190' r='190' fill='rgba(255,255,255,0.15)'/>
  <circle cx='200' cy='1010' r='220' fill='rgba(255,255,255,0.12)'/>
  <rect x='120' y='120' width='960' height='960' rx='74' fill='url(#glass)' stroke='rgba(255,255,255,0.45)' stroke-width='4'/>
  <text x='600' y='360' text-anchor='middle' fill='#ffffff' font-family='Inter,Arial,sans-serif' font-size='62' font-weight='800'>THE WORLD MOBILE</text>
  <text x='600' y='462' text-anchor='middle' fill='#dce9ff' font-family='Inter,Arial,sans-serif' font-size='42' font-weight='700'>${category}</text>
  <text x='600' y='560' text-anchor='middle' fill='#ffd3a3' font-family='Inter,Arial,sans-serif' font-size='32' font-weight='600'>SKU ${sku}</text>
  <text x='600' y='670' text-anchor='middle' fill='#ffffff' font-family='Inter,Arial,sans-serif' font-size='36' font-weight='700'>${name}</text>
  <rect x='390' y='760' width='420' height='88' rx='44' fill='rgba(255,255,255,0.16)' stroke='rgba(255,255,255,0.40)'/>
  <text x='600' y='817' text-anchor='middle' fill='#ffffff' font-family='Inter,Arial,sans-serif' font-size='30' font-weight='700'>PREMIUM SERIES</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function safeProductImage(product) {
    const src = String(product?.image || "");
    return hasSuspiciousImagePath(src) ? svgPlaceholder(product) : src;
  }

  function productDetailUrl(product) {
    return `product.html?pid=${encodeURIComponent(product.id)}`;
  }

  function productCard(product) {
    const rating = calcRating(product.id);
    const detailUrl = productDetailUrl(product);
    const image = safeProductImage(product);
    return `
      <article class="product-card" data-product-url="${esc(detailUrl)}" tabindex="0" role="link" aria-label="Open ${esc(product.name)}">
        <a class="product-media product-media-link" href="${esc(detailUrl)}" aria-label="View details for ${esc(product.name)}">
          <img src="${esc(image)}" alt="${esc(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </a>
        <div class="product-body">
          <h3 class="product-title"><a class="product-title-link" href="${esc(detailUrl)}">${esc(product.name)}</a></h3>
          <p class="product-meta-line">${esc(product.category || "CATEGORY")} | SKU ${esc(product.id)}</p>
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
              data-image="${esc(image)}"
              data-category="${esc(product.category || "ACCESSORY")}">Add to Cart</button>
          </div>
          <a class="view-details-link" href="${esc(detailUrl)}">View details</a>
        </div>
      </article>`;
  }

  function renderProducts() {
    const visibleItems = state.filtered.slice(0, state.visibleCount);
    els.productGrid.innerHTML = visibleItems.map(productCard).join("");
    els.resultChip.textContent = `${visibleItems.length} / ${state.filtered.length} products`;

    const loadBtn = ensureProductsLoadButton();
    if (loadBtn) {
      loadBtn.style.display = state.visibleCount < state.filtered.length ? "inline-block" : "none";
    }
    refreshRevealTargets();
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
    refreshRevealTargets();
  }

  function pickCategoryImage(filter) {
    const picked = state.products.find((p) => isMatchByFilter(p, filter) && p.image);
    return picked ? safeProductImage(picked) : "1.png";
  }

  function renderCategoryCards() {
    const cards = [
      { key: "IPHONE", label: "iPhone", href: "iphone.html" },
      { key: "SAMSUNG", label: "Samsung", href: "samsung.html" },
      { key: "XIAOMI", label: "Xiaomi", href: "xiaomi.html" },
      { key: "ACCESSORIES", label: "Accessories", href: "accessories.html" },
    ];

    els.categoryGrid.innerHTML = cards
      .map(
        (c) => `
        <a class="category-card category-page-link" href="${esc(c.href)}" aria-label="Open ${esc(c.label)} category page">
          <div class="category-media">
            <img src="${esc(pickCategoryImage(c.key))}" alt="${esc(c.label)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
          </div>
          <div class="category-title-row">
            <h3>${esc(c.label)}</h3>
            <span>Explore</span>
          </div>
        </a>`
      )
      .join("");
    refreshRevealTargets();
  }

  function applyFilters(resetVisible = true) {
    if (resetVisible) state.visibleCount = getPageSize();
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
          <img src="${esc(safeProductImage(item))}" alt="${esc(item.name)}" />
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
        applyFilters(true);
      }

      const card = e.target.closest("[data-filter-card]");
      if (card) {
        state.activeFilter = card.getAttribute("data-filter-card") || "ALL";
        setActiveNav(state.activeFilter);
        applyFilters(true);
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

      const productCardEl = e.target.closest(".product-card[data-product-url]");
      if (productCardEl && !e.target.closest("a,button,input,textarea,select,label")) {
        const url = productCardEl.getAttribute("data-product-url");
        if (url) window.location.href = url;
      }

      const q = e.target.closest("[data-qty]");
      if (q) adjustQty(q.getAttribute("data-id"), q.getAttribute("data-qty"));

      const rem = e.target.closest("[data-remove]");
      if (rem) removeFromCart(rem.getAttribute("data-remove"));
    });

    document.addEventListener("keydown", (e) => {
      const card = e.target.closest?.(".product-card[data-product-url]");
      if (!card) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("a,button,input,textarea,select,label")) return;
      e.preventDefault();
      const url = card.getAttribute("data-product-url");
      if (url) window.location.href = url;
    });

    const onSearchInput = debounce((e) => {
      state.query = String(e.target.value || "");
      applyFilters(true);
    }, 220);
    els.search?.addEventListener("input", onSearchInput);

    const loadBtn = ensureProductsLoadButton();
    loadBtn?.addEventListener("click", () => {
      state.visibleCount += getPageSize();
      renderProducts();
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

  function initHeroSlider() {
    const slides = Array.from(document.querySelectorAll("#hero-slider .hero-slide"));
    if (slides.length < 2) return;

    let idx = 0;
    setInterval(() => {
      slides[idx].classList.remove("active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("active");
    }, 5000);
  }

  function initHeroParallax() {
    const hero = document.querySelector(".hero-grid");
    if (!hero) return;
    if (window.matchMedia("(max-width: 900px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = null;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      frame = null;
      hero.style.setProperty("--parallax-x", `${tx}px`);
      hero.style.setProperty("--parallax-y", `${ty}px`);
    };

    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = (x / rect.width - 0.5) * 14;
      const ny = (y / rect.height - 0.5) * 14;
      tx = Number.isFinite(nx) ? nx : 0;
      ty = Number.isFinite(ny) ? ny : 0;
      if (!frame) frame = requestAnimationFrame(apply);
    });

    hero.addEventListener("pointerleave", () => {
      tx = 0;
      ty = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    });
  }

  async function init() {
    bindEvents();
    initHeroSlider();
    initHeroParallax();
    initRevealAnimations();
    state.visibleCount = getPageSize();
    state.cart = readCart();
    renderCart();

    const cached = readProductsCache();
    if (cached) {
      state.products = cached.filter((p) => !isBlockedBrand(p));
    } else {
      const res = await fetch("products.json", { cache: "force-cache" });
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      writeProductsCache(normalized);
      state.products = normalized.filter((p) => !isBlockedBrand(p));
    }

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
