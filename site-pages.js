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

const CART_KEY = "twm_cart_modern_v1";

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
  const raw = Number(String(priceText(p.price)).replace(/[^\d.,]/g, "").replace(",", "."));
  const sale = Number.isFinite(raw) ? Math.max(raw * 0.82, 0.99).toFixed(2) : null;
  const rating = calcRating(p.id);
  const offer = withOffer
    ? `<p class="offer-line"><s>${esc(priceText(p.price))}</s> <strong>EUR ${sale || priceText(p.price)}</strong></p>`
    : `<div class="price">${esc(priceText(p.price))}</div>`;
  return `
    <article class="card">
      <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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
            data-image="${esc(p.image)}"
            data-category="${esc(p.category || "PRODUCTO")}">Add to Cart</button>
        </div>
      </div>
    </article>`;
}
async function loadProducts() {
  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();
  return (Array.isArray(data) ? data : []).filter((p) => !isBlockedBrand(p));
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
    search.addEventListener("input", (e) => {
      q = (e.target.value || "").trim().toLowerCase();
      visible = 48;
      render();
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

