(() => {
  const pid = new URLSearchParams(window.location.search).get("pid");
  const root = document.getElementById("product-detail");

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

  function renderNotFound() {
    root.innerHTML = `
      <section class="page-hero">
        <h1>Product Not Found</h1>
        <p>Requested product is not available.</p>
        <p><a class="btn-link" href="index.html">Back to Home</a></p>
      </section>`;
  }

  function renderProduct(p) {
    root.innerHTML = `
      <article class="pd-wrap">
        <div class="pd-media">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='1.png';" />
        </div>
        <div class="pd-info">
          <p class="pd-cat">${esc(p.category || "Category")}</p>
          <h1>${esc(p.name)}</h1>
          <div class="pd-price">${esc(priceText(p.price))}</div>
          <p class="pd-desc">Premium quality mobile accessory for retail and wholesale customers in Spain.</p>
          <div class="pd-actions">
            <button
              type="button"
              class="btn-link"
              data-add-cart="1"
              data-id="${esc(p.id)}"
              data-name="${esc(p.name)}"
              data-price="${esc(priceText(p.price))}"
              data-image="${esc(p.image)}"
              data-category="${esc(p.category || "Category")}">Add to Cart</button>
            <button
              type="button"
              class="btn-link"
              data-buy-now="1"
              data-id="${esc(p.id)}"
              data-name="${esc(p.name)}"
              data-price="${esc(priceText(p.price))}"
              data-image="${esc(p.image)}"
              data-category="${esc(p.category || "Category")}">Buy Now</button>
            <a class="btn-link" href="category.html?cat=${encodeURIComponent(p.category || "ALL")}">More in ${esc(p.category || "Category")}</a>
            <a class="btn-link secondary" href="index.html">Back to Home</a>
          </div>
        </div>
      </article>`;
  }

  async function init() {
    const res = await fetch("products.json", { cache: "no-store" });
    const items = await res.json();
    const product = items.find((x) => String(x.id) === String(pid));
    if (!product) {
      renderNotFound();
      return;
    }
    renderProduct(product);
  }

  init().catch(renderNotFound);
})();
