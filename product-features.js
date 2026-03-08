function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickFeatured(items, limit = 12) {
  const order = ["FUNDA", "AUDIO", "CARGADORES", "PROTECTORES PANTALLA", "CABLE", "SOPORTE"];
  const out = [];
  const seen = new Set();

  for (const cat of order) {
    const chunk = items.filter((p) => p.category === cat);
    for (const p of chunk) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= limit) return out;
    }
  }

  for (const p of items) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

function short(v, n = 68) {
  if (!v) return "";
  return v.length > n ? `${v.slice(0, n - 1)}...` : v;
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

async function init() {
  const grid = document.getElementById("pf-grid");
  if (!grid) return;

  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  const featured = pickFeatured(list, 12);

  grid.innerHTML = featured
    .map(
      (p) => `
      <article class="pf-card">
        <img src="${esc(safeProductImage(p))}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <div class="pf-body">
          <h3>${esc(short(p.name, 74))}</h3>
          <p>${esc(p.category || "PRODUCTO")}</p>
          <ul>
            <li>Calidad premium para venta profesional</li>
            <li>Compatibilidad y acabado moderno</li>
            <li>Precio competitivo: ${esc(p.price || "Consultar")}</li>
          </ul>
          <a href="special-products.html?pid=${encodeURIComponent(p.id)}">Ver detalle</a>
        </div>
      </article>`
    )
    .join("");
}

init().catch((err) => {
  console.error(err);
  const grid = document.getElementById("pf-grid");
  if (grid) grid.innerHTML = "<p>Failed to load product features.</p>";
});
