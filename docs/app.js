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
    productsCache: "twm_products_cache_v5",
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
          <img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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
              data-image="${esc(product.image)}"
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
    return picked?.image || "1.png";
  }

  function renderCategoryCards() {
    if (!els.categoryGrid || els.categoryGrid.dataset.static === "1") return;
    const cards = [
      { key: "FUNDAS", label: "Fundas", href: "iphone.html?cat=FUNDAS" },
      { key: "SIM", label: "SIM Card", href: "iphone.html?cat=SIM" },
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
      state.products = cached.filter((p) => !isBlockedBrand(p));
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



