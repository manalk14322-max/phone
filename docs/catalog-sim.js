(() => {
  const IMAGE_VERSION = "20260328-21";
  const PLACEHOLDER_IMAGE = `1.png?v=${IMAGE_VERSION}`;
  const ROOT_COVER_IMAGE_BASE = "images/catalog/fundas";
  const COVER_IMAGE_BASE = "images/catalog/fundas/whatsapp";
  const IPHONE_SPECIAL_POOL = ["iphone.png", "boos.png", "boos2.png"];
  const SIM_IMAGE_BASE = "images/catalog/sim";
  const IPHONE_17_PRO_MAX_IMAGE_BASE = "images/catalog/fundas/iphone-17-pro-max";

  function versioned(path) {
    const value = String(path || "").trim().replace(/\\/g, "/");
    if (!value) return value;
    return value.includes("?") ? value : `${value}?v=${IMAGE_VERSION}`;
  }

  function buildNamedRange(prefix, start, end, ext = "jpeg") {
    const items = [];
    for (let i = start; i <= end; i++) {
      items.push(`${prefix}-${String(i).padStart(3, "0")}.${ext}`);
    }
    return items;
  }

  function buildRange(start, end) {
    return buildNamedRange("fundas-whatsapp", start, end);
  }

  const poolImageUsage = new Map();
  const productImageChoice = new Map();

  function stableHash(value) {
    let hash = 0;
    const text = String(value || "");
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickFromPool(product, pool, salt = "", base = COVER_IMAGE_BASE) {
    const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
    if (!list.length) return PLACEHOLDER_IMAGE;
    const productKey = [
      product?.id,
      product?.sku,
      product?.uid,
      product?.name,
      salt,
    ]
      .filter(Boolean)
      .join("|");
    const cacheKey = `${base}::${salt}::${productKey}`;
    if (productImageChoice.has(cacheKey)) {
      return versioned(`${base}/${productImageChoice.get(cacheKey)}`);
    }

    const usageKey = `${base}::${salt}::${list.join(",")}`;
    const used = poolImageUsage.get(usageKey) || new Set();
    let index = stableHash(cacheKey) % list.length;
    const start = index;
    while (used.has(index) && used.size < list.length) {
      index = (index + 1) % list.length;
      if (index === start) break;
    }

    used.add(index);
    poolImageUsage.set(usageKey, used);
    productImageChoice.set(cacheKey, list[index]);
    return versioned(`${base}/${list[index]}`);
  }

  function pickFromPools(product, pools, salt = "") {
    const list = Array.isArray(pools)
      ? pools
          .map((entry, index) => {
            if (!entry) return null;
            if (Array.isArray(entry)) {
              return {
                key: `${salt || "pool"}-${index}`,
                base: COVER_IMAGE_BASE,
                items: entry,
              };
            }
            return {
              key: entry.key || `${salt || "pool"}-${index}`,
              base: entry.base || COVER_IMAGE_BASE,
              items: Array.isArray(entry.items) ? entry.items : [],
            };
          })
          .filter((entry) => entry && entry.items.length)
      : [];

    if (!list.length) return PLACEHOLDER_IMAGE;

    const productKey = [
      product?.id,
      product?.sku,
      product?.uid,
      product?.name,
      salt,
    ]
      .filter(Boolean)
      .join("|");
    const bucket = list[stableHash(`${productKey}|bucket`) % list.length];
    return pickFromPool(product, bucket.items, bucket.key, bucket.base);
  }

  function normalizeText(v) {
    return String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(/\+/g, "plus")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function productText(product) {
    return normalizeText(
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
  }

  function detectSimBrand(product) {
    const text = productText(product);
    if (/vodafone/.test(text)) return "vodafone";
    if (/orange/.test(text)) return "orange";
    if (/lebara/.test(text)) return "lebara";
    if (/llamaya/.test(text)) return "llamaya";
    if (/movistar/.test(text)) return "movistar";
    return null;
  }

  function isESimProduct(product) {
    return /\be ?sim\b|\besim\b/.test(productText(product));
  }

  function detectFundasBrand(product) {
    const text = productText(product);
    if (/samsung|galaxy|note|fold|flip/.test(text)) return "samsung";
    if (/iphone|apple/.test(text)) return "iphone";
    if (/redmi/.test(text)) return "redmi";
    if (/xiaomi|mi\b/.test(text)) return "xiaomi";
    if (/oppo/.test(text)) return "oppo";
    if (/google|pixel/.test(text)) return "google";
    return "generic";
  }

  function detectIphoneSeries(product) {
    const text = productText(product);
    if (/\b17\b/.test(text)) return 17;
    if (/\b16e\b/.test(text) || /\b16\b/.test(text)) return 16;
    if (/\b15\b/.test(text)) return 15;
    if (/\b14\b/.test(text)) return 14;
    if (/\b13\b/.test(text)) return 13;
    if (/\b12\b/.test(text)) return 12;
    if (/\b11\b/.test(text)) return 11;
    if (/\bxs?\b/.test(text)) return 10;
    if (/\bxr\b/.test(text)) return 10;
    if (/\bse\b/.test(text)) return 9;
    if (/\b8\b/.test(text)) return 8;
    if (/\b7\b/.test(text)) return 7;
    if (/\b6\b/.test(text)) return 6;
    return null;
  }

  function detectFundasStyle(product) {
    const text = productText(product);
    if (/(glitter|purpurina|diamante|diamantes|rainbow|arcoiris|sparkle|halo gradient|gradient)/.test(text)) return "sparkle";
    if (/(transparent|transparente|clear|crystal|cristal|exceptional|anti scratch|anti-scratch|degrad|c2\b)/.test(text)) {
      return "clear";
    }
    if (/(soporte|stand|ring|anillo|holder|tarjetero|card|camera|camara|lente|lens)/.test(text)) return "ring";
    if (/(silicona|silicone|mate|matte|soft|shockproof|armor|antigolpe|antigolpes|slim|bumper|hard pc|pc\+tpu|dual tone|dos tonos)/.test(text)) {
      return "matte";
    }
    return "default";
  }

  const ROOT_COVER_POOLS = {
    classic: buildNamedRange("fundas", 1, 16),
    matte: buildNamedRange("fundas", 17, 32),
    clear: buildNamedRange("fundas", 33, 48),
    ring: buildNamedRange("fundas", 49, 62),
  };

  const WHATSAPP_COVER_POOLS = {
    modern: buildRange(17, 81),
    color: buildRange(9, 81),
    classic: buildRange(1, 81),
    matte: buildRange(1, 81),
    clear: buildRange(1, 8).concat(buildRange(17, 81)),
    ring: buildRange(4, 6).concat(buildRange(20, 24)).concat(buildRange(28, 81)),
    sparkle: buildRange(25, 81),
  };

  const COVER_POOLS = WHATSAPP_COVER_POOLS;

  const IPHONE_17_PRO_MAX_PRODUCTS = [
    {
      id: 971001,
      name: "iPhone 17 Pro Max Scenic Case 01",
      category: "FUNDAS",
      tags: ["Apple", "iPhone 17 Pro Max", "Case", "Scenic"],
      price: "EUR 12.90",
      image: iphone17ProMaxAsset("iphone-17-pro-max-01.jpeg"),
      brand: "Apple",
      compatibleModel: "iPhone 17 Pro Max",
      shortDescription: "Premium scenic case with a warm cathedral-inspired print.",
      sourceTag: "iphone-17-pro-max-curated",
      sku: "IP17PM-001",
      uid: "iphone-17-pro-max-001",
    },
    {
      id: 971002,
      name: "iPhone 17 Pro Max Scenic Case 02",
      category: "FUNDAS",
      tags: ["Apple", "iPhone 17 Pro Max", "Case", "Scenic"],
      price: "EUR 12.90",
      image: iphone17ProMaxAsset("iphone-17-pro-max-02.jpeg"),
      brand: "Apple",
      compatibleModel: "iPhone 17 Pro Max",
      shortDescription: "Premium scenic case with a panoramic city-art print.",
      sourceTag: "iphone-17-pro-max-curated",
      sku: "IP17PM-002",
      uid: "iphone-17-pro-max-002",
    },
    {
      id: 971003,
      name: "iPhone 17 Pro Max Scenic Case 03",
      category: "FUNDAS",
      tags: ["Apple", "iPhone 17 Pro Max", "Case", "Scenic"],
      price: "EUR 12.90",
      image: iphone17ProMaxAsset("iphone-17-pro-max-03.jpeg"),
      brand: "Apple",
      compatibleModel: "iPhone 17 Pro Max",
      shortDescription: "Premium scenic case with a marble-look architectural print.",
      sourceTag: "iphone-17-pro-max-curated",
      sku: "IP17PM-003",
      uid: "iphone-17-pro-max-003",
    },
    {
      id: 971004,
      name: "iPhone 17 Pro Max Scenic Case 04",
      category: "FUNDAS",
      tags: ["Apple", "iPhone 17 Pro Max", "Case", "Scenic"],
      price: "EUR 12.90",
      image: iphone17ProMaxAsset("iphone-17-pro-max-04.jpeg"),
      brand: "Apple",
      compatibleModel: "iPhone 17 Pro Max",
      shortDescription: "Premium scenic case with a bright outdoor architecture print.",
      sourceTag: "iphone-17-pro-max-curated",
      sku: "IP17PM-004",
      uid: "iphone-17-pro-max-004",
    },
  ];
  const COVER_VARIANT_SETS = {
    default: [
      { key: "original", label: "Original", swatch: "#ffffff", opacity: 0 },
      { key: "midnight", label: "Midnight", swatch: "#17233d", opacity: 0.9 },
      { key: "cobalt", label: "Cobalt", swatch: "#2f6fff", opacity: 0.88 },
      { key: "emerald", label: "Emerald", swatch: "#43b07a", opacity: 0.88 },
      { key: "blush", label: "Blush", swatch: "#f08bb3", opacity: 0.86 },
      { key: "violet", label: "Violet", swatch: "#9b71ff", opacity: 0.88 },
      { key: "sand", label: "Sand", swatch: "#d9bf8b", opacity: 0.84 },
      { key: "clear", label: "Clear", swatch: "#f6f8fb", opacity: 0.52 },
    ],
    matte: [
      { key: "original", label: "Original", swatch: "#ffffff", opacity: 0 },
      { key: "graphite", label: "Graphite", swatch: "#364154", opacity: 0.88 },
      { key: "navy", label: "Navy", swatch: "#264f9d", opacity: 0.86 },
      { key: "sage", label: "Sage", swatch: "#8fae97", opacity: 0.82 },
      { key: "berry", label: "Berry", swatch: "#d97ea6", opacity: 0.84 },
      { key: "plum", label: "Plum", swatch: "#8f6ed5", opacity: 0.86 },
      { key: "gold", label: "Gold", swatch: "#cfa15b", opacity: 0.8 },
      { key: "mist", label: "Mist", swatch: "#dfe8ef", opacity: 0.48 },
    ],
    clear: [
      { key: "original", label: "Original", swatch: "#ffffff", opacity: 0 },
      { key: "black", label: "Black", swatch: "#151515", opacity: 0.92 },
      { key: "blue", label: "Blue", swatch: "#3182ff", opacity: 0.9 },
      { key: "green", label: "Green", swatch: "#44b273", opacity: 0.88 },
      { key: "pink", label: "Pink", swatch: "#ef8fb8", opacity: 0.86 },
      { key: "purple", label: "Purple", swatch: "#a377ff", opacity: 0.88 },
      { key: "red", label: "Red", swatch: "#d35a5a", opacity: 0.88 },
      { key: "gold", label: "Gold", swatch: "#d8ad56", opacity: 0.82 },
    ],
    ring: [
      { key: "original", label: "Original", swatch: "#ffffff", opacity: 0 },
      { key: "black", label: "Black", swatch: "#141414", opacity: 0.92 },
      { key: "blue", label: "Blue", swatch: "#245dff", opacity: 0.9 },
      { key: "green", label: "Green", swatch: "#2fa46d", opacity: 0.88 },
      { key: "pink", label: "Pink", swatch: "#ff91b6", opacity: 0.86 },
      { key: "purple", label: "Purple", swatch: "#9f73ff", opacity: 0.88 },
      { key: "teal", label: "Teal", swatch: "#3eb4b0", opacity: 0.88 },
      { key: "gold", label: "Gold", swatch: "#d8ab4f", opacity: 0.82 },
    ],
    sparkle: [
      { key: "original", label: "Original", swatch: "#ffffff", opacity: 0 },
      { key: "champagne", label: "Champagne", swatch: "#e0c18f", opacity: 0.84 },
      { key: "rose", label: "Rose", swatch: "#f28fb4", opacity: 0.84 },
      { key: "lavender", label: "Lavender", swatch: "#b89cff", opacity: 0.86 },
      { key: "sky", label: "Sky", swatch: "#76baff", opacity: 0.88 },
      { key: "mint", label: "Mint", swatch: "#82d9ad", opacity: 0.84 },
      { key: "gold", label: "Gold", swatch: "#dbb55a", opacity: 0.82 },
      { key: "silver", label: "Silver", swatch: "#dfe5ee", opacity: 0.5 },
    ],
  };

  function iphone17ProMaxAsset(name) {
    return versioned(`${IPHONE_17_PRO_MAX_IMAGE_BASE}/${name}`);
  }
  function simAsset(name) {
    return versioned(`${SIM_IMAGE_BASE}/${name}`);
  }

  const SIM_IMAGE_POOLS = {
    physical: {
      default: [
        "sim-vodafone-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-movistar-001.jpeg",
        "sim-movistar-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
      vodafone: [
        "sim-vodafone-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-movistar-001.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
      orange: [
        "sim-movistar-001.jpeg",
        "sim-movistar-002.jpeg",
        "sim-vodafone-001.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
      lebara: [
        "sim-lebara-001.jpeg",
        "sim-vodafone-001.jpeg",
        "sim-movistar-001.jpeg",
        "sim-movistar-002.jpeg",
        "sim-llamaya-001.jpeg",
      ],
      llamaya: [
        "sim-llamaya-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-movistar-001.jpeg",
        "sim-lebara-001.jpeg",
        "sim-movistar-002.jpeg",
      ],
      movistar: [
        "sim-movistar-001.jpeg",
        "sim-movistar-002.jpeg",
        "sim-vodafone-001.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
    },
    esim: {
      default: [
        "sim-vodafone-002.jpeg",
        "sim-movistar-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
        "sim-vodafone-001.jpeg",
        "sim-movistar-001.jpeg",
      ],
      vodafone: [
        "sim-vodafone-002.jpeg",
        "sim-vodafone-001.jpeg",
        "sim-movistar-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
      orange: [
        "sim-movistar-002.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
        "sim-movistar-001.jpeg",
      ],
      lebara: [
        "sim-lebara-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-movistar-002.jpeg",
        "sim-llamaya-001.jpeg",
        "sim-vodafone-001.jpeg",
      ],
      llamaya: [
        "sim-llamaya-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-movistar-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-vodafone-001.jpeg",
      ],
      movistar: [
        "sim-movistar-002.jpeg",
        "sim-movistar-001.jpeg",
        "sim-vodafone-002.jpeg",
        "sim-lebara-001.jpeg",
        "sim-llamaya-001.jpeg",
      ],
    },
  };

  function resolveSimImage(product) {
    const brand = detectSimBrand(product);
    const family = isESimProduct(product) ? "esim" : "physical";
    const poolMap = SIM_IMAGE_POOLS[family] || SIM_IMAGE_POOLS.physical;
    const pool = poolMap[brand] || poolMap.default;
    const salt = family === "esim" ? "sim-esim" : "sim-physical";
    return pickFromPool(product, pool, salt, SIM_IMAGE_BASE);
  }

  const SIM_PRODUCTS = [
    {
      id: 970001,
      name: "Vodafone SIM Card",
      category: "SIM",
      tags: ["SIM", "Vodafone", "Physical SIM"],
      price: "EUR 9.90",
      image: simAsset("sim-vodafone-001.jpeg"),
      brand: "Vodafone",
      compatibleModel: "SIM",
      shortDescription: "Vodafone physical SIM card ready for activation.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-VOD-001",
      uid: "sim-vodafone-001",
    },
    {
      id: 970002,
      name: "Vodafone eSIM",
      category: "SIM",
      tags: ["SIM", "Vodafone", "eSIM"],
      price: "EUR 12.90",
      image: simAsset("sim-vodafone-002.jpeg"),
      brand: "Vodafone",
      compatibleModel: "eSIM",
      shortDescription: "Vodafone eSIM activation card for quick digital setup.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-VOD-E01",
      uid: "sim-vodafone-e01",
    },
    {
      id: 970003,
      name: "Orange SIM Card",
      category: "SIM",
      tags: ["SIM", "Orange", "Physical SIM"],
      price: "EUR 9.90",
      image: simAsset("sim-movistar-001.jpeg"),
      brand: "Orange",
      compatibleModel: "SIM",
      shortDescription: "Orange physical SIM card for fast retail delivery.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-ORA-001",
      uid: "sim-orange-001",
    },
    {
      id: 970004,
      name: "Orange eSIM",
      category: "SIM",
      tags: ["SIM", "Orange", "eSIM"],
      price: "EUR 12.90",
      image: simAsset("sim-vodafone-001.jpeg"),
      brand: "Orange",
      compatibleModel: "eSIM",
      shortDescription: "Orange eSIM activation option for immediate setup.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-ORA-E01",
      uid: "sim-orange-e01",
    },
    {
      id: 970005,
      name: "Lebara SIM Card",
      category: "SIM",
      tags: ["SIM", "Lebara", "Physical SIM"],
      price: "EUR 9.90",
      image: simAsset("sim-lebara-001.jpeg"),
      brand: "Lebara",
      compatibleModel: "SIM",
      shortDescription: "Lebara physical SIM card for wholesale and retail orders.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-LEB-001",
      uid: "sim-lebara-001",
    },
    {
      id: 970006,
      name: "Lebara eSIM",
      category: "SIM",
      tags: ["SIM", "Lebara", "eSIM"],
      price: "EUR 12.90",
      image: simAsset("sim-lebara-001.jpeg"),
      brand: "Lebara",
      compatibleModel: "eSIM",
      shortDescription: "Lebara eSIM activation card for faster onboarding.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-LEB-E01",
      uid: "sim-lebara-e01",
    },
    {
      id: 970007,
      name: "Llamaya SIM Card",
      category: "SIM",
      tags: ["SIM", "Llamaya", "Physical SIM"],
      price: "EUR 9.90",
      image: simAsset("sim-llamaya-001.jpeg"),
      brand: "Llamaya",
      compatibleModel: "SIM",
      shortDescription: "Llamaya physical SIM card with clean carrier packaging.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-LLA-001",
      uid: "sim-llamaya-001",
    },
    {
      id: 970008,
      name: "Llamaya eSIM",
      category: "SIM",
      tags: ["SIM", "Llamaya", "eSIM"],
      price: "EUR 12.90",
      image: simAsset("sim-llamaya-001.jpeg"),
      brand: "Llamaya",
      compatibleModel: "eSIM",
      shortDescription: "Llamaya eSIM card for quick digital activation.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-LLA-E01",
      uid: "sim-llamaya-e01",
    },
    {
      id: 970009,
      name: "Movistar SIM Card",
      category: "SIM",
      tags: ["SIM", "Movistar", "Physical SIM"],
      price: "EUR 9.90",
      image: simAsset("sim-movistar-001.jpeg"),
      brand: "Movistar",
      compatibleModel: "SIM",
      shortDescription: "Movistar physical SIM card for standard inventory.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-MOV-001",
      uid: "sim-movistar-001",
    },
    {
      id: 970010,
      name: "Movistar eSIM",
      category: "SIM",
      tags: ["SIM", "Movistar", "eSIM"],
      price: "EUR 12.90",
      image: simAsset("sim-movistar-002.jpeg"),
      brand: "Movistar",
      compatibleModel: "eSIM",
      shortDescription: "Movistar eSIM activation card for instant delivery.",
      sourceTag: "sim-curated-2026",
      sku: "SIM-MOV-E01",
      uid: "sim-movistar-e01",
    },
  ];

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

  function augmentProducts(items) {
    const list = Array.isArray(items) ? items.slice() : [];
    if (list.some((p) => canonicalCategory(p) === "SIM")) return list;
    return list.concat(SIM_PRODUCTS);
  }

  function resolveFundasImage(product) {
    const brand = detectFundasBrand(product);
    const style = detectFundasStyle(product);
    const series = detectIphoneSeries(product) || "any";

    if (brand === "iphone") {
      return pickFromPools(
        product,
        [
          { key: "iphone-special", base: ROOT_COVER_IMAGE_BASE, items: IPHONE_SPECIAL_POOL },
          { key: "iphone-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
          { key: "iphone-root-matte", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.matte },
          { key: "iphone-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
          { key: "iphone-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
        ],
        `iphone-${series}-${style}`
      );
    }

    if (brand === "samsung") {
      return pickFromPools(
        product,
        [
          { key: "samsung-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
          { key: "samsung-root-matte", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.matte },
          { key: "samsung-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "samsung-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
          { key: "samsung-wa-ring", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.ring },
        ],
        `samsung-${style}`
      );
    }

    if (brand === "google") {
      return pickFromPools(
        product,
        [
          { key: "google-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
          { key: "google-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "google-wa-sparkle", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.sparkle },
          { key: "google-wa-clear", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.clear },
        ],
        `google-${style}`
      );
    }

    if (brand === "xiaomi" || brand === "redmi" || brand === "oppo") {
      return pickFromPools(
        product,
        [
          { key: "android-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
          { key: "android-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
          { key: "android-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
          { key: "android-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
        ],
        `${brand}-${style}`
      );
    }

    if (style === "sparkle") {
      return pickFromPools(
        product,
        [
          { key: "generic-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "generic-wa-sparkle", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.sparkle },
        ],
        "generic-sparkle"
      );
    }
    if (style === "clear") {
      return pickFromPools(
        product,
        [
          { key: "generic-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
          { key: "generic-wa-clear", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.clear },
        ],
        "generic-clear"
      );
    }
    if (style === "ring") {
      return pickFromPools(
        product,
        [
          { key: "generic-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "generic-wa-ring", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.ring },
        ],
        "generic-ring"
      );
    }
    if (style === "matte") {
      return pickFromPools(
        product,
        [
          { key: "generic-root-matte", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.matte },
          { key: "generic-wa-matte", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.matte },
        ],
        "generic-matte"
      );
    }
    return pickFromPools(
      product,
      [
        { key: "generic-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
        { key: "generic-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
        { key: "generic-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
      ],
      "generic"
    );
  }

  function resolveAccessoryImage(product) {
    const text = productText(product);
    const category = canonicalCategory(product);

    if (/(screen protector|protector.*pantall|pantalla|cristal templado|tempered glass)/.test(text) || category === "PROTECTORES_PHONE") {
      return pickFromPools(
        product,
        [
          { key: "screen-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
          { key: "screen-wa-clear", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.clear },
          { key: "screen-wa-sparkle", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.sparkle },
        ],
        "screen-protector"
      );
    }

    if (
      (/(camera|camara|lente|lens)/.test(text) && /(protector|glass|cristal|templad|shield|film)/.test(text)) ||
      category === "PROTECTORES_CAMERA"
    ) {
      return pickFromPools(
        product,
        [
          { key: "camera-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "camera-wa-ring", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.ring },
        ],
        "camera-protector"
      );
    }

    if (/(power ?bank|bateria externa|powerbank)/.test(text) || category === "POWER_BANK") {
      return pickFromPools(
        product,
        [
          { key: "power-root-matte", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.matte },
          { key: "power-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
        ],
        "power-bank"
      );
    }

    if (/(smart ?watch|watch band|correa|pulsera|mi band|xm band)/.test(text) || category === "SMART_WATCH") {
      return pickFromPools(
        product,
        [
          { key: "watch-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
          { key: "watch-wa-sparkle", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.sparkle },
        ],
        "smart-watch"
      );
    }

    if (/(airpods case|air pods case|airpods protection case|air pods protection case|airpods cover|air pods cover)/.test(text)) {
      return pickFromPools(
        product,
        [
          { key: "airpods-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "airpods-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
        ],
        "airpods-case"
      );
    }

    if (/(airpods|earbuds|earphone|headphone|audio|speaker|auriculares)/.test(text) || category === "AUDIO") {
      return pickFromPools(
        product,
        [
          { key: "audio-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
          { key: "audio-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
        ],
        "audio"
      );
    }

    if (/(cordon|lanyard|soporte|stand|holder|car mount|magnetic card)/.test(text) || category === "MOBILE_ACCESSORIES") {
      return pickFromPools(
        product,
        [
          { key: "mobile-root-ring", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.ring },
          { key: "mobile-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
        ],
        "mobile-accessories"
      );
    }

    if (/(charger|cargador|cable|usb|adapter|adaptador|sd card|tarjeta memoria|flash drive|memoria)/.test(text) || category === "ACCESSORIES") {
      return pickFromPools(
        product,
        [
          { key: "accessories-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
          { key: "accessories-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
          { key: "accessories-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
          { key: "accessories-wa-color", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.color },
        ],
        "accessories"
      );
    }

    return pickFromPools(
      product,
      [
        { key: "fallback-root-classic", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.classic },
        { key: "fallback-root-clear", base: ROOT_COVER_IMAGE_BASE, items: ROOT_COVER_POOLS.clear },
        { key: "fallback-wa-modern", base: COVER_IMAGE_BASE, items: WHATSAPP_COVER_POOLS.modern },
      ],
      "fallback"
    );
  }

  function resolveProductImage(product) {
    if (String(product?.sourceTag || "") === "iphone-17-pro-max-curated" && product?.image) {
      return versioned(product.image);
    }
    const category = canonicalCategory(product);
    if (category === "SIM") {
      return resolveSimImage(product);
    }

    const text = productText(product);
    if (/(funda|fundas|case|cover|carcasa|bumper|magsafe|silicona|silicone)/.test(text) || category === "FUNDAS") {
      return resolveFundasImage(product);
    }

    return resolveAccessoryImage(product);
  }

  function coverVariantTheme(product) {
    const style = detectFundasStyle(product);
    if (style === "sparkle") return "sparkle";
    if (style === "matte") return "matte";
    if (style === "ring") return "ring";
    if (style === "clear") return "clear";
    return "default";
  }

  function getCoverVariants(product) {
    if (canonicalCategory(product) !== "FUNDAS") return [];

    const theme = coverVariantTheme(product);
    const baseSet = COVER_VARIANT_SETS[theme] || COVER_VARIANT_SETS.default;
    const seed = stableHash([product?.id, product?.sku, product?.name, theme].filter(Boolean).join("|"));
    const [primary, ...rest] = baseSet;
    const offset = rest.length ? seed % rest.length : 0;
    const rotated = [primary, ...rest.slice(offset).concat(rest.slice(0, offset))];
    const image = resolveProductImage(product);

    return rotated.slice(0, 8).map((variant) => ({
      key: `${theme}-${variant.key}`,
      label: variant.label,
      swatch: variant.swatch,
      opacity: variant.opacity,
      image,
    }));
  }

  window.TWM_CATALOG = Object.assign({}, window.TWM_CATALOG, {
    augmentProducts,
    canonicalCategory,
    detectFundasBrand,
    detectFundasStyle,
    getCoverVariants,
    resolveProductImage,
    curatedIphone17ProMaxProducts: IPHONE_17_PRO_MAX_PRODUCTS,
    simProducts: SIM_PRODUCTS,
    placeholderImage: PLACEHOLDER_IMAGE,
  });
})();





