(() => {
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("cat");
  const urlSub = params.get("sub");
  const bodyKey = document.body?.dataset?.cat;
  const key = String(urlKey || bodyKey || "ALL").trim().toUpperCase();
  const CART_KEY = "twm_cart_modern_v1";
  const PRODUCTS_CACHE_KEY = "twm_products_cache_v10";

  const els = {
    title: document.getElementById("cat-title"),
    sub: document.getElementById("cat-sub"),
    search: document.getElementById("cat-search"),
    count: document.getElementById("cat-count"),
    grid: document.getElementById("cat-grid"),
    loadMore: document.getElementById("cat-load-more"),
    subcatBar: document.getElementById("subcat-bar"),
    subcatChips: document.getElementById("subcat-chips"),
  };

  const state = {
    base: [],
    filtered: [],
    visible: 24,
    activeSub: "ALL",
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

  const SUBCATS = {
    FUNDAS: [
      { key: "ALL", label: "All Fundas", match: () => true },
      { key: "IPHONE", label: "iPhone", match: (p) => /iphone|apple/.test(productText(p)) },
      { key: "SAMSUNG", label: "Samsung", match: (p) => /samsung/.test(productText(p)) },
      { key: "REDMI", label: "Redmi", match: (p) => /redmi/.test(productText(p)) },
      { key: "XIAOMI", label: "Xiaomi", match: (p) => /xiaomi/.test(productText(p)) },
      { key: "OPPO", label: "Oppo", match: (p) => /oppo/.test(productText(p)) },
      { key: "GOOGLE", label: "Google", match: (p) => /google|pixel/.test(productText(p)) },
    ],
    SIM: [
      { key: "ALL", label: "All SIM", match: () => true },
      { key: "VODAFONE", label: "Vodafone", match: (p) => /vodafone/.test(productText(p)) },
      { key: "E_VODAFONE", label: "E-Sim Vodafone", match: (p) => /e ?sim.*vodafone|vodafone.*e ?sim/.test(productText(p)) },
      { key: "ORANGE", label: "Orange", match: (p) => /orange/.test(productText(p)) },
      { key: "E_ORANGE", label: "E-Sim Orange", match: (p) => /e ?sim.*orange|orange.*e ?sim/.test(productText(p)) },
      { key: "LEBARA", label: "Lebara", match: (p) => /lebara/.test(productText(p)) },
      { key: "E_LEBARA", label: "E-Lebara", match: (p) => /e ?sim.*lebara|lebara.*e ?sim|e ?lebara/.test(productText(p)) },
      { key: "LLAMAYA", label: "LLamaya", match: (p) => /llamaya/.test(productText(p)) },
      { key: "E_LLAMAYA", label: "E-Sim LLamaya", match: (p) => /e ?sim.*llamaya|llamaya.*e ?sim/.test(productText(p)) },
      { key: "MOVISTAR", label: "Movistar", match: (p) => /movistar/.test(productText(p)) },
    ],
    POWER_BANK: [
      { key: "ALL", label: "All Power Bank", match: () => true },
      { key: "MAGNETIC", label: "Magnetic Wireless", match: (p) => /magnetic|wireless/.test(productText(p)) },
    ],
    AUDIO: [
      { key: "ALL", label: "All Audio", match: () => true },
      { key: "WIRELESS", label: "Wireless Earphone", match: (p) => /wireless/.test(productText(p)) },
      { key: "EARPHONE", label: "Earphone", match: (p) => /earphone|earbud|auricular/.test(productText(p)) },
    ],
    SMART_WATCH: [
      { key: "ALL", label: "All Smart Watch", match: () => true },
      { key: "WATCH", label: "Smart Watch", match: (p) => /smart ?watch/.test(productText(p)) },
      { key: "BAND", label: "Watch Band", match: (p) => /watch band|band|pulsera|correa/.test(productText(p)) },
      { key: "XM_BAND", label: "XM Band", match: (p) => /xm ?band|mi band/.test(productText(p)) },
      { key: "PROTECTIVE", label: "Protective Case", match: (p) => /protective|case|casa/.test(productText(p)) },
    ],
    MOBILE_ACCESSORIES: [
      { key: "ALL", label: "All Mobile Accessories", match: () => true },
      { key: "CORDON", label: "Cordon", match: (p) => /cordon|lanyard/.test(productText(p)) },
      { key: "MAGNETIC_CARD", label: "Magnetic Card", match: (p) => /magnetic card/.test(productText(p)) },
      { key: "SOPORTE", label: "Soporte para movil", match: (p) => /soporte|stand|holder/.test(productText(p)) },
      { key: "AIRPODS_CASE", label: "Air Pods Case", match: (p) => /air ?pods|airpods/.test(productText(p)) },
    ],
    ACCESSORIES: [
      { key: "ALL", label: "All Accessories", match: () => true },
      { key: "FAST_CHARGER", label: "Fast Charger", match: (p) => /fast charger|charger|cargador/.test(productText(p)) },
      { key: "CABLE", label: "Cable", match: (p) => /cable/.test(productText(p)) },
      { key: "SPEAKER", label: "Wireless Speakers", match: (p) => /speaker/.test(productText(p)) },
      { key: "ADAPTER", label: "Travel Adapter", match: (p) => /adapter|adaptador|travel/.test(productText(p)) },
      { key: "SD_CARD", label: "SD Card", match: (p) => /sd card|tarjeta/.test(productText(p)) },
      { key: "USB", label: "USB Flash Drive", match: (p) => /usb|flash drive|pendrive/.test(productText(p)) },
    ],
  };

  function isBlockedBrand() {
    return false;
  }

  function isMatchByFilter(product, filterKey) {
    const name = String(product?.name || "").toLowerCase();
    const cat = normalizeCategory(product?.category);
    const f = String(filterKey || "ALL").toUpperCase();

    if (f === "ALL") return true;
    if (cat === f) return true;

    if (f === "FUNDAS") {
      return (
        /(funda|case|magsafe|cover|silicona|carcasa|bumper)/.test(name) ||
        cat === "FUNDA" ||
        (/iphone|apple/.test(name) && /(phone|smartphone)/.test(name)) ||
        (cat === "PHONE" && /iphone|apple/.test(name))
      );
    }
    if (f === "SIM") return /(sim|e ?sim|vodafone|orange|lebara|llamaya|movistar)/.test(name + " " + cat);
    if (f === "PROTECTORES_PHONE") {
      return /(protector|cristal|templado|screen protector)/.test(name + " " + cat) && !/(camera|camara|lente|lens)/.test(name);
    }
    if (f === "PROTECTORES_CAMERA") {
      return /(camera|camara|lente|lens)/.test(name) && /(protector|glass|cristal|templado)/.test(name);
    }
    if (f === "POWER_BANK") return /(power ?bank|bateria externa|wireless power|magnetic wireless)/.test(name + " " + cat);
    if (f === "AUDIO") return /(audio|earphone|auricular|airpods|earbuds|headphone)/.test(name + " " + cat) || cat === "AUDIO";
    if (f === "OFERTA") return /(oferta|offer|sale|promo|descuento)/.test(name + " " + cat);
    if (f === "SMART_WATCH") return /(smart ?watch|watch band|band|pulsera|mi band|xm ?band|correa)/.test(name + " " + cat);
    if (f === "MOBILE_ACCESSORIES") return /(cordon|lanyard|magnetic card|soporte|stand|holder|car mount|air pods|airpods)/.test(
      name + " " + cat
    ) || ["SOPORTE", "GADGETS"].includes(cat);
    if (f === "ACCESSORIES") {
      return (
        /(fast charger|charger|cargador|cable|wireless speaker|speaker|travel adapter|adaptador|sd card|usb|flash drive|memoria)/.test(
          name + " " + cat
        ) ||
        ["CARGADORES", "CABLE", "TARJETA MEMORIAS", "INFORMATICA"].includes(cat)
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

  function isPhoneItem(product) {
    const text = productText(product);
    const isIphone = /iphone|apple/.test(text);
    const isCover = /(funda|case|magsafe|cover|carcasa|bumper)/.test(text);
    const isPhone = /(phone|smartphone)/.test(text) || normalizeCategory(product?.category) === "PHONE";
    return isIphone && isPhone && !isCover;
  }

  function sortFundas(items) {
    return items.slice().sort((a, b) => {
      const aPhone = isPhoneItem(a) ? 0 : 1;
      const bPhone = isPhoneItem(b) ? 0 : 1;
      if (aPhone !== bPhone) return aPhone - bPhone;
      return 0;
    });
  }

  function render(items) {
    const visibleItems = items.slice(0, state.visible);
    els.grid.innerHTML = visibleItems
      .map((p) => {
        const rating = calcRating(p.id);
        return `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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
              data-image="${esc(p.image)}"
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
      FUNDAS: "Fundas",
      SIM: "SIM Card",
      PROTECTORES_PHONE: "Protectores Phone",
      PROTECTORES_CAMERA: "Protectores Camera",
      POWER_BANK: "Power Bank",
      AUDIO: "Audio",
      OFERTA: "Oferta",
      SMART_WATCH: "Smart Watch",
      MOBILE_ACCESSORIES: "Mobile Accessories",
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
          const res = await fetch("products.json?v=20260314-01", { cache: "no-store" });
          const loaded = await res.json();
          const normalized = Array.isArray(loaded) ? loaded : [];
          writeProductsCache(normalized);
          return normalized;
        })();
    const all = allSource.filter((p) => !isBlockedBrand(p));
    state.base = all.filter((p) => isMatchByFilter(p, key));
    state.filtered = state.base.slice();
    if (key === "FUNDAS") {
      state.filtered = sortFundas(state.filtered);
    }
    const title = titleByKey(key);

    els.title.textContent = title;
    els.sub.textContent = `Browse products in ${title}.`;
    render(state.filtered);

    const subcats = SUBCATS[key] || null;
    if (subcats && els.subcatBar && els.subcatChips) {
      els.subcatBar.hidden = false;
      els.subcatChips.innerHTML = subcats
        .map(
          (s) =>
            `<button type="button" class="subcat-chip${s.key === "ALL" ? " active" : ""}" data-sub="${esc(s.key)}">${esc(
              s.label
            )}</button>`
        )
        .join("");

      if (urlSub) {
        const initial = subcats.find((s) => s.key === String(urlSub || "").toUpperCase());
        if (initial) {
          state.activeSub = initial.key;
          els.subcatChips.querySelectorAll(".subcat-chip").forEach((el) => {
            el.classList.toggle("active", el.getAttribute("data-sub") === initial.key);
          });
          state.filtered = state.base.filter((p) => (initial.match ? initial.match(p) : true));
          if (key === "FUNDAS") {
            state.filtered = sortFundas(state.filtered);
          }
          render(state.filtered);
        }
      }

      els.subcatChips.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-sub]");
        if (!btn) return;
        const subKey = btn.getAttribute("data-sub") || "ALL";
        state.activeSub = subKey;
        els.subcatChips.querySelectorAll(".subcat-chip").forEach((el) => {
          el.classList.toggle("active", el.getAttribute("data-sub") === subKey);
        });
        const sub = subcats.find((s) => s.key === subKey) || subcats[0];
        const q = String(els.search.value || "").trim().toLowerCase();
        state.visible = getPageSize();
        state.filtered = state.base.filter((p) => {
          const text = productText(p);
          const okSub = sub?.match ? sub.match(p) : true;
          const okQ = !q || text.includes(q);
          return okSub && okQ;
        });
        if (key === "FUNDAS") {
          state.filtered = sortFundas(state.filtered);
        }
        render(state.filtered);
      });
    }

    const onSearch = debounce((e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      state.visible = getPageSize();
      const subcats = SUBCATS[key] || null;
      const sub = subcats ? subcats.find((s) => s.key === state.activeSub) || subcats[0] : null;
      state.filtered = state.base.filter((p) => {
        const text = productText(p);
        const okSub = sub?.match ? sub.match(p) : true;
        const okQ = !q || text.includes(q);
        return okSub && okQ;
      });
      if (key === "FUNDAS") {
        state.filtered = sortFundas(state.filtered);
      }
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




