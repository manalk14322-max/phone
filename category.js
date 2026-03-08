(() => {
  const urlKey = new URLSearchParams(window.location.search).get("cat");
  const bodyKey = document.body?.dataset?.cat;
  const key = String(urlKey || bodyKey || "ALL").trim().toUpperCase();
  const CART_KEY = "twm_cart_modern_v1";
  const PRODUCTS_CACHE_KEY = "twm_products_cache_v2";

  const els = {
    title: document.getElementById("cat-title"),
    sub: document.getElementById("cat-sub"),
    search: document.getElementById("cat-search"),
    count: document.getElementById("cat-count"),
    grid: document.getElementById("cat-grid"),
    loadMore: document.getElementById("cat-load-more"),
  };

  const state = {
    base: [],
    filtered: [],
    visible: 24,
  };

  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function priceText(v) {
    const s = String(v || "").trim();
    return s || "Wholesale Price";
  }

  function getPageSize() {
    return window.innerWidth <= 680 ? 12 : 24;
  }

  function debounce(fn, wait = 220) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
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

  function ensureLoadButton() {
    if (els.loadMore) return els.loadMore;
    if (!els.grid) return null;
    const wrap = document.createElement("div");
    wrap.className = "load-wrap";
    const btn = document.createElement("button");
    btn.id = "cat-load-more";
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Load More";
    wrap.appendChild(btn);
    els.grid.insertAdjacentElement("afterend", wrap);
    els.loadMore = btn;
    return btn;
  }

  function normalizeCategory(v) {
    return String(v || "").trim().toUpperCase();
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

  function isMatchByFilter(product, filterKey) {
    const name = String(product?.name || "").toLowerCase();
    const cat = normalizeCategory(product?.category);
    const f = String(filterKey || "ALL").toUpperCase();

    if (f === "ALL") return true;
    if (cat === f) return true;

    if (f === "IPHONE") return /iphone|apple/.test(name);
    if (f === "SAMSUNG") return /samsung/.test(name);
    if (f === "XIAOMI") return /xiaomi|redmi|poco/.test(name);
    if (f === "ACCESSORIES") {
      return (
        /(funda|case|magsafe|protector|cargador|cable|auricular|audio|power|soporte|cristal|templado|colgante|pulsera)/.test(name) ||
        [
          "FUNDA",
          "PROTECTORES PANTALLA",
          "CARGADORES",
          "CABLE",
          "AUDIO",
          "SOPORTE",
          "INFORMATICA",
          "GADGETS",
          "TARJETA MEMORIAS",
        ].includes(cat)
      );
    }

    return name.includes(f.toLowerCase());
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

  function addToCart(item) {
    const cart = (() => {
      try {
        const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(c) ? c : [];
      } catch {
        return [];
      }
    })();

    const existing = cart.find((x) => String(x.id) === String(item.id));
    if (existing) {
      existing.qty = Number(existing.qty || 0) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function render(items) {
    const visibleItems = items.slice(0, state.visible);
    els.grid.innerHTML = visibleItems
      .map((p) => {
        const image = safeProductImage(p);
        const rating = calcRating(p.id);
        return `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </a>
        <div class="card-body">
          <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
          <p class="meta">${esc(p.category)} | SKU ${esc(p.id)}</p>
          <div class="rating-row">
            <span class="stars">${starRow(rating)}</span>
            <span class="rating-value">${rating.toFixed(1)}</span>
          </div>
          <div class="price">${esc(priceText(p.price))}</div>
          <div class="card-actions">
            <a class="mini-link" href="product.html?pid=${encodeURIComponent(p.id)}">View</a>
            <button
              type="button"
              class="mini-cart-btn"
              data-add-cart="1"
              data-id="${esc(p.id)}"
              data-name="${esc(p.name)}"
              data-price="${esc(priceText(p.price))}"
              data-image="${esc(image)}"
              data-category="${esc(p.category)}">Add to Cart</button>
          </div>
        </div>
      </article>`;
      })
      .join("");
    els.count.textContent = `${visibleItems.length} / ${items.length} items`;

    const loadBtn = ensureLoadButton();
    if (loadBtn) {
      loadBtn.style.display = state.visible < items.length ? "inline-block" : "none";
    }
  }

  function titleByKey(filterKey) {
    const map = {
      ALL: "All Products",
      IPHONE: "iPhone",
      SAMSUNG: "Samsung",
      XIAOMI: "Xiaomi",
      ACCESSORIES: "Accessories",
    };
    return map[filterKey] || filterKey;
  }

  async function init() {
    state.visible = getPageSize();
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
    const all = allSource.filter((p) => !isBlockedBrand(p));
    state.base = all.filter((p) => isMatchByFilter(p, key));
    state.filtered = state.base.slice();
    const title = titleByKey(key);

    els.title.textContent = title;
    els.sub.textContent = `Browse products in ${title}.`;
    render(state.filtered);

    const onSearch = debounce((e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      state.visible = getPageSize();
      state.filtered = !q
        ? state.base
        : state.base.filter((p) => String(p.name || "").toLowerCase().includes(q));
      render(state.filtered);
    }, 220);
    els.search.addEventListener("input", onSearch);

    const loadBtn = ensureLoadButton();
    loadBtn?.addEventListener("click", () => {
      state.visible += getPageSize();
      render(state.filtered);
    });

    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-cart]");
      if (!add) return;
      addToCart({
        id: add.getAttribute("data-id") || "",
        name: add.getAttribute("data-name") || "Product",
        price: add.getAttribute("data-price") || "EUR 0",
        image: add.getAttribute("data-image") || "1.png",
        category: add.getAttribute("data-category") || "Category",
      });
      add.textContent = "Added";
      add.disabled = true;
      setTimeout(() => {
        add.textContent = "Add to Cart";
        add.disabled = false;
      }, 900);
    });
  }

  init().catch(() => {
    els.grid.innerHTML = "<p>Failed to load category products.</p>";
  });
})();

