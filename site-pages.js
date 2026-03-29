function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function priceText(p) {
  return p && String(p).trim() ? String(p) : "Wholesale Price";
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
  return false;
}

const CART_KEY = "twm_cart_modern_v1";
const ORDERS_KEY = "twm_orders_modern_v1";
const PRODUCTS_CACHE_KEY = "twm_products_cache_v4";
const PLACEHOLDER_IMAGE = "1.png";
const CATALOG = window.TWM_CATALOG || {};
const augmentProducts = CATALOG.augmentProducts || ((items) => items);
const resolveProductImage = CATALOG.resolveProductImage || ((product) => String(product?.image || PLACEHOLDER_IMAGE));

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
    ALL: "All",
    FUNDAS: "Cases",
    SIM: "SIM Cards",
    PROTECTORES_PHONE: "Screen Protectors",
    PROTECTORES_CAMERA: "Camera Protectors",
    POWER_BANK: "Power Banks",
    AUDIO: "Audio",
    OFERTA: "Offers",
    SMART_WATCH: "Smart Watches",
    MOBILE_ACCESSORIES: "Mobile Accessories",
    ACCESSORIES: "Accessories",
  };
  return map[key] || key || "Product";
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

function addToCart(item) {
  if (window.TWM_CART?.addToCart) {
    window.TWM_CART.addToCart({ ...item, image: resolveProductImage(item), category: categoryLabel(canonicalCategory(item)) });
    return;
  }

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
    cart.push({ ...item, image: resolveProductImage(item), category: categoryLabel(canonicalCategory(item)), qty: 1 });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function renderCard(p, withOffer = false) {
  const raw = Number(String(priceText(p.price)).replace(/[^\d.,]/g, "").replace(",", "."));
  const sale = Number.isFinite(raw) ? Math.max(raw * 0.82, 0.99).toFixed(2) : null;
  const rating = calcRating(p.id);
  const offer = withOffer
    ? `<p class="offer-line"><s>${esc(priceText(p.price))}</s> <strong>EUR ${sale || priceText(p.price)}</strong></p>`
    : `<div class="price">${esc(priceText(p.price))}</div>`;
  return `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
        <img src="${esc(resolveProductImage(p))}" alt="${esc(p.name)}" loading="lazy" />
        </a>
      <div class="card-body">
        <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <p class="meta">${esc(categoryLabel(canonicalCategory(p)))} | SKU ${esc(p.sku || p.id)}</p>
        <div class="rating-row">
          <span class="stars">${starRow(rating)}</span>
          <span class="rating-value">${rating.toFixed(1)}</span>
        </div>
        ${offer}
        <div class="card-actions">
          <a class="mini-link" href="product.html?pid=${encodeURIComponent(p.id)}">View</a>
          <button
            type="button"
            class="mini-cart-btn"
            data-add-cart="1"
            data-id="${esc(p.id)}"
            data-name="${esc(p.name)}"
            data-price="${esc(priceText(p.price))}"
            data-image="${esc(resolveProductImage(p))}"
            data-category="${esc(categoryLabel(canonicalCategory(p)))}">Add to Cart</button>
        </div>
      </div>
    </article>`;
}
async function loadProducts() {
  const cached = readProductsCache();
  if (cached) {
    const normalized = augmentProducts(cached);
    if (normalized.length !== cached.length) {
      writeProductsCache(normalized);
    }
    return normalized.filter((p) => !isBlockedBrand(p));
  }

  const res = await fetch("products.json?v=20260309-01", { cache: "force-cache" });
  const data = await res.json();
  const normalized = augmentProducts(Array.isArray(data) ? data : []);
  writeProductsCache(normalized);
  return normalized.filter((p) => !isBlockedBrand(p));
}

async function initStorePage() {
  const grid = document.getElementById("store-grid");
  if (!grid) return;
  const search = document.getElementById("store-search");
  const count = document.getElementById("store-count");
  const loadBtn = document.getElementById("store-load-more");
  const all = await loadProducts();
  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";

  let visible = 48;
  let q = initialQuery.trim().toLowerCase();

  if (search && initialQuery) {
    search.value = initialQuery;
  }

  function render() {
    const filtered = q
      ? all.filter((p) => (p.name || "").toLowerCase().includes(q))
      : all;
    grid.innerHTML = filtered.slice(0, visible).map((p) => renderCard(p)).join("");
    if (count) count.textContent = `${filtered.length} items`;
    if (loadBtn) loadBtn.style.display = visible < filtered.length ? "inline-block" : "none";
  }

  if (search) {
    let timer = null;
    search.addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        q = (e.target.value || "").trim().toLowerCase();
        visible = 48;
        render();
      }, 220);
    });
  }
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      visible += 48;
      render();
    });
  }
  render();
}

