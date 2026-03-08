(() => {
  const key = new URLSearchParams(window.location.search).get("cat") || "ALL";
  const els = {
    title: document.getElementById("cat-title"),
    sub: document.getElementById("cat-sub"),
    search: document.getElementById("cat-search"),
    count: document.getElementById("cat-count"),
    grid: document.getElementById("cat-grid"),
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

  function isBlockedBrand(product) {
    const name = String(product?.name || "");
    return /(ellie|ellietech)/i.test(name);
  }

  function render(items) {
    els.grid.innerHTML = items
      .map(
        (p) => `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </a>
        <div class="card-body">
          <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
          <p class="meta">${esc(p.category)}</p>
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
      </article>`
      )
      .join("");
    els.count.textContent = `${items.length} items`;
  }

  async function init() {
    const res = await fetch("products.json", { cache: "no-store" });
    const loaded = await res.json();
    const all = (Array.isArray(loaded) ? loaded : []).filter((p) => !isBlockedBrand(p));
    const base = key === "ALL" ? all : all.filter((p) => p.category === key);

    els.title.textContent = key === "ALL" ? "All Products" : key;
    els.sub.textContent = key === "ALL" ? "Browse all available products." : `Browse products in ${key}.`;
    render(base);

    els.search.addEventListener("input", (e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      const filtered = !q ? base : base.filter((p) => String(p.name || "").toLowerCase().includes(q));
      render(filtered);
    });
  }

  init().catch(() => {
    els.grid.innerHTML = "<p>Failed to load category products.</p>";
  });
})();
