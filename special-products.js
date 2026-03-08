function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickSpecialProducts(items) {
  const preferred = ["FUNDA", "AUDIO", "CARGADORES", "PROTECTORES PANTALLA", "CABLE", "SOPORTE"];
  const sorted = [];

  for (const cat of preferred) {
    const chunk = items.filter((p) => p.category === cat).slice(0, 12);
    sorted.push(...chunk);
  }

  for (const p of items) {
    if (!sorted.some((s) => s.id === p.id)) sorted.push(p);
    if (sorted.length >= 48) break;
  }

  return sorted.slice(0, 48);
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

async function initSpecialPage() {
  const grid = document.getElementById("special-page-grid");
  if (!grid) return;

  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();
  const products = Array.isArray(data) ? data : [];

  const special = pickSpecialProducts(products);
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get("pid");

  grid.innerHTML = special
    .map((p) => {
      const image = safeProductImage(p);
      const activeClass = activeId && String(p.id) === String(activeId) ? " active" : "";
      return `
      <article class="special-page-card${activeClass}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <div class="special-page-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.category)}</p>
          <strong>${escapeHtml(p.price || "Wholesale Price")}</strong>
          <a href="index.html">Order Now</a>
        </div>
      </article>`;
    })
    .join("");
}

initSpecialPage().catch((err) => {
  console.error(err);
  const grid = document.getElementById("special-page-grid");
  if (grid) grid.innerHTML = "<p>Failed to load special products.</p>";
});