async function initNewsPage() {
  const grid = document.getElementById("news-grid");
  if (!grid) return;
  const all = await loadProducts();
  grid.innerHTML = all.slice(0, 24).map((p) => renderCard(p)).join("");
}

const OFFER_GROUPS = [
  { key: "ALL", label: "All offers", match: () => true },
  {
    key: "FEATURED",
    label: "Featured picks",
    match: (p) => canonicalCategory(p) === "OFERTA" || /(offer|sale|promo|descuento)/.test(productText(p)),
  },
  { key: "CASES", label: "Cases", match: (p) => canonicalCategory(p) === "FUNDAS" },
  { key: "SIM", label: "SIM Cards", match: (p) => canonicalCategory(p) === "SIM" },
  {
    key: "PROTECTORS",
    label: "Protectors",
    match: (p) => canonicalCategory(p) === "PROTECTORES_PHONE" || canonicalCategory(p) === "PROTECTORES_CAMERA",
  },
  { key: "POWER", label: "Power Banks", match: (p) => canonicalCategory(p) === "POWER_BANK" },
  { key: "AUDIO", label: "Audio", match: (p) => canonicalCategory(p) === "AUDIO" },
  { key: "ACCESSORIES", label: "Accessories", match: (p) => canonicalCategory(p) === "ACCESSORIES" || canonicalCategory(p) === "MOBILE_ACCESSORIES" },
  { key: "WATCHES", label: "Smart Watches", match: (p) => canonicalCategory(p) === "SMART_WATCH" },
];

