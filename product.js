(() => {
  const pid = new URLSearchParams(window.location.search).get("pid");
  const root = document.getElementById("product-detail");
  const CART_KEY = "twm_cart_modern_v1";
  const PRODUCTS_CACHE_KEY = "twm_products_cache_v2";

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

  function readProductsCache() {
    try {
      const data = JSON.parse(sessionStorage.getItem(PRODUCTS_CACHE_KEY) || "null");
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function writeProductsCache(products) {
    try {
      sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage quota issues
    }
  }

  function priceText(v) {
    const s = String(v || "").trim();
    return s || "EUR 0.00";
  }

  function calcRating(id) {
    const n = Number(id || 0);
    return 4 + ((n % 10) / 10);
  }

  function starRow(rating) {
    const rounded = Math.round(rating);
    const full = "&#9733;".repeat(Math.min(5, Math.max(0, rounded)));
    const empty = "&#9734;".repeat(Math.max(0, 5 - rounded));
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

  function detectBrand(name) {
    const source = String(name || "").toLowerCase();
    if (/iphone|apple/.test(source)) return "Apple";
    if (/samsung/.test(source)) return "Samsung";
    if (/xiaomi|redmi|poco/.test(source)) return "Xiaomi";
    if (/huawei|honor/.test(source)) return "Huawei / Honor";
    if (/realme/.test(source)) return "Realme";
    if (/oppo/.test(source)) return "OPPO";
    if (/vivo/.test(source)) return "Vivo";
    return "Universal";
  }

  function detectModel(name) {
    const source = String(name || "");
    const match = source.match(/\bpara\s+(.+)$/i);
    if (match && match[1]) return match[1].trim();
    return "Multi-model compatibility";
  }

  function addToCartFromData(data) {
    const cart = readJson(CART_KEY, []);
    const existing = cart.find((x) => String(x.id) === String(data.id));
    if (existing) {
      existing.qty = Number(existing.qty || 0) + 1;
    } else {
      cart.push({
        id: data.id,
        name: data.name,
        price: data.price,
        image: data.image,
        category: data.category,
        qty: 1,
      });
    }
    saveJson(CART_KEY, cart);
    return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  function renderNotFound() {
    root.innerHTML = `
      <section class="pd-not-found">
        <h1>Product not found</h1>
        <p>This product is not available right now.</p>
        <a class="pd-btn secondary" href="index.html#products">Back to Products</a>
      </section>`;
  }

  function relatedProducts(all, product, limit) {
    const sameCategory = all.filter((x) => x.category === product.category && String(x.id) !== String(product.id));
    if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
    const fallback = all.filter((x) => String(x.id) !== String(product.id));
    return [...sameCategory, ...fallback].slice(0, limit);
  }

  function renderProduct(product, allProducts) {
    const image = safeProductImage(product);
    const rating = calcRating(product.id);
    const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean).slice(0, 6) : [];
    const stockText = Number(product.id || 0) % 4 === 0 ? "Low stock" : "In stock";
    const brand = detectBrand(product.name);
    const model = detectModel(product.name);
    const related = relatedProducts(allProducts, product, 8);

    document.title = `${product.name} | The World Mobile`;

    root.innerHTML = `
      <section class="pd-shell">
        <div class="pd-media-wrap">
          <img class="pd-main-image" src="${esc(image)}" alt="${esc(product.name)}" loading="eager" onerror="this.onerror=null;this.src='1.png';" />
        </div>
        <div class="pd-main-info">
          <p class="pd-category">${esc(product.category || "Category")}</p>
          <h1 class="pd-title">${esc(product.name)}</h1>
          <div class="pd-rating-row">
            <span class="stars">${starRow(rating)}</span>
            <span class="rating-value">${rating.toFixed(1)} rating</span>
          </div>
          <div class="pd-price">${esc(priceText(product.price))}</div>
          <p class="pd-description">High-quality mobile product for Spain wholesale and retail business. Durable build, premium finish, and reliable daily performance.</p>

          <div class="pd-actions">
            <button
              type="button"
              class="pd-btn primary"
              data-add-cart="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(priceText(product.price))}"
              data-image="${esc(image)}"
              data-category="${esc(product.category || "Category")}">Add to Cart</button>
            <button
              type="button"
              class="pd-btn secondary"
              data-buy-now="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(priceText(product.price))}"
              data-image="${esc(image)}"
              data-category="${esc(product.category || "Category")}">Buy Now</button>
            <a class="pd-btn ghost" href="index.html#products">Back to Products</a>
          </div>

          <p class="pd-status" id="pd-status"></p>

          <div class="pd-meta-grid">
            <div class="pd-meta-item"><strong>SKU</strong><span>TWM-${esc(product.id)}</span></div>
            <div class="pd-meta-item"><strong>Brand</strong><span>${esc(brand)}</span></div>
            <div class="pd-meta-item"><strong>Model</strong><span>${esc(model)}</span></div>
            <div class="pd-meta-item"><strong>Availability</strong><span>${esc(stockText)}</span></div>
            <div class="pd-meta-item"><strong>Delivery</strong><span>24-48h in Spain</span></div>
            <div class="pd-meta-item"><strong>Returns</strong><span>14-day support</span></div>
          </div>

          ${
            tags.length
              ? `<div class="pd-tag-row">${tags.map((t) => `<span class="pd-tag">${esc(t)}</span>`).join("")}</div>`
              : ""
          }
        </div>
      </section>

      <section class="pd-related">
        <div class="section-head section-head-row">
          <h2>Related Products</h2>
          <span class="result-chip">${related.length} items</span>
        </div>
        <div class="pd-related-grid">
          ${related
            .map(
              (item) => `
            <article class="pd-related-card">
              <a class="pd-related-media" href="product.html?pid=${encodeURIComponent(item.id)}">
                <img src="${esc(safeProductImage(item))}" alt="${esc(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
              </a>
              <div class="pd-related-body">
                <h3><a href="product.html?pid=${encodeURIComponent(item.id)}">${esc(item.name)}</a></h3>
                <p>${esc(item.category || "Category")}</p>
                <strong>${esc(priceText(item.price))}</strong>
              </div>
            </article>`
            )
            .join("")}
        </div>
      </section>`;
  }

  function bindActions() {
    root.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-cart]");
      if (add) {
        const totalItems = addToCartFromData({
          id: add.getAttribute("data-id") || "",
          name: add.getAttribute("data-name") || "Product",
          price: add.getAttribute("data-price") || "EUR 0.00",
          image: add.getAttribute("data-image") || "1.png",
          category: add.getAttribute("data-category") || "Category",
        });
        const status = document.getElementById("pd-status");
        if (status) status.textContent = `Added to cart. Cart now has ${totalItems} item(s).`;
        return;
      }

      const buy = e.target.closest("[data-buy-now]");
      if (buy) {
        addToCartFromData({
          id: buy.getAttribute("data-id") || "",
          name: buy.getAttribute("data-name") || "Product",
          price: buy.getAttribute("data-price") || "EUR 0.00",
          image: buy.getAttribute("data-image") || "1.png",
          category: buy.getAttribute("data-category") || "Category",
        });
        window.location.href = "index.html#products";
      }
    });
  }

  async function init() {
    if (!pid || !root) {
      renderNotFound();
      return;
    }

    bindActions();
    const cached = readProductsCache();
    const allSource = cached
      ? cached
      : await (async () => {
          const res = await fetch("products.json", { cache: "force-cache" });
          const loaded = await res.json();
          const normalized = Array.isArray(loaded) ? loaded : [];
          writeProductsCache(normalized);
          return normalized;
        })();
    const items = allSource.filter((p) => !isBlockedBrand(p));
    const product = items.find((x) => String(x.id) === String(pid));
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product, items);
  }

  init().catch(renderNotFound);
})();

