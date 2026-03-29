function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PLACEHOLDER_IMAGE = "1.png";
const CATALOG = window.TWM_CATALOG || {};
const augmentProducts = CATALOG.augmentProducts || ((items) => items);
const resolveProductImage = CATALOG.resolveProductImage || ((product) => String(product?.image || PLACEHOLDER_IMAGE));

function normalizeText(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function canonicalCategory(product) {
  const text = normalizeText(
    [
      product?.name,
      product?.brand,
      product?.compatibleModel,
      product?.category,
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (/oferta|offer|sale|promo|descuento/.test(text)) return "OFERTA";
  if (/sim|e ?sim|vodafone|orange|lebara|llamaya|movistar/.test(text)) return "SIM";
  if (/(camera|camara|lente|lens)/.test(text) && /(protector|glass|cristal|templad|shield|film)/.test(text)) {
    return "PROTECTORES_CAMERA";
  }
  if (/(screen protector|protector.*pantall|pantalla|cristal templado|tempered glass)/.test(text)) {
    return "PROTECTORES_PHONE";
  }
  if (/(power ?bank|bateria externa|powerbank)/.test(text)) return "POWER_BANK";
  if (/(smart ?watch|watch band|correa|pulsera|mi band|xm band)/.test(text)) return "SMART_WATCH";
  if (/(airpods case|air pods case|airpods protection case|air pods protection case|airpods cover|air pods cover)/.test(text)) {
    return "MOBILE_ACCESSORIES";
  }
  if (/(airpods|earbuds|earphone|headphone|audio|speaker|auriculares)/.test(text)) return "AUDIO";
  if (/(cordon|lanyard|soporte|stand|holder|car mount|magnetic card)/.test(text)) return "MOBILE_ACCESSORIES";
  if (/(funda|fundas|case|cover|carcasa|bumper|magsafe|silicona|silicone)/.test(text)) return "FUNDAS";
  if (/(charger|cargador|cable|usb|adapter|adaptador|sd card|tarjeta memoria|flash drive|memoria)/.test(text)) {
    return "ACCESSORIES";
  }

  const category = normalizeText(product?.category);
  if (["accessories", "accesorios", "gadgets", "phone"].includes(category)) return "ACCESSORIES";
  if (category.includes("protector") && category.includes("pantall")) return "PROTECTORES_PHONE";
  if (
    category.includes("protector") &&
    (category.includes("camera") || category.includes("camara") || category.includes("lente") || category.includes("lens"))
  ) {
    return "PROTECTORES_CAMERA";
  }

  return "ACCESSORIES";
}

function categoryLabel(key) {
  const map = {
    ALL: "All",
    FUNDAS: "Cases",
    SIM: "SIM Cards",
    PROTECTORES_PHONE: "Screen Protectors",
    PROTECTORES_CAMERA: "Camera Protectors",
    POWER_BANK: "Power Banks",
    AUDIO: "Audio",
    OFERTA: "Offers",
    SMART_WATCH: "Smart Watches",
    MOBILE_ACCESSORIES: "Mobile Accessories",
    ACCESSORIES: "Accessories",
  };
  return map[key] || key || "Product";
}

function rankBusiness(items) {
  const weight = {
    FUNDAS: 1,
    PROTECTORES_PHONE: 2,
    PROTECTORES_CAMERA: 3,
    POWER_BANK: 4,
    AUDIO: 5,
    SMART_WATCH: 6,
    MOBILE_ACCESSORIES: 7,
    ACCESSORIES: 8,
    SIM: 9,
    OFERTA: 10,
  };
  return [...items].sort((a, b) => (weight[canonicalCategory(a)] || 99) - (weight[canonicalCategory(b)] || 99));
}

function matchesBusinessFilter(product, filter) {
  const raw = String(filter || "ALL").trim().toUpperCase();
  const canonical = canonicalCategory(product);
  const text = normalizeText(
    [
      product?.name,
      product?.brand,
      product?.compatibleModel,
      product?.category,
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (raw === "ALL") return true;
  if (canonical === raw) return true;
  if (raw === "FUNDA" || raw === "FUNDAS") return canonical === "FUNDAS";
  if (raw === "AUDIO") return canonical === "AUDIO";
  if (raw === "CARGADORES") return canonical === "ACCESSORIES" || /(charger|cargador|adapter|adaptador|power bank|cable)/.test(text);
  if (raw === "PROTECTORES PANTALLA" || raw === "PROTECTORES" || raw === "SCREEN PROTECTORS") {
    return canonical === "PROTECTORES_PHONE" || canonical === "PROTECTORES_CAMERA";
  }
  if (raw === "CABLE" || raw === "CABLES") return canonical === "ACCESSORIES" || /cable|usb/.test(text);
  return canonical === raw;
}

function render() {
  const grid = document.getElementById("bc-grid");
  if (!grid) return;

  let list = rankBusiness(state.all);
  if (state.filter !== "ALL") {
    list = list.filter((p) => matchesBusinessFilter(p, state.filter));
  }

  list = list.slice(0, 72);

  grid.innerHTML = list
    .map(
      (p) => `
      <article class="bc-card">
        <img src="${esc(resolveProductImage(p))}" alt="${esc(p.name)}" loading="lazy" />
        <div class="bc-body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(categoryLabel(canonicalCategory(p)))}</p>
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
  const res = await fetch("products.json?v=20260309-01", { cache: "no-store" });
  const data = await res.json();
  state.all = augmentProducts(Array.isArray(data) ? data : []);
  render();
}

init().catch((err) => {
  console.error(err);
  const grid = document.getElementById("bc-grid");
  if (grid) grid.innerHTML = "<p>Failed to load business catalog.</p>";
});
