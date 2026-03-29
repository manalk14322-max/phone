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

function pickFeatured(items, limit = 12) {
  const order = [
    "FUNDAS",
    "SIM",
    "PROTECTORES_PHONE",
    "PROTECTORES_CAMERA",
    "POWER_BANK",
    "AUDIO",
    "SMART_WATCH",
    "MOBILE_ACCESSORIES",
    "ACCESSORIES",
    "OFERTA",
  ];
  const out = [];
  const seen = new Set();

  for (const cat of order) {
    const chunk = items.filter((p) => canonicalCategory(p) === cat);
    for (const p of chunk) {
      if (seen.has(String(p.id))) continue;
      seen.add(String(p.id));
      out.push(p);
      if (out.length >= limit) return out;
    }
  }

  for (const p of items) {
    if (seen.has(String(p.id))) continue;
    seen.add(String(p.id));
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
  const list = augmentProducts(Array.isArray(data) ? data : []);
  const featured = pickFeatured(list, 12);

  grid.innerHTML = featured
    .map(
      (p) => `
      <article class="pf-card">
        <img src="${esc(resolveProductImage(p))}" alt="${esc(p.name)}" loading="lazy" />
        <div class="pf-body">
          <h3>${esc(short(p.name, 74))}</h3>
          <p>${esc(categoryLabel(canonicalCategory(p)))}</p>
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
