(() => {
  const pid = new URLSearchParams(window.location.search).get("pid");
  const root = document.getElementById("product-detail");
  const CART_KEY = "twm_cart_modern_v1";
  const PRODUCTS_CACHE_KEY = "twm_products_cache_v4";
  const PLACEHOLDER_IMAGE = "1.png";
  const CATALOG = window.TWM_CATALOG || {};
  const CURATED_17_PRO_MAX = Array.isArray(CATALOG.curatedIphone17ProMaxProducts) ? CATALOG.curatedIphone17ProMaxProducts : [];
  const augmentProducts = CATALOG.augmentProducts || ((items) => items);
  const resolveProductImage = CATALOG.resolveProductImage || ((product) => String(product?.image || PLACEHOLDER_IMAGE));
  const getCoverVariants = CATALOG.getCoverVariants || (() => []);

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

  function normalizeText(v) {
    return String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
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

  function starRow(rating) {
    const rounded = Math.round(rating);
    const full = "&#9733;".repeat(Math.min(5, Math.max(0, rounded)));
    const empty = "&#9734;".repeat(Math.max(0, 5 - rounded));
    return `${full}${empty}`;
  }

  function isBlockedBrand() {
    return false;
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
        image: resolveProductImage(data),
        category: categoryLabel(canonicalCategory(data)),
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
    if (String(product?.sourceTag || "") === "iphone-17-pro-max-curated") {
      return CURATED_17_PRO_MAX.filter((x) => String(x.id) !== String(product.id)).slice(0, limit);
    }
    const targetCategory = canonicalCategory(product);
    const sameCategory = all.filter((x) => canonicalCategory(x) === targetCategory && String(x.id) !== String(product.id));
    if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
    const fallback = all.filter((x) => String(x.id) !== String(product.id));
    return [...sameCategory, ...fallback].slice(0, limit);
  }

  function renderProduct(product, allProducts) {
    const rating = calcRating(product.id);
    const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean).slice(0, 6) : [];
    const stockText = Number(product.id || 0) % 4 === 0 ? "Low stock" : "In stock";
    const brand = product.brand || detectBrand(product.name);
    const model = product.compatibleModel || detectModel(product.name);
    const baseImage = resolveProductImage(product);
    const coverVariants = getCoverVariants(product);
    const initialVariant = coverVariants[0] || { label: "Original", swatch: "#ffffff", opacity: 0 };
    const description =
      product.shortDescription ||
      "High-quality mobile product for Spain wholesale and retail business. Durable build, premium finish, and reliable daily performance.";
    const related = relatedProducts(allProducts, product, 8);

    document.title = `${product.name} | The World Mobile`;

    root.innerHTML = `
      <section class="pd-shell">
        <div class="pd-media-wrap">
          <div class="pd-media-stage" data-pd-stage style="--cover-tint:${esc(initialVariant.swatch)}; --cover-opacity:${esc(String(initialVariant.opacity ?? 0))};">
            <img class="pd-main-image" data-pd-main-image src="${esc(baseImage)}" alt="${esc(product.name)}" loading="eager" />
            <span class="pd-case-overlay" data-case-overlay aria-hidden="true"></span>
          </div>
          ${
            coverVariants.length
              ? `
            <div class="pd-variant-panel" aria-label="Cover color variants">
              <div class="pd-variant-head">
                <span>Color Options</span>
                <strong>${coverVariants.length} variants</strong>
              </div>
              <div class="pd-variant-grid">
                ${coverVariants
                  .map(
                    (variant, index) => `
                    <button
                      type="button"
                      class="pd-variant-btn${index === 0 ? " is-active" : ""}"
                      data-cover-variant="1"
                      data-variant-label="${esc(variant.label)}"
                      data-variant-swatch="${esc(variant.swatch)}"
                      data-variant-opacity="${esc(String(variant.opacity ?? 0))}"
                      aria-label="${esc(variant.label)}">
                      <span class="pd-variant-thumb">
                        <img src="${esc(baseImage)}" alt="" loading="lazy" />
                        <span class="pd-variant-thumb-overlay" style="--variant-tint:${esc(variant.swatch)}; --variant-opacity:${esc(String(variant.opacity ?? 0))};"></span>
                      </span>
                      <span class="pd-variant-label">${esc(variant.label)}</span>
                    </button>`
                  )
                  .join("")}
              </div>
            </div>`
              : ""
          }
        </div>
        <div class="pd-main-info">
          <p class="pd-category">${esc(categoryLabel(canonicalCategory(product)))}</p>
          <h1 class="pd-title">${esc(product.name)}</h1>
          <div class="pd-rating-row">
            <span class="stars">${starRow(rating)}</span>
            <span class="rating-value">${rating.toFixed(1)} rating</span>
          </div>
          <div class="pd-price">${esc(priceText(product.price))}</div>
          <p class="pd-description">${esc(description)}</p>

          <div class="pd-actions">
            <button
              type="button"
              class="pd-btn primary"
              data-add-cart="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(priceText(product.price))}"
              data-image="${esc(baseImage)}"
              data-category="${esc(categoryLabel(canonicalCategory(product)))}">Add to Cart</button>
            <button
              type="button"
              class="pd-btn secondary"
              data-buy-now="1"
              data-id="${esc(product.id)}"
              data-name="${esc(product.name)}"
              data-price="${esc(priceText(product.price))}"
              data-image="${esc(baseImage)}"
              data-category="${esc(categoryLabel(canonicalCategory(product)))}">Buy Now</button>
            <a class="pd-btn ghost" href="index.html#products">Back to Products</a>
          </div>

          <p class="pd-status" id="pd-status"></p>

          <div class="pd-meta-grid">
            <div class="pd-meta-item"><strong>SKU</strong><span>${esc(product.sku || ("TWM-" + product.id))}</span></div>
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
                <img src="${esc(resolveProductImage(item))}" alt="${esc(item.name)}" loading="lazy" />
              </a>
              <div class="pd-related-body">
                <h3><a href="product.html?pid=${encodeURIComponent(item.id)}">${esc(item.name)}</a></h3>
                <p>${esc(categoryLabel(canonicalCategory(item)))}</p>
                <strong>${esc(priceText(item.price))}</strong>
              </div>
            </article>`
            )
            .join("")}
        </div>
      </section>`;

    root.dataset.activeVariant = coverVariants[0]?.label || "Original";
    root.dataset.activeVariantSwatch = coverVariants[0]?.swatch || "#ffffff";
    root.dataset.activeVariantOpacity = String(coverVariants[0]?.opacity ?? 0);
  }

  function bindActions() {
    root.addEventListener("click", (e) => {
      const variant = e.target.closest("[data-cover-variant]");
      if (variant) {
        const mainImage = root.querySelector("[data-pd-main-image]");
        const stage = root.querySelector("[data-pd-stage]");
        const overlay = root.querySelector("[data-case-overlay]");
        const label = variant.getAttribute("data-variant-label") || "Original";
        const swatch = variant.getAttribute("data-variant-swatch") || "#ffffff";
        const opacity = variant.getAttribute("data-variant-opacity") || "0";
        if (mainImage) {
          mainImage.style.filter = "none";
        }
        if (stage) {
          stage.style.setProperty("--cover-tint", swatch);
          stage.style.setProperty("--cover-opacity", opacity);
        }
        if (overlay) {
          overlay.style.background = swatch;
          overlay.style.opacity = opacity;
        }
        root.dataset.activeVariant = label;
        root.dataset.activeVariantSwatch = swatch;
        root.dataset.activeVariantOpacity = opacity;
        root.querySelectorAll("[data-cover-variant]").forEach((btn) => {
          btn.classList.toggle("is-active", btn === variant);
        });
        const status = document.getElementById("pd-status");
        if (status) {
          status.textContent = `${label} color selected.`;
        }
        return;
      }

      const add = e.target.closest("[data-add-cart]");
      if (add) {
        const data = {
          id: add.getAttribute("data-id") || "",
          name: add.getAttribute("data-name") || "Product",
          price: add.getAttribute("data-price") || "EUR 0.00",
          image: resolveProductImage({
            id: add.getAttribute("data-id") || "",
            name: add.getAttribute("data-name") || "Product",
            price: add.getAttribute("data-price") || "EUR 0.00",
            image: add.getAttribute("data-image") || PLACEHOLDER_IMAGE,
            category: add.getAttribute("data-category") || "Category",
          }),
          category: add.getAttribute("data-category") || "Category",
          variantLabel: root.dataset.activeVariant || "Original",
          variantSwatch: root.dataset.activeVariantSwatch || "#ffffff",
          variantOpacity: root.dataset.activeVariantOpacity || "0",
        };
        const totalItems = window.TWM_CART?.addToCart ? null : addToCartFromData(data);
        if (window.TWM_CART?.addToCart) {
          window.TWM_CART.addToCart(data);
        }
        const status = document.getElementById("pd-status");
        if (status) {
          status.textContent = totalItems === null
            ? "Added to cart."
            : `Added to cart. Cart now has ${totalItems} item(s).`;
        }
        return;
      }

      const buy = e.target.closest("[data-buy-now]");
      if (buy) {
        const data = {
          id: buy.getAttribute("data-id") || "",
          name: buy.getAttribute("data-name") || "Product",
          price: buy.getAttribute("data-price") || "EUR 0.00",
          image: resolveProductImage({
            id: buy.getAttribute("data-id") || "",
            name: buy.getAttribute("data-name") || "Product",
            price: buy.getAttribute("data-price") || "EUR 0.00",
            image: buy.getAttribute("data-image") || PLACEHOLDER_IMAGE,
            category: buy.getAttribute("data-category") || "Category",
          }),
          category: buy.getAttribute("data-category") || "Category",
          variantLabel: root.dataset.activeVariant || "Original",
          variantSwatch: root.dataset.activeVariantSwatch || "#ffffff",
          variantOpacity: root.dataset.activeVariantOpacity || "0",
        };
        if (window.TWM_CART?.addToCart) {
          window.TWM_CART.addToCart(data);
          window.TWM_CART.openCheckout?.();
        } else {
          addToCartFromData(data);
          window.location.href = "store.html";
        }
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
      ? (() => {
          const normalized = augmentProducts(cached);
          if (normalized.length !== cached.length) {
            writeProductsCache(normalized);
          }
          return normalized;
        })()
      : await (async () => {
          const res = await fetch("products.json?v=20260309-01", { cache: "force-cache" });
          const loaded = await res.json();
          const normalized = augmentProducts(Array.isArray(loaded) ? loaded : []);
          writeProductsCache(normalized);
          return normalized;
        })();
    const items = allSource.filter((p) => !isBlockedBrand(p));
    const product = CURATED_17_PRO_MAX.find((x) => String(x.id) === String(pid)) || items.find((x) => String(x.id) === String(pid));
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product, items);
  }

  init().catch(renderNotFound);
})();






