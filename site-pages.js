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

const CART_KEY = "twm_cart_modern_v1";
const PRODUCTS_CACHE_KEY = "twm_products_cache_v2";

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

function renderCard(p, withOffer = false) {
  const image = safeProductImage(p);
  const raw = Number(String(priceText(p.price)).replace(/[^\d.,]/g, "").replace(",", "."));
  const sale = Number.isFinite(raw) ? Math.max(raw * 0.82, 0.99).toFixed(2) : null;
  const rating = calcRating(p.id);
  const offer = withOffer
    ? `<p class="offer-line"><s>${esc(priceText(p.price))}</s> <strong>EUR ${sale || priceText(p.price)}</strong></p>`
    : `<div class="price">${esc(priceText(p.price))}</div>`;
  return `
    <article class="card">
      <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
        <img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
      </a>
      <div class="card-body">
        <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <p class="meta">${esc(p.category || "PRODUCTO")} | SKU ${esc(p.id)}</p>
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
            data-image="${esc(image)}"
            data-category="${esc(p.category || "PRODUCTO")}">Add to Cart</button>
        </div>
      </div>
    </article>`;
}
async function loadProducts() {
  const cached = readProductsCache();
  if (cached) return cached.filter((p) => !isBlockedBrand(p));

  const res = await fetch("products.json", { cache: "force-cache" });
  const data = await res.json();
  const normalized = Array.isArray(data) ? data : [];
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

  let visible = 48;
  let q = "";

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

async function initOfferPage() {
  const grid = document.getElementById("offer-grid");
  if (!grid) return;
  const all = await loadProducts();
  const picks = all.filter((_, i) => i % 5 === 0).slice(0, 24);
  grid.innerHTML = picks.map((p) => renderCard(p, true)).join("");
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
      const o = JSON.parse(localStorage.getItem("twm_orders_v1") || "[]");
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
      localStorage.removeItem("twm_orders_v1");
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

