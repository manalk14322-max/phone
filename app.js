(() => {
  const state = {
    products: [],
    filtered: [],
    activeFilter: "ALL",
    query: "",
    cart: [],
    visibleCount: 24,
  };

  const PLACEHOLDER_IMAGE = "1.png";
  const CATALOG = window.TWM_CATALOG || {};
  const augmentProducts = CATALOG.augmentProducts || ((items) => items);
  const resolveProductImage = CATALOG.resolveProductImage || (() => PLACEHOLDER_IMAGE);

  function normalizeText(v) {
    return String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function stableHash(value) {
    let hash = 0;
    const text = String(value || "");
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function canonicalCategory(product) {
    const text = normalizeText(
      [
        product?.name,
        product?.brand,
        product?.compatibleModel,
        product?.category,
        ...(Array.isArray(product?.tags) ? product.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (/oferta|offer|sale|promo|descuento/.test(text)) return "OFERTA";
    if (/sim|e ?sim|vodafone|orange|lebara|llamaya|movistar/.test(text)) return "SIM";
    if (/(camera|camara|lente|lens)/.test(text) && /(protector|glass|cristal|templad|shield|film)/.test(text)) {
      return "PROTECTORES_CAMERA";
    }
    if (/(screen protector|protector.*pantall|pantalla|cristal templado|tempered glass)/.test(text)) {
      return "PROTECTORES_PHONE";
    }
    if (/(power ?bank|bateria externa|powerbank)/.test(text)) return "POWER_BANK";
    if (/(smart ?watch|watch band|correa|pulsera|mi band|xm band)/.test(text)) return "SMART_WATCH";
    if (/(airpods case|air pods case|airpods protection case|air pods protection case|airpods cover|air pods cover)/.test(text)) {
      return "MOBILE_ACCESSORIES";
    }
    if (/(airpods|earbuds|earphone|headphone|audio|speaker|auriculares)/.test(text)) return "AUDIO";
    if (/(cordon|lanyard|soporte|stand|holder|car mount|magnetic card)/.test(text)) return "MOBILE_ACCESSORIES";
    if (/(funda|fundas|case|cover|carcasa|bumper|magsafe|silicona|silicone)/.test(text)) return "FUNDAS";
    if (/(charger|cargador|cable|usb|adapter|adaptador|sd card|tarjeta memoria|flash drive|memoria)/.test(text)) {
      return "ACCESSORIES";
    }

    const category = normalizeText(product?.category);
    if (["accessories", "accesorios", "gadgets", "phone"].includes(category)) return "ACCESSORIES";
    if (category.includes("protector") && category.includes("pantall")) return "PROTECTORES_PHONE";
    if (
      category.includes("protector") &&
      (category.includes("camera") || category.includes("camara") || category.includes("lente") || category.includes("lens"))
    ) {
      return "PROTECTORES_CAMERA";
    }

    return "ACCESSORIES";
  }

  function categoryLabel(key) {
    const map = {
      FUNDAS: "Cases",
      SIM: "SIM Cards",
      PROTECTORES_PHONE: "Screen Protectors",
      PROTECTORES_CAMERA: "Camera Protectors",
      POWER_BANK: "Power Banks",
      AUDIO: "Audio",
      OFERTA: "Offers",
      OFFERS: "Offers",
      SMART_WATCH: "Smart Watches",
      MOBILE_ACCESSORIES: "Mobile Accessories",
      ACCESSORIES: "Accessories",
    };
    return map[String(key || "").toUpperCase()] || String(key || "Category");
  }

  const KEYS = {
    cart: "twm_cart_modern_v1",
    orders: "twm_orders_modern_v1",
    productsCache: "twm_products_cache_v10",
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
      ".hero-grid, .section, .category-card, .featured-category-card, .spotlight-card, .product-card, .trust-item, .newsletter-box"
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

  function productText(product) {
    const parts = [
      product?.name,
      product?.brand,
      product?.compatibleModel,
      product?.category,
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function isMatchByFilter(product, filterKey) {
    const text = productText(product);
    const category = String(product.category || "").toLowerCase();
    const canonical = canonicalCategory(product);
    if (canonical === String(filterKey || "").toUpperCase()) return true;
    switch (filterKey) {
      case "FUNDAS":
        return /(funda|case|magsafe|cover|silicona|carcasa|bumper)/.test(text);
      case "SIM":
        return /(sim|e ?sim|vodafone|orange|lebara|llamaya|movistar)/.test(text + " " + category);
      case "PROTECTORES_PHONE":
        return /(protector|cristal|templado|screen protector)/.test(text + " " + category) && !/(camera|camara|lente|lens)/.test(text);
      case "PROTECTORES_CAMERA":
        return /(camera|camara|lente|lens)/.test(text) && /(protector|glass|cristal|templado)/.test(text);
      case "POWER_BANK":
        return /(power ?bank|bateria externa|wireless power|magnetic wireless)/.test(text + " " + category);
      case "AUDIO":
        return /(audio|earphone|auricular|airpods|earbuds|headphone)/.test(text + " " + category);
      case "OFERTA":
        return /(oferta|offer|sale|promo|descuento)/.test(text + " " + category);
      case "OFFERS":
        return /(oferta|offer|sale|promo|descuento)/.test(text + " " + category);
      case "SMART_WATCH":
        return /(smart ?watch|watch band|band|pulsera|mi band|xm ?band|correa)/.test(text + " " + category);
      case "MOBILE_ACCESSORIES":
        return /(cordon|lanyard|magnetic card|soporte|stand|holder|car mount|air pods|airpods)/.test(text + " " + category);
      case "ACCESSORIES":
        return /(fast charger|charger|cargador|cable|wireless speaker|speaker|travel adapter|adaptador|sd card|usb|flash drive|memoria)/.test(
          text + " " + category
        );
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

  function isBlockedBrand() {
    return false;
  }

  function productDetailUrl(product) {
    return `product.html?pid=${encodeURIComponent(product.id)}`;
  }

  function productCard(product) {
    const rating = calcRating(product.id);
    const detailUrl = productDetailUrl(product);
    return `
      <article class="product-card" data-product-url="${esc(detailUrl)}" tabindex="0" role="link" aria-label="Open ${esc(product.name)}">
        <a class="product-media product-media-link" href="${esc(detailUrl)}" aria-label="View details for ${esc(product.name)}">
          <img src="${esc(resolveProductImage(product))}" alt="${esc(product.name)}" loading="lazy" />
        </a>
        <div class="product-body">
          <h3 class="product-title"><a class="product-title-link" href="${esc(detailUrl)}">${esc(product.name)}</a></h3>
          <p class="product-meta-line">${esc(categoryLabel(canonicalCategory(product)))} | SKU ${esc(product.sku || product.id)}</p>
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
              data-image="${esc(resolveProductImage(product))}"
              data-category="${esc(categoryLabel(canonicalCategory(product)))}">Add to Cart</button>
          </div>
          <a class="view-details-link" href="${esc(detailUrl)}">View details</a>
        </div>
      </article>`;
  }

  function syncCardFrameRatios(root = document) {
    root.querySelectorAll(".product-media, .card-link").forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img) return;
      const apply = () => {
        const width = img.naturalWidth || 1;
        const height = img.naturalHeight || 1;
        frame.style.setProperty("--card-frame-ratio", `${width} / ${height}`);
      };
      apply();
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener("load", apply, { once: true });
        img.addEventListener("error", apply, { once: true });
      }
    });
  }

  function renderProducts() {
    const visibleItems = state.filtered.slice(0, state.visibleCount);
    els.productGrid.innerHTML = visibleItems.map(productCard).join("");
    syncCardFrameRatios(els.productGrid);
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
      if (seen.has(String(p.id))) continue;
      unique.push(p);
      seen.add(String(p.id));
      if (unique.length >= 8) break;
    }

    els.bestGrid.innerHTML = unique.map(productCard).join("");
    syncCardFrameRatios(els.bestGrid);
    refreshRevealTargets();
  }

  function pickCategoryImage(filter) {
    const key = String(filter || "").toUpperCase();
    const candidates = state.products.filter((product) => canonicalCategory(product) === key);
    if (candidates.length) {
      const index = stableHash(`${key}|${candidates.length}`) % candidates.length;
      return resolveProductImage(candidates[index]);
    }

    const simProducts = window.TWM_CATALOG?.simProducts || [];
    const simCandidates = simProducts.filter((product) => canonicalCategory(product) === key);
    if (simCandidates.length) {
      const index = stableHash(`${key}|sim|${simCandidates.length}`) % simCandidates.length;
      return resolveProductImage(simCandidates[index]);
    }

    return PLACEHOLDER_IMAGE;
  }

  const FEATURED_CATEGORY_ITEMS = [
    { key: "FUNDAS", label: "Fundas", sublabel: "Cases and covers", href: "iphone.html?cat=FUNDAS", filter: "FUNDAS" },
    { key: "SIM", label: "SIM Cards", sublabel: "SIM and eSIM", href: "iphone.html?cat=SIM", filter: "SIM" },
    { key: "PROTECTORES_PHONE", label: "Screen Protectors", sublabel: "Tempered glass", href: "iphone.html?cat=PROTECTORES_PHONE", filter: "PROTECTORES_PHONE" },
    { key: "PROTECTORES_CAMERA", label: "Camera Protectors", sublabel: "Lens protection", href: "iphone.html?cat=PROTECTORES_CAMERA", filter: "PROTECTORES_CAMERA" },
    { key: "POWER_BANK", label: "Power Banks", sublabel: "Portable charging", href: "iphone.html?cat=POWER_BANK", filter: "POWER_BANK" },
    { key: "AUDIO", label: "Audio", sublabel: "Earbuds and speakers", href: "iphone.html?cat=AUDIO", filter: "AUDIO" },
    { key: "OFERTA", label: "Offers", sublabel: "Deals and promos", href: "iphone.html?cat=OFERTA", filter: "OFERTA" },
    { key: "SMART_WATCH", label: "Smart Watches", sublabel: "Watches and bands", href: "iphone.html?cat=SMART_WATCH", filter: "SMART_WATCH" },
    { key: "MOBILE_ACCESSORIES", label: "Mobile Accessories", sublabel: "Holders and stands", href: "iphone.html?cat=MOBILE_ACCESSORIES", filter: "MOBILE_ACCESSORIES" },
    { key: "ACCESSORIES", label: "Accessories", sublabel: "Chargers and cables", href: "iphone.html?cat=ACCESSORIES", filter: "ACCESSORIES" },
    { key: "IPHONE_17", label: "iPhone 17", sublabel: "Latest cases", href: "iphone.html?cat=FUNDAS&sub=IPHONE_17", filter: "FUNDAS", query: "iphone 17" },
    { key: "TWS_EARBUDS", label: "TWS Earbuds", sublabel: "Audio picks", href: "iphone.html?cat=AUDIO", filter: "AUDIO", query: "tws earbuds" },
  ];

  function pickFeaturedCandidates(item) {
    const filterKey = String(item?.filter || "").toUpperCase();
    const query = normalizeText(item?.query || item?.label || "");
    const pool = state.products.filter((product) => isMatchByFilter(product, filterKey));
    if (!query) return pool;
    const exact = pool.filter((product) => normalizeText(productText(product)).includes(query));
    return exact.length ? exact : pool;
  }

  function pickFeaturedImage(item) {
    const candidates = pickFeaturedCandidates(item);
    if (!candidates.length) return pickCategoryImage(item?.filter || "");
    const index = stableHash(`${item?.key || ""}|${candidates.length}`) % candidates.length;
    return resolveProductImage(candidates[index]);
  }

  function pickFeaturedCount(item) {
    return pickFeaturedCandidates(item).length;
  }

  const FEATURED_SPOTLIGHT_ITEMS = [
    {
      key: "REDMI_13C",
      kicker: "XIAOMI",
      title: "Redmi 13C",
      button: "To Shop",
      href: "iphone.html?cat=FUNDAS&sub=REDMI",
      filter: "FUNDAS",
      query: "redmi 13c",
      copy: "Redmi covers and accessories",
      reverse: false,
    },
    {
      key: "SAMSUNG_S24_ULTRA",
      kicker: "SAMSUNG",
      title: "Galaxy S24 Ultra",
      button: "To Shop",
      href: "iphone.html?cat=FUNDAS&sub=SAMSUNG",
      filter: "FUNDAS",
      query: "s24 ultra",
      copy: "Samsung covers and protectors",
      reverse: true,
    },
  ];

  function pickSpotlightCandidates(item) {
    const filterKey = String(item?.filter || "").toUpperCase();
    const query = normalizeText(item?.query || item?.title || "");
    const pool = state.products.filter((product) => isMatchByFilter(product, filterKey));
    if (!query) return pool;
    const exact = pool.filter((product) => normalizeText(productText(product)).includes(query));
    return exact.length ? exact : pool;
  }

  function pickSpotlightImage(item) {
    const candidates = pickSpotlightCandidates(item);
    if (!candidates.length) return pickCategoryImage(item?.filter || "");
    const index = stableHash(`${item?.key || ""}|${candidates.length}`) % candidates.length;
    return resolveProductImage(candidates[index]);
  }

  function renderFeaturedSpotlight() {
    if (document.getElementById("featured-spotlight")) return;

    const section = document.createElement("section");
    section.className = "section featured-spotlight-section";
    section.id = "featured-spotlight";
    section.innerHTML = `
      <div class="container">
        <div class="section-head section-head-row">
          <h2>Featured Products</h2>
        </div>
        <div class="featured-spotlight-grid">
          ${FEATURED_SPOTLIGHT_ITEMS.map((item) => `
            <a class="spotlight-card${item.reverse ? " spotlight-card--reverse" : ""}${item.key === "SAMSUNG_S24_ULTRA" ? " spotlight-card--samsung" : " spotlight-card--redmi"}" href="${esc(item.href)}" aria-label="Open ${esc(item.title)}">
              <div class="spotlight-media">
                <img src="${esc(pickSpotlightImage(item))}" alt="${esc(item.title)}" loading="lazy" />
              </div>
              <div class="spotlight-copy">
                <em class="spotlight-kicker">${esc(item.kicker)}</em>
                <strong class="spotlight-title">${esc(item.title)}</strong>
                <p class="spotlight-desc">${esc(item.copy)}</p>
                <span class="spotlight-cta">${esc(item.button)}</span>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    `;

    const anchor =
      document.getElementById("featured-categories") ||
      document.getElementById("best-selling") ||
      document.getElementById("shop-category") ||
      document.getElementById("products") ||
      document.querySelector("section.hero");
    if (anchor?.parentElement) {
      anchor.insertAdjacentElement("afterend", section);
    } else {
      document.querySelector("main")?.insertAdjacentElement("afterbegin", section) || document.body.appendChild(section);
    }

    refreshRevealTargets();
  }

  function renderFeaturedCategories() {
    if (document.getElementById("featured-categories")) return;

    const section = document.createElement("section");
    section.className = "section featured-categories-section";
    section.id = "featured-categories";
    section.innerHTML = `
      <div class="container">
        <div class="section-head">
          <h2>Featured categories</h2>
        </div>
        <div class="featured-categories-track" aria-label="Featured categories">
          ${FEATURED_CATEGORY_ITEMS.map((item) => {
            const count = pickFeaturedCount(item);
            return `
              <a class="featured-category-card" href="${esc(item.href)}" aria-label="Open ${esc(item.label)}">
                <div class="featured-category-media">
                  <img src="${esc(pickFeaturedImage(item))}" alt="${esc(item.label)}" loading="lazy" />
                </div>
                <div class="featured-category-copy">
                  <em>${esc(item.sublabel || "Featured")}</em>
                  <strong>${esc(item.label)}</strong>
                  <span>${count} products</span>
                </div>
              </a>`;
          }).join("")}
        </div>
      </div>
    `;

    const anchor =
      document.getElementById("best-selling") ||
      document.getElementById("shop-category") ||
      document.getElementById("products") ||
      document.querySelector("section.hero");
    if (anchor?.parentElement) {
      anchor.insertAdjacentElement("afterend", section);
    } else {
      document.querySelector("main")?.insertAdjacentElement("afterbegin", section) || document.body.appendChild(section);
    }

    refreshRevealTargets();
  }

  function renderCategoryCards() {
    if (!els.categoryGrid || els.categoryGrid.dataset.static === "1") return;
    const cards = [
      { key: "FUNDAS", label: "Fundas", href: "iphone.html?cat=FUNDAS" },
      { key: "SIM", label: "SIM Cards", href: "iphone.html?cat=SIM" },
      { key: "PROTECTORES_PHONE", label: "Protectores Phone", href: "iphone.html?cat=PROTECTORES_PHONE" },
      { key: "PROTECTORES_CAMERA", label: "Protectores Camera", href: "iphone.html?cat=PROTECTORES_CAMERA" },
      { key: "POWER_BANK", label: "Power Bank", href: "iphone.html?cat=POWER_BANK" },
      { key: "AUDIO", label: "Audio", href: "iphone.html?cat=AUDIO" },
      { key: "OFERTA", label: "Oferta", href: "iphone.html?cat=OFERTA" },
      { key: "SMART_WATCH", label: "Smart Watch", href: "iphone.html?cat=SMART_WATCH" },
      { key: "MOBILE_ACCESSORIES", label: "Mobile Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=ACCESSORIES" },
    ];

    els.categoryGrid.innerHTML = cards
      .map(
        (c) => `
        <a class="category-card category-page-link" href="${esc(c.href)}" aria-label="Open ${esc(c.label)} category page">
          <div class="category-media">
            <img src="${esc(pickCategoryImage(c.key))}" alt="${esc(c.label)}" loading="lazy" />
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
          <img src="${esc(resolveProductImage(item))}" alt="${esc(item.name)}" />
          <div>
            <h4>${esc(item.name)}</h4>
            <p class="meta">${esc(categoryLabel(item.category))}</p>
            ${item.variantLabel ? `<p class="meta">${esc(item.variantLabel)}</p>` : ""}
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
      cart.push({ ...item, image: resolveProductImage(item), category: categoryLabel(canonicalCategory(item)), qty: 1 });
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
      const open = els.navLinks.classList.toggle("open");
      els.navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("mobile-menu-open", open);
    });

    document.addEventListener("click", (e) => {
      const closeMenu = e.target.closest(".mobile-menu-close");
      const navLink = e.target.closest("#nav-links a");
      if ((closeMenu || navLink) && els.navLinks?.classList.contains("open")) {
        els.navLinks.classList.remove("open");
        els.navToggle?.setAttribute("aria-expanded", "false");
        document.body.classList.remove("mobile-menu-open");
      }

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
    const slider = document.getElementById("hero-slider");
    const slides = Array.from(document.querySelectorAll("#hero-slider .hero-slide"));
    if (slides.length < 2) return;
    slider?.classList.add("js-slider");

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
    if (cached && cached.length) {
      const augmented = augmentProducts(cached);
      if (augmented.length !== cached.length) writeProductsCache(augmented);
      state.products = augmented.filter((p) => !isBlockedBrand(p));
    } else {
      const tryFetch = async (url) => {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      };

      let normalized = await tryFetch("products.json?v=20260314-01");
      if (!normalized || !normalized.length) {
        normalized = await tryFetch("docs/products.json?v=20260314-01");
      }
      if (!normalized) normalized = [];
      normalized = augmentProducts(normalized);
      writeProductsCache(normalized);
      state.products = normalized.filter((p) => !isBlockedBrand(p));
    }

    renderCategoryCards();
    renderFeaturedCategories();
    renderFeaturedSpotlight();
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



