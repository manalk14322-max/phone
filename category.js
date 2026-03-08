(() => {
  const urlKey = new URLSearchParams(window.location.search).get("cat");
  const bodyKey = document.body?.dataset?.cat;
  const key = String(urlKey || bodyKey || "ALL").trim().toUpperCase();
  const CART_KEY = "twm_cart_modern_v1";

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

  function normalizeCategory(v) {
    return String(v || "").trim().toUpperCase();
  }

  function isBlockedBrand(product) {
    const name = String(product?.name || "");
    return /(ellie|ellietech)/i.test(name);
  }

  function isMatchByFilter(product, filterKey) {
    const name = String(product?.name || "").toLowerCase();
    const cat = normalizeCategory(product?.category);
    const f = String(filterKey || "ALL").toUpperCase();

    if (f === "ALL") return true;
    if (cat === f) return true;

    if (f === "IPHONE") return /iphone|apple/.test(name);
    if (f === "SAMSUNG") return /samsung/.test(name);
    if (f === "XIAOMI") return /xiaomi|redmi|poco/.test(name);
    if (f === "ACCESSORIES") {
      return (
        /(funda|case|magsafe|protector|cargador|cable|auricular|audio|power|soporte|cristal|templado|colgante|pulsera)/.test(name) ||
        [
          "FUNDA",
          "PROTECTORES PANTALLA",
          "CARGADORES",
          "CABLE",
          "AUDIO",
          "SOPORTE",
          "INFORMÁTICA",
          "INFORMATICA",
          "GADGETS",
          "TARJETA MEMORIAS",
        ].includes(cat)
      );
    }

    return name.includes(f.toLowerCase());
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

  function render(items) {
    els.grid.innerHTML = items
      .map((p) => {
        const rating = calcRating(p.id);
        return `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </a>
        <div class="card-body">
          <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
          <p class="meta">${esc(p.category)} | SKU ${esc(p.id)}</p>
          <div class="rating-row">
            <span class="stars">${starRow(rating)}</span>
            <span class="rating-value">${rating.toFixed(1)}</span>
          </div>
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
      </article>`;
      })
      .join("");
    els.count.textContent = `${items.length} items`;
  }

  function titleByKey(filterKey) {
    const map = {
      ALL: "All Products",
      IPHONE: "iPhone",
      SAMSUNG: "Samsung",
      XIAOMI: "Xiaomi",
      ACCESSORIES: "Accessories",
    };
    return map[filterKey] || filterKey;
  }

  async function init() {
    const res = await fetch("products.json", { cache: "no-store" });
    const loaded = await res.json();
    const all = (Array.isArray(loaded) ? loaded : []).filter((p) => !isBlockedBrand(p));
    const base = all.filter((p) => isMatchByFilter(p, key));
    const title = titleByKey(key);

    els.title.textContent = title;
    els.sub.textContent = `Browse products in ${title}.`;
    render(base);

    els.search.addEventListener("input", (e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      const filtered = !q ? base : base.filter((p) => String(p.name || "").toLowerCase().includes(q));
      render(filtered);
    });

    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-cart]");
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
  }

  init().catch(() => {
    els.grid.innerHTML = "<p>Failed to load category products.</p>";
  });
})();
