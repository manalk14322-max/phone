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

function renderCard(p, withOffer = false) {
  const raw = Number(String(priceText(p.price)).replace(/[^\d.,]/g, "").replace(",", "."));
  const sale = Number.isFinite(raw) ? Math.max(raw * 0.82, 0.99).toFixed(2) : null;
  const offer = withOffer
    ? `<p class="offer-line"><s>${esc(priceText(p.price))}</s> <strong>€${sale || priceText(p.price)}</strong></p>`
    : `<div class="price">${esc(priceText(p.price))}</div>`;
  return `
    <article class="card">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p class="meta">${esc(p.category || "PRODUCTO")}</p>
        ${offer}
      </div>
    </article>`;
}

async function loadProducts() {
  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

initStorePage().catch(console.error);
initNewsPage().catch(console.error);
initOfferPage().catch(console.error);
initAdminCustomersPage();