function buildOfferPool(items) {
  const exact = items.filter((p) => canonicalCategory(p) === "OFERTA");
  const fallback = items.filter((_, i) => i % 5 === 0);
  const pool = [];
  const seen = new Set();

  for (const p of [...exact, ...fallback, ...items]) {
    const id = String(p?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    pool.push(p);
    if (pool.length >= 48) break;
  }

  return pool;
}

function offerPageHref(page, groupKey) {
  const params = new URLSearchParams(window.location.search);
  params.set("page", String(page));
  if (groupKey && groupKey !== "ALL") params.set("group", groupKey);
  else params.delete("group");
  return `oferta.html?${params.toString()}`;
}

async function initOfferPage() {
  const grid = document.getElementById("offer-grid");
  if (!grid) return;
  const groupList = document.getElementById("offer-group-list");
  const pageLabel = document.getElementById("offer-page-label");
  const count = document.getElementById("offer-count");
  const total = document.getElementById("offer-total");
  const sectionTitle = document.getElementById("offer-section-title");
  const pagination = document.getElementById("offer-pagination");
  const all = await loadProducts();
  const offerPool = buildOfferPool(all);
  const params = new URLSearchParams(window.location.search);
  const rawGroup = String(params.get("group") || params.get("cat") || "ALL").trim().toUpperCase();
  const activeGroupKey = rawGroup === "OFERTA" || rawGroup === "OFFERS" ? "ALL" : rawGroup;
  const activeGroup = OFFER_GROUPS.find((item) => item.key === activeGroupKey) || OFFER_GROUPS[0];
  const filtered = activeGroup.key === "ALL" ? offerPool : offerPool.filter(activeGroup.match);
  const list = filtered.length ? filtered : offerPool;
  const pageSize = window.innerWidth <= 720 ? 8 : 12;
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(Math.max(Number(params.get("page") || 1) || 1, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = list.slice(start, start + pageSize);

  if (groupList) {
    groupList.innerHTML = OFFER_GROUPS.map((group) => {
      const groupCount = group.key === "ALL" ? offerPool.length : offerPool.filter(group.match).length;
      const isActive = group.key === activeGroup.key;
      return `
        <a class="${isActive ? "active" : ""}" href="${offerPageHref(1, group.key)}">
          <span>${esc(group.label)}</span>
          <span class="offer-chip-count">${groupCount}</span>
        </a>
      `;
    }).join("");
  }

  if (pageLabel) pageLabel.textContent = `${currentPage} / ${totalPages}`;
  if (count) count.textContent = `${list.length} products`;
  if (total) total.textContent = `${offerPool.length}`;
  if (sectionTitle) sectionTitle.textContent = activeGroup.key === "ALL" ? "Featured deals" : activeGroup.label;

  grid.innerHTML = visible.length
    ? visible.map((p) => renderCard(p, true)).join("")
    : '<div class="offer-empty">No matching offer products found.</div>';

  if (pagination) {
    const parts = [];
    const add = (label, page, className = "nav") => {
      if (page < 1 || page > totalPages) return;
      parts.push(`<a class="${className}" href="${offerPageHref(page, activeGroup.key)}">${label}</a>`);
    };
    add("Prev", currentPage - 1);
    const from = Math.max(1, currentPage - 2);
    const to = Math.min(totalPages, currentPage + 2);
    if (from > 1) parts.push('<span class="ellipsis">…</span>');
    for (let p = from; p <= to; p += 1) {
      parts.push(`<a class="${p === currentPage ? "active" : ""}" href="${offerPageHref(p, activeGroup.key)}">${p}</a>`);
    }
    if (to < totalPages) parts.push('<span class="ellipsis">…</span>');
    add("Next", currentPage + 1);
    pagination.innerHTML = parts.join("");
  }
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function initAdminCustomersPage() {
  const body = document.getElementById("admin-customers-body");
  if (!body) return;
  const clear = document.getElementById("admin-clear");

  const contacts = (() => {
    try {
      const c = JSON.parse(localStorage.getItem("twm_contacts_v1") || "[]");
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  })();

  body.innerHTML = contacts.length
    ? contacts
        .map(
          (c) => `<tr>
      <td>${esc(c.name || "-")}</td>
      <td>${esc(c.email || "-")}</td>
      <td>${esc(c.phone || "-")}</td>
      <td>${esc(c.source || "-")}</td>
      <td>${esc(fmtDate(c.addedAt))}</td>
    </tr>`
        )
        .join("")
    : '<tr><td colspan="5">No saved contacts yet.</td></tr>';

  if (clear) {
    clear.addEventListener("click", () => {
      localStorage.removeItem("twm_contacts_v1");
      localStorage.removeItem("twm_users_v1");
      localStorage.removeItem("twm_session_v1");
      window.location.reload();
    });
  }
}

function initAdminOrdersPage() {
  const body = document.getElementById("admin-orders-body");
  if (!body) return;
  const clear = document.getElementById("admin-orders-clear");

  const orders = (() => {
    try {
      const o = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      return Array.isArray(o) ? o : [];
    } catch {
      return [];
    }
  })();

  body.innerHTML = orders.length
    ? orders
        .map((o) => {
          const c = o.customer || {};
          const total = Number(o.total || 0).toFixed(2);
          return `<tr>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(o.orderId || "-")}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(c.name || "-")}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(c.phone || "-")}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(c.city || "-")}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(c.payment || "-")}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">EUR ${esc(total)}</td>
            <td style="padding:8px; border-bottom:1px solid #edf3ff;">${esc(fmtDate(o.createdAt))}</td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="7" style="padding:12px;">No online orders yet.</td></tr>';

  if (clear) {
    clear.addEventListener("click", () => {
      localStorage.removeItem(ORDERS_KEY);
      window.location.reload();
    });
  }
}

initStorePage().catch(console.error);
initNewsPage().catch(console.error);
initOfferPage().catch(console.error);
initAdminCustomersPage();
initAdminOrdersPage();

document.addEventListener("click", (e) => {
  const add = e.target.closest(".mini-cart-btn[data-add-cart]");
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




