(() => {
  const pid = new URLSearchParams(window.location.search).get("pid");
  const root = document.getElementById("product-detail");
  const CART_KEY = "twm_cart_modern_v1";

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
          <img class="pd-main-image" src="${esc(product.image)}" alt="${esc(product.name)}" loading="eager" onerror="this.onerror=null;this.src='1.png';" />
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
              data-image="${esc(product.image)}"
              data-category="${esc(product.category || "Category")}">Add to Cart</button>
            <button
              type="button"
              class="pd-btn secondary"
              data-buy-now="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(priceText(product.price))}"
              data-image="${esc(product.image)}"
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
                <img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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
    const res = await fetch("products.json", { cache: "no-store" });
    const all = await res.json();
    const items = (Array.isArray(all) ? all : []).filter((p) => !isBlockedBrand(p));
    const product = items.find((x) => String(x.id) === String(pid));
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product, items);
  }

  init().catch(renderNotFound);
})();

