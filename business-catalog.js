function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const state = {
  all: [],
  filter: "ALL",
};

function rankBusiness(items) {
  const weight = {
    FUNDA: 1,
    CARGADORES: 2,
    AUDIO: 3,
    "PROTECTORES PANTALLA": 4,
    CABLE: 5,
    SOPORTE: 6,
  };
  return [...items].sort((a, b) => (weight[a.category] || 99) - (weight[b.category] || 99));
}

function render() {
  const grid = document.getElementById("bc-grid");
  if (!grid) return;

  let list = rankBusiness(state.all);
  if (state.filter !== "ALL") {
    list = list.filter((p) => p.category === state.filter);
  }

  list = list.slice(0, 72);

  grid.innerHTML = list
    .map(
      (p) => `
      <article class="bc-card">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <div class="bc-body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.category)}</p>
          <strong>${esc(p.price || "Consultar")}</strong>
          <a href="special-products.html?pid=${encodeURIComponent(p.id)}">Ver detalle</a>
        </div>
      </article>`
    )
    .join("");
}

function setupFilters() {
  document.querySelectorAll(".bc-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bc-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter || "ALL";
      render();
    });
  });
}

async function init() {
  setupFilters();
  const res = await fetch("products.json?v=20260308-27", { cache: "no-store" });
  const data = await res.json();
  state.all = Array.isArray(data) ? data : [];
  render();
}

init().catch((err) => {
  console.error(err);
  const grid = document.getElementById("bc-grid");
  if (grid) grid.innerHTML = "<p>Failed to load business catalog.</p>";
});

