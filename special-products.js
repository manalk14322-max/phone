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

async function initSpecialPage() {
  const grid = document.getElementById("special-page-grid");
  if (!grid) return;

  const res = await fetch("products.json?v=20260309-01", { cache: "no-store" });
  const data = await res.json();
  const products = Array.isArray(data) ? data : [];

  const special = pickSpecialProducts(products);
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get("pid");

  grid.innerHTML = special
    .map((p) => {
      const activeClass = activeId && String(p.id) === String(activeId) ? " active" : "";
      return `
      <article class="special-page-card${activeClass}">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
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


