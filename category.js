(() => {
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("cat");
  const urlSub = params.get("sub");
  const bodyKey = document.body?.dataset?.cat;
  const key = String(urlKey || bodyKey || "ALL").trim().toUpperCase();
  const CART_KEY = "twm_cart_modern_v1";
  const PRODUCTS_CACHE_KEY = "twm_products_cache_v14";

  const els = {
    title: document.getElementById("cat-title"),
    sub: document.getElementById("cat-sub"),
    search: document.getElementById("cat-search"),
    count: document.getElementById("cat-count"),
    grid: document.getElementById("cat-grid"),
    loadMore: document.getElementById("cat-load-more"),
  };

  const state = {
    base: [],
    filtered: [],
    visible: 24,
    activeSub: "",
  };

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
      FUNDAS: "Cases",
      SIM: "SIM Cards",
      PROTECTORES_PHONE: "Screen Protectors",
      PROTECTORES_CAMERA: "Camera Protectors",
      POWER_BANK: "Power Banks",
      AUDIO: "Audio",
      OFERTA: "Offers",
      OFFERS: "Offers",
      SMART_WATCH: "Smart Watches",
      MOBILE_ACCESSORIES: "Mobile Accessories",
      ACCESSORIES: "Accessories",
      SAMSUNG: "Samsung",
      XIAOMI: "Xiaomi",
    };
    return map[String(key || "").toUpperCase()] || String(key || "Category");
  }

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

  function getPageSize() {
    return window.innerWidth <= 680 ? 12 : 24;
  }

  function debounce(fn, wait = 220) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function readProductsCache() {
    try {
      const data = JSON.parse(sessionStorage.getItem(PRODUCTS_CACHE_KEY) || "null");
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function writeProductsCache(products) {
    try {
      sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage quota issues
    }
  }

  function ensureLoadButton() {
    if (els.loadMore) return els.loadMore;
    if (!els.grid) return null;
    const wrap = document.createElement("div");
    wrap.className = "load-wrap";
    const btn = document.createElement("button");
    btn.id = "cat-load-more";
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Load More";
    wrap.appendChild(btn);
    els.grid.insertAdjacentElement("afterend", wrap);
    els.loadMore = btn;
    return btn;
  }

  function normalizeCategory(v) {
    return String(v || "").trim().toUpperCase();
  }

  function productText(product) {
    const parts = [
      product?.name,
      product?.brand,
      product?.compatibleModel,
      product?.category,
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  const CASE_STYLE_SUBCATS = [
    { key: "SILICONE_CASES", label: "Silicone Cases", match: (p) => /(silicona|silicone)/.test(productText(p)) },
    { key: "MATTE_CASES", label: "Matte Cases", match: (p) => /\bmate\b/.test(productText(p)) },
    { key: "TRANSPARENT_CASES", label: "Transparent Cases", match: (p) => /(transparente|transparent)/.test(productText(p)) },
    { key: "MAGSAFE_CASES", label: "MagSafe Cases", match: (p) => /magsafe/.test(productText(p)) },
    { key: "SUPPORT_CASES", label: "Support Cases", match: (p) => /(soporte|ring|anillo|armadura|flip)/.test(productText(p)) },
    { key: "LANYARD_CASES", label: "Lanyard Cases", match: (p) => /(cuerda|lanyard|cordon|cordón)/.test(productText(p)) },
    { key: "FLIP_CASES", label: "Flip Cases", match: (p) => /(tapa|book|libro|window|wallet|folio)/.test(productText(p)) },
    { key: "PATTERN_CASES", label: "Pattern Cases", match: (p) => /(glitter|purpurina|diamante|diamond|laser|dibujo|cromado|chrome)/.test(productText(p)) },
    {
      key: "TABLET_PORTABLE_CASES",
      label: "Tablet / Laptop Cases",
      match: (p) => /(tablet|table|portatil|portátil|laptop)/.test(productText(p)),
    },
  ];

  const BRAND_SUBCATS = [
    { key: "APPLE", label: "Apple", match: (p) => /(iphone|apple|ipad|airpods|watch)/.test(productText(p)) },
    { key: "SAMSUNG", label: "Samsung", match: (p) => /samsung/.test(productText(p)) },
    { key: "XIAOMI", label: "Xiaomi", match: (p) => /xiaomi/.test(productText(p)) },
    { key: "REDMI", label: "Redmi", match: (p) => /redmi/.test(productText(p)) },
    { key: "OPPO", label: "Oppo", match: (p) => /oppo/.test(productText(p)) },
    { key: "HUAWEI", label: "Huawei", match: (p) => /huawei/.test(productText(p)) },
    { key: "ONEPLUS", label: "One Plus", match: (p) => /(one ?plus|oneplus)/.test(productText(p)) },
    { key: "MOTOROLA", label: "Motorola", match: (p) => /(motorola|moto)/.test(productText(p)) },
    { key: "GOOGLE", label: "Google", match: (p) => /(google|pixel)/.test(productText(p)) },
    { key: "ALCATEL", label: "Alcatel", match: (p) => /alcatel/.test(productText(p)) },
    { key: "LENOVO", label: "Lenovo", match: (p) => /lenovo/.test(productText(p)) },
    { key: "ZTE", label: "ZTE", match: (p) => /zte/.test(productText(p)) },
    { key: "TCL", label: "TCL", match: (p) => /tcl/.test(productText(p)) },
    { key: "ALIVE", label: "Alive", match: (p) => /alive/.test(productText(p)) },
    { key: "WIKO", label: "Wiko", match: (p) => /wiko/.test(productText(p)) },
  ];

  const IPHONE_MODEL_SUBCATS = [
    {
      key: "IPHONE_11",
      label: "iPhone 11",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*11\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_11_PRO",
      label: "iPhone 11 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*11\s*pro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_11_PRO_MAX",
      label: "iPhone 11 Pro Max",
      match: (p) => /iphone\s*11\s*pro\s*max\b/.test(productText(p)),
    },
    {
      key: "IPHONE_12",
      label: "iPhone 12",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*12\b/.test(t) && !/\bmini\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_12_MINI",
      label: "iPhone 12 mini",
      match: (p) => /iphone\s*12\s*mini\b/.test(productText(p)),
    },
    {
      key: "IPHONE_12_PRO",
      label: "iPhone 12 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*12\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_12_PRO_MAX",
      label: "iPhone 12 Pro Max",
      match: (p) => /iphone\s*12\b/.test(productText(p)) && /\bpro\b/.test(productText(p)) && /\bmax\b/.test(productText(p)),
    },
    {
      key: "IPHONE_13",
      label: "iPhone 13",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*13\b/.test(t) && !/\bmini\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_13_MINI",
      label: "iPhone 13 mini",
      match: (p) => /iphone\s*13\s*mini\b/.test(productText(p)),
    },
    {
      key: "IPHONE_13_PRO",
      label: "iPhone 13 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*13\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_13_PRO_MAX",
      label: "iPhone 13 Pro Max",
      match: (p) => /iphone\s*13\b/.test(productText(p)) && /\bpro\b/.test(productText(p)) && /\bmax\b/.test(productText(p)),
    },
    {
      key: "IPHONE_14",
      label: "iPhone 14",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*14\b/.test(t) && !/\bplus\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_14_PLUS",
      label: "iPhone 14 Plus",
      match: (p) => /iphone\s*14\b/.test(productText(p)) && /\bplus\b/.test(productText(p)),
    },
    {
      key: "IPHONE_14_PRO",
      label: "iPhone 14 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*14\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_14_PRO_MAX",
      label: "iPhone 14 Pro Max",
      match: (p) => /iphone\s*14\b/.test(productText(p)) && /\bpro\b/.test(productText(p)) && /\bmax\b/.test(productText(p)),
    },
    {
      key: "IPHONE_15",
      label: "iPhone 15",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*15\b/.test(t) && !/\bplus\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_15_PLUS",
      label: "iPhone 15 Plus",
      match: (p) => /iphone\s*15\b/.test(productText(p)) && /\bplus\b/.test(productText(p)),
    },
    {
      key: "IPHONE_15_PRO",
      label: "iPhone 15 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*15\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_15_PRO_MAX",
      label: "iPhone 15 Pro Max",
      match: (p) => /iphone\s*15\b/.test(productText(p)) && /\bpro\b/.test(productText(p)) && /\bmax\b/.test(productText(p)),
    },
    {
      key: "IPHONE_16",
      label: "iPhone 16",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*16\b/.test(t) && !/\bplus\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_16_PLUS",
      label: "iPhone 16 Plus",
      match: (p) => /iphone\s*16\b/.test(productText(p)) && /\bplus\b/.test(productText(p)),
    },
    {
      key: "IPHONE_16_PRO",
      label: "iPhone 16 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*16\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_7_8",
      label: "iPhone 7/8",
      match: (p) => /iphone\s*7\s*\/\s*8\b/.test(productText(p)),
    },
    {
      key: "IPHONE_7_8_PLUS",
      label: "iPhone 7/8 Plus",
      match: (p) => /iphone\s*7\s*\/\s*8\s*plus\b/.test(productText(p)),
    },
    {
      key: "IPHONE_X_XS",
      label: "iPhone X / XS",
      match: (p) => /iphone\s*x\s*\/\s*xs\b/.test(productText(p)),
    },
    {
      key: "IPHONE_XR",
      label: "iPhone XR",
      match: (p) => /iphone\s*xr\b/.test(productText(p)),
    },
    {
      key: "IPHONE_SE_16E_17SE",
      label: "iPhone SE / 16E / 17SE",
      match: (p) => /iphone\s*(se|16e|17se)\b/.test(productText(p)),
    },
    {
      key: "IPHONE_17",
      label: "iPhone 17",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*17\b/.test(t) && !/\bplus\b/.test(t) && !/\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_17_PRO",
      label: "iPhone 17 Pro",
      match: (p) => {
        const t = productText(p);
        return /iphone\s*17\b/.test(t) && /\bpro\b/.test(t) && !/\bmax\b/.test(t);
      },
    },
    {
      key: "IPHONE_17_PRO_MAX",
      label: "iPhone 17 Pro Max",
      match: (p) => /iphone\s*17\b/.test(productText(p)) && /\bpro\b/.test(productText(p)) && /\bmax\b/.test(productText(p)),
    },
  ];

  const SUBCATS = {
    FUNDAS: [
      { key: "ALL", label: "All Cases", match: () => true },
      ...BRAND_SUBCATS,
      { key: "SILICONE", label: "Silicone", match: (p) => /(silicona|silicone)/.test(productText(p)) },
      { key: "MAGSAFE", label: "MagSafe", match: (p) => /magsafe/.test(productText(p)) },
      ...CASE_STYLE_SUBCATS,
      { key: "IPHONE", label: "iPhone", match: (p) => /iphone|apple/.test(productText(p)) },
      ...IPHONE_MODEL_SUBCATS,
    ],
    SIM: [
      { key: "ALL", label: "All SIM Cards", match: () => true },
      { key: "VODAFONE", label: "Vodafone", match: (p) => /vodafone/.test(productText(p)) },
      { key: "E_VODAFONE", label: "E-Sim Vodafone", match: (p) => /e ?sim.*vodafone|vodafone.*e ?sim/.test(productText(p)) },
      { key: "ORANGE", label: "Orange", match: (p) => /orange/.test(productText(p)) },
      { key: "E_ORANGE", label: "E-Sim Orange", match: (p) => /e ?sim.*orange|orange.*e ?sim/.test(productText(p)) },
      { key: "LEBARA", label: "Lebara", match: (p) => /lebara/.test(productText(p)) },
      { key: "E_LEBARA", label: "E-Lebara", match: (p) => /e ?sim.*lebara|lebara.*e ?sim|e ?lebara/.test(productText(p)) },
      { key: "LLAMAYA", label: "LLamaya", match: (p) => /llamaya/.test(productText(p)) },
      { key: "E_LLAMAYA", label: "E-Sim LLamaya", match: (p) => /e ?sim.*llamaya|llamaya.*e ?sim/.test(productText(p)) },
      { key: "MOVISTAR", label: "Movistar", match: (p) => /movistar/.test(productText(p)) },
    ],
    POWER_BANK: [
      { key: "ALL", label: "All Power Banks", match: () => true },
      { key: "MAGNETIC", label: "Magnetic Wireless", match: (p) => /magnetic|wireless/.test(productText(p)) },
      { key: "STANDARD", label: "Power Bank", match: (p) => /power ?bank/.test(productText(p)) && !/magnetic|wireless/.test(productText(p)) },
    ],
    AUDIO: [
      { key: "ALL", label: "All Audio", match: () => true },
      { key: "WIRELESS", label: "Wireless Earphone", match: (p) => /wireless/.test(productText(p)) },
      { key: "EARPHONE", label: "Earphone", match: (p) => /earphone|earbud|auricular/.test(productText(p)) },
    ],
    SMART_WATCH: [
      { key: "ALL", label: "All Smart Watches", match: () => true },
      { key: "WATCH", label: "Smart Watch", match: (p) => /smart ?watch/.test(productText(p)) },
      { key: "BAND", label: "Watch Band", match: (p) => /watch band|band|pulsera|correa/.test(productText(p)) },
      { key: "XM_BAND", label: "XM Band", match: (p) => /xm ?band|mi band/.test(productText(p)) },
      { key: "PROTECTIVE", label: "Protective Case", match: (p) => /protective|case|casa/.test(productText(p)) },
    ],
    MOBILE_ACCESSORIES: [
      { key: "ALL", label: "All Mobile Accessories", match: () => true },
      { key: "CORDON", label: "Cordon", match: (p) => /cordon|lanyard/.test(productText(p)) },
      { key: "MAGNETIC_CARD", label: "Magnetic Card", match: (p) => /magnetic card/.test(productText(p)) },
      { key: "SOPORTE", label: "Phone Holder", match: (p) => /soporte|stand|holder/.test(productText(p)) },
      { key: "AIRPODS_CASE", label: "AirPods Protection Case", match: (p) => /air ?pods|airpods/.test(productText(p)) },
    ],
    ACCESSORIES: [
      { key: "ALL", label: "All Accessories", match: () => true },
      { key: "FAST_CHARGER", label: "Fast Charger", match: (p) => /fast charger|charger|cargador/.test(productText(p)) },
      { key: "CABLE", label: "Cable", match: (p) => /cable/.test(productText(p)) },
      { key: "SPEAKER", label: "Wireless Speakers", match: (p) => /speaker/.test(productText(p)) },
      { key: "ADAPTER", label: "Travel Adapter", match: (p) => /adapter|adaptador|travel/.test(productText(p)) },
      { key: "SD_CARD", label: "SD Card", match: (p) => /sd card|tarjeta/.test(productText(p)) },
      { key: "USB", label: "USB Flash Drive", match: (p) => /usb|flash drive|pendrive/.test(productText(p)) },
    ],
  };

  function isBlockedBrand() {
    return false;
  }

  function isMatchByFilter(product, filterKey) {
    const text = productText(product);
    const name = String(product?.name || "").toLowerCase();
    const cat = normalizeCategory(product?.category);
    const f = String(filterKey || "ALL").toUpperCase();
    const canonical = canonicalCategory(product);

    if (f === "ALL") return true;
    if (cat === f) return true;
    if (canonical === f) return true;

    if (f === "FUNDAS") {
      return (
        /(funda|case|magsafe|cover|silicona|carcasa|bumper)/.test(text) ||
        cat === "FUNDA" ||
        isPhoneItem(product)
      );
    }
    if (f === "APPLE") return /(iphone|apple|ipad|airpods|watch)/.test(text);
    if (f === "SAMSUNG") return /samsung/.test(text);
    if (f === "XIAOMI") return /xiaomi/.test(text);
    if (f === "REDMI") return /redmi/.test(text);
    if (f === "OPPO") return /oppo/.test(text);
    if (f === "HUAWEI") return /huawei/.test(text);
    if (f === "ONEPLUS") return /(one ?plus|oneplus)/.test(text);
    if (f === "MOTOROLA") return /(motorola|moto)/.test(text);
    if (f === "GOOGLE") return /(google|pixel)/.test(text);
    if (f === "ALCATEL") return /alcatel/.test(text);
    if (f === "LENOVO") return /lenovo/.test(text);
    if (f === "ZTE") return /zte/.test(text);
    if (f === "TCL") return /tcl/.test(text);
    if (f === "ALIVE") return /alive/.test(text);
    if (f === "WIKO") return /wiko/.test(text);
    if (f === "SIM") return /(sim|e ?sim|vodafone|orange|lebara|llamaya|movistar)/.test(name + " " + cat);
    if (f === "PROTECTORES_PHONE") {
      return /(protector|cristal|templado|screen protector)/.test(name + " " + cat) && !/(camera|camara|lente|lens)/.test(name);
    }
    if (f === "PROTECTORES_CAMERA") {
      return /(camera|camara|lente|lens)/.test(name) && /(protector|glass|cristal|templado)/.test(name);
    }
    if (f === "POWER_BANK") return /(power ?bank|bateria externa|wireless power|magnetic wireless)/.test(name + " " + cat);
    if (f === "AUDIO") return /(audio|earphone|auricular|airpods|earbuds|headphone)/.test(name + " " + cat) || cat === "AUDIO";
    if (f === "OFERTA") return /(oferta|offer|sale|promo|descuento)/.test(name + " " + cat);
    if (f === "OFFERS") return /(oferta|offer|sale|promo|descuento)/.test(name + " " + cat);
    if (f === "SMART_WATCH") return /(smart ?watch|watch band|band|pulsera|mi band|xm ?band|correa)/.test(name + " " + cat);
    if (f === "MOBILE_ACCESSORIES") return /(cordon|lanyard|magnetic card|soporte|stand|holder|car mount|air pods|airpods)/.test(
      name + " " + cat
    ) || ["SOPORTE", "GADGETS"].includes(cat);
    if (f === "ACCESSORIES") {
      return (
        /(fast charger|charger|cargador|cable|wireless speaker|speaker|travel adapter|adaptador|sd card|usb|flash drive|memoria)/.test(
          name + " " + cat
        ) ||
        ["CARGADORES", "CABLE", "TARJETA MEMORIAS", "INFORMATICA"].includes(cat)
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
    if (window.TWM_CART?.addToCart) {
      window.TWM_CART.addToCart({ ...item, image: resolveProductImage(item), category: categoryLabel(canonicalCategory(item)) });
      return;
    }

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
      cart.push({ ...item, image: resolveProductImage(item), category: categoryLabel(canonicalCategory(item)), qty: 1 });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function isPhoneItem(product) {
    const text = productText(product);
    const isIphone = /iphone|apple/.test(text);
    const isCover = /(funda|case|magsafe|cover|carcasa|bumper)/.test(text);
    const isPhoneWord = /\bphone\b|\bsmartphone\b/.test(text);
    const isPhone = isPhoneWord || normalizeCategory(product?.category) === "PHONE";
    return isIphone && isPhone && !isCover;
  }

  function sortFundas(items) {
    return items.slice().sort((a, b) => {
      const aPhone = isPhoneItem(a) ? 0 : 1;
      const bPhone = isPhoneItem(b) ? 0 : 1;
      if (aPhone !== bPhone) return aPhone - bPhone;
      return 0;
    });
  }

  function render(items) {
    const visibleItems = items.slice(0, state.visible);
    els.grid.innerHTML = visibleItems
      .map((p) => {
        const rating = calcRating(p.id);
        return `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${esc(resolveProductImage(p))}" alt="${esc(p.name)}" loading="lazy" />
        </a>
        <div class="card-body">
          <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
          <p class="meta">${esc(categoryLabel(canonicalCategory(p)))} | SKU ${esc(p.sku || p.id)}</p>
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
              data-image="${esc(resolveProductImage(p))}"
              data-category="${esc(categoryLabel(canonicalCategory(p)))}">Add to Cart</button>
          </div>
        </div>
      </article>`;
      })
      .join("");
    els.count.textContent = `${visibleItems.length} / ${items.length} items`;

    const loadBtn = ensureLoadButton();
    if (loadBtn) {
      loadBtn.style.display = state.visible < items.length ? "inline-block" : "none";
    }
  }

  function titleByKey(filterKey) {
    const map = {
      ALL: "All Products",
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
      SAMSUNG: "Samsung",
      XIAOMI: "Xiaomi",
      OFFERS: "Offers",
    };
    return map[filterKey] || filterKey;
  }

  async function init() {
    state.visible = getPageSize();
    const cached = readProductsCache();
    const allSource = cached
      ? (() => {
          const normalized = augmentProducts(cached);
          if (normalized.length !== cached.length) {
            writeProductsCache(normalized);
          }
          return normalized;
        })()
      : await (async () => {
          const res = await fetch("products.json?v=20260314-01", { cache: "no-store" });
          const loaded = await res.json();
          const normalized = augmentProducts(Array.isArray(loaded) ? loaded : []);
          writeProductsCache(normalized);
          return normalized;
        })();
    const all = allSource.filter((p) => !isBlockedBrand(p));
    state.base = all.filter((p) => isMatchByFilter(p, key));
    state.filtered = state.base.slice();
    if (key === "FUNDAS") {
      state.filtered = sortFundas(state.filtered);
    }
    const title = titleByKey(key);

    els.title.textContent = title;
    els.sub.textContent = `Browse products in ${title}.`;
    render(state.filtered);

    const subcats = SUBCATS[key] || null;
    if (subcats && urlSub) {
      const initial = subcats.find((s) => s.key === String(urlSub || "").toUpperCase());
      if (initial) {
        state.activeSub = initial.key;
        state.filtered = state.base.filter((p) => (initial.match ? initial.match(p) : true));
        if (key === "FUNDAS") {
          state.filtered = sortFundas(state.filtered);
        }
        render(state.filtered);
      }
    }

    const onSearch = debounce((e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      state.visible = getPageSize();
      const subcats = SUBCATS[key] || null;
      const sub = subcats && state.activeSub && state.activeSub !== "ALL" ? subcats.find((s) => s.key === state.activeSub) || null : null;
      state.filtered = state.base.filter((p) => {
        const text = productText(p);
        const okSub = sub?.match ? sub.match(p) : true;
        const okQ = !q || text.includes(q);
        return okSub && okQ;
      });
      if (key === "FUNDAS") {
        state.filtered = sortFundas(state.filtered);
      }
      render(state.filtered);
    }, 220);
    els.search.addEventListener("input", onSearch);

    const loadBtn = ensureLoadButton();
    loadBtn?.addEventListener("click", () => {
      state.visible += getPageSize();
      render(state.filtered);
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




