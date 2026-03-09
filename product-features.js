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

async function init() {
  const grid = document.getElementById("pf-grid");
  if (!grid) return;

  const res = await fetch("products.json?v=20260309-01", { cache: "no-store" });
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  const featured = pickFeatured(list, 12);

  grid.innerHTML = featured
    .map(
      (p) => `
      <article class="pf-card">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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


