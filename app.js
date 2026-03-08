const categories = [
  { key: "ALL", label: "ALL PRODUCTS", icon: "*" },
  { key: "MARCA", label: "MARCA", icon: "M" },
  { key: "FUNDA", label: "FUNDA", icon: "F" },
  { key: "PROTECTORES PANTALLA", label: "PROTECTORES PANTALLA", icon: "P" },
  { key: "CARGADORES", label: "CARGADORES", icon: "C" },
  { key: "CABLE", label: "CABLE", icon: "CB" },
  { key: "AUDIO", label: "AUDIO", icon: "A" },
  { key: "SOPORTE", label: "SOPORTE", icon: "S" },
  { key: "INFORMÁTICA", label: "INFORMÁTICA", icon: "I" },
  { key: "GADGETS", label: "GADGETS", icon: "G" },
  { key: "TARJETA MEMORIAS", label: "TARJETA MEMORIAS", icon: "T" },
];

const state = {
  all: [],
  filtered: [],
  active: "ALL",
  query: "",
  visible: 48,
  tileOpen: null,
};

const megaSubcats = {
  ALL: ["Top Deals", "New Arrivals", "Best Sellers", "Premium Picks", "Wholesale Packs", "Express Delivery"],
  MARCA: ["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Vivo"],
  FUNDA: ["MagSafe Cases", "Transparent Cases", "Shockproof", "Leather Style", "Glitter Cases", "Slim Fit"],
  "PROTECTORES PANTALLA": ["9H Tempered", "Privacy Glass", "Camera Lens", "Matte Film", "HD Clear", "Full Cover"],
  CARGADORES: ["20W Fast", "USB-C PD", "Wireless", "Car Charger", "Multi-Port", "Travel Adapter"],
  CABLE: ["Type-C Cable", "Lightning", "Micro USB", "Braided", "2m Length", "Data Sync"],
  AUDIO: ["TWS Earbuds", "Headphones", "Neckband", "Gaming Audio", "Bluetooth Speaker", "Microphone"],
  SOPORTE: ["Car Mount", "Desk Stand", "Ring Holder", "Magnetic Holder", "Tripod", "Bike Mount"],
  "INFORMÁTICA": ["Keyboard", "Mouse", "USB Hub", "Laptop Sleeve", "Cooling Pad", "Storage"],
  GADGETS: ["Smart Watch", "Mini Fan", "LED Lights", "Phone Trigger", "Camera Tools", "Utility Tech"],
  "TARJETA MEMORIAS": ["MicroSD 32GB", "MicroSD 64GB", "MicroSD 128GB", "Card Reader", "High Speed", "Class 10"],
};

const els = {
  catList: document.getElementById("cat-list"),
  grid: document.getElementById("product-grid"),
  count: document.getElementById("result-count"),
  title: document.getElementById("section-title"),
  search: document.getElementById("search"),
  searchTop: document.getElementById("search-top"),
  searchHeader: document.getElementById("search-header"),
  loadMore: document.getElementById("load-more"),
  heroTrack: document.getElementById("hero-track"),
  heroPrev: document.getElementById("hero-prev"),
  heroNext: document.getElementById("hero-next"),
  heroDots: document.getElementById("hero-dots"),
  specialPreviewGrid: document.getElementById("special-preview-grid"),
  flashGrid: document.getElementById("flash-grid"),
  studioCases: document.getElementById("studio-cases"),
  fundasGrid: document.getElementById("fundas-grid"),
  fanCardA: document.getElementById("fan-card-a"),
  fanCardB: document.getElementById("fan-card-b"),
  fanCardC: document.getElementById("fan-card-c"),
  apCam: document.getElementById("ap-cam"),
  apStrap: document.getElementById("ap-strap"),
  apGlass: document.getElementById("ap-glass"),
  apPower: document.getElementById("ap-power"),
  apCharge: document.getElementById("ap-charge"),
  apAudio: document.getElementById("ap-audio"),
  catTiles: document.getElementById("cat-tiles"),
  catTilesPanel: document.getElementById("cat-tiles-panel"),
  megaMenu: document.getElementById("mega-menu"),
  profileBtn: document.getElementById("profile-btn"),
  authModal: document.getElementById("auth-modal"),
  authClose: document.getElementById("auth-close"),
  tabLogin: document.getElementById("tab-login"),
  tabSignup: document.getElementById("tab-signup"),
  loginForm: document.getElementById("login-form"),
  signupForm: document.getElementById("signup-form"),
  authSession: document.getElementById("auth-session"),
  authWelcome: document.getElementById("auth-welcome"),
  authMsg: document.getElementById("auth-msg"),
  logoutBtn: document.getElementById("logout-btn"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  signupName: document.getElementById("signup-name"),
  signupEmail: document.getElementById("signup-email"),
  signupPhone: document.getElementById("signup-phone"),
  signupPassword: document.getElementById("signup-password"),
};

let heroIdx = 0;
let heroTimer;
let megaTimer = null;

const AUTH_KEYS = {
  users: "twm_users_v1",
  session: "twm_session_v1",
  contacts: "twm_contacts_v1",
};

function priceText(p) {
  return p && p.trim() ? p : "Wholesale Price";
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function computeCounts(products) {
  const counts = {};
  for (const c of categories) counts[c.key] = 0;
  counts.ALL = products.length;
  for (const p of products) {
    if (counts[p.category] !== undefined) counts[p.category] += 1;
  }
  return counts;
}

function pickMegaProducts(key, limit = 4) {
  const base = key === "ALL" ? state.all : state.all.filter((p) => p.category === key);
  const picks = [];
  const seen = new Set();
  for (const p of base) {
    if (!p.image || seen.has(p.image)) continue;
    picks.push(p);
    seen.add(p.image);
    if (picks.length >= limit) break;
  }
  return picks;
}

function renderMegaMenu(key) {
  if (!els.megaMenu) return;
  const labels = megaSubcats[key] || megaSubcats.ALL;
  const items = pickMegaProducts(key, 4);
  const title = key === "ALL" ? "All Categories" : key;

  els.megaMenu.innerHTML = `
    <div class="mega-head">${escapeHtml(title)}</div>
    <div class="mega-grid">
      <div class="mega-links">
        ${labels.map((l) => `<a href="store.html">${escapeHtml(l)}</a>`).join("")}
      </div>
      <div class="mega-products">
        ${items
          .map(
            (p) => `
          <article class="mega-product">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
            <p>${escapeHtml(shortText(p.name, 48))}</p>
          </article>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function showMegaMenu(key) {
  if (!els.megaMenu || window.innerWidth <= 980) return;
  renderMegaMenu(key);
  els.megaMenu.classList.add("open");
}

function hideMegaMenuSoon() {
  if (!els.megaMenu) return;
  clearTimeout(megaTimer);
  megaTimer = setTimeout(() => els.megaMenu.classList.remove("open"), 140);
}

function renderCategories() {
  const counts = computeCounts(state.all);
  els.catList.innerHTML = categories
    .map(
      (c) => `
      <li class="cat-item ${c.key === state.active ? "active" : ""}" data-key="${c.key}">
        <a class="cat-link" href="${c.key === "ALL" ? "index.html" : `category.html?cat=${encodeURIComponent(c.key)}`}">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-name">${c.label}</span>
          <span class="cat-count">${counts[c.key] || 0}</span>
        </a>
      </li>`
    )
    .join("");

  els.catList.querySelectorAll(".cat-item").forEach((li) => {
    const link = li.querySelector(".cat-link");
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const key = li.dataset.key;
        if (!key) return;
        if (state.active === key && key !== "ALL") {
          state.active = "ALL";
        } else {
          state.active = key;
        }
        state.visible = 48;
        applyFilters();
        renderCategories();
      });
    }

    li.addEventListener("mouseenter", () => {
      clearTimeout(megaTimer);
      showMegaMenu(li.dataset.key);
    });
    li.addEventListener("mouseleave", hideMegaMenuSoon);
  });

  if (els.megaMenu) {
    els.megaMenu.onmouseenter = () => clearTimeout(megaTimer);
    els.megaMenu.onmouseleave = hideMegaMenuSoon;
  }
}

function renderCategoryTiles() {
  if (!els.catTiles) return;
  const show = categories.filter((c) => c.key !== "ALL");
  els.catTiles.innerHTML = show
    .map((c) => {
      const item = state.all.find((p) => p.category === c.key && p.image) || state.all.find((p) => p.image);
      const image = item?.image || "1.png";
      return `
      <button class="dc-item ${state.tileOpen === c.key ? "active" : ""}" type="button" data-cat="${escapeHtml(c.key)}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(c.label)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <span>${escapeHtml(c.label)}</span>
      </button>`;
    })
    .join("");

  els.catTiles.querySelectorAll(".dc-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-cat") || "";
      if (!key) return;
      if (state.tileOpen === key) {
        state.tileOpen = null;
        renderCategoryTiles();
        renderCategoryTilesPanel();
        return;
      }
      state.tileOpen = key;
      renderCategoryTiles();
      renderCategoryTilesPanel();
    });
  });
}

function renderCategoryTilesPanel() {
  if (!els.catTilesPanel) return;
  if (!state.tileOpen) {
    els.catTilesPanel.classList.remove("open");
    els.catTilesPanel.innerHTML = "";
    return;
  }

  const key = state.tileOpen;
  const labels = megaSubcats[key] || [];
  const products = pickMegaProducts(key, 4);
  const count = state.all.filter((p) => p.category === key).length;

  els.catTilesPanel.innerHTML = `
    <div class="dc-panel-head">
      <h3>${escapeHtml(key)}</h3>
      <a href="category.html?cat=${encodeURIComponent(key)}">View ${escapeHtml(String(count))} Products</a>
    </div>
    <div class="dc-panel-tags">
      ${labels.map((l) => `<span>${escapeHtml(l)}</span>`).join("")}
    </div>
    <div class="dc-panel-products">
      ${products
        .map(
          (p) => `
        <a class="dc-mini" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
          <p>${escapeHtml(shortText(p.name, 48))}</p>
        </a>`
        )
        .join("")}
    </div>`;

  els.catTilesPanel.classList.add("open");
}

function applyFilters() {
  const q = state.query.trim().toLowerCase();
  let out = state.all;

  if (state.active !== "ALL") {
    out = out.filter((p) => p.category === state.active);
  }

  if (q) {
    out = out.filter((p) => p.name.toLowerCase().includes(q));
  }

  state.filtered = out;
  renderProducts();
}

function renderProducts() {
  const visibleItems = state.filtered.slice(0, state.visible);

  els.grid.innerHTML = visibleItems
    .map(
      (p) => `
      <article class="card">
        <a class="card-link" href="product.html?pid=${encodeURIComponent(p.id)}">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        </a>
        <div class="card-body">
          <h3><a class="card-title-link" href="product.html?pid=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></h3>
          <p class="meta">${escapeHtml(p.category)}</p>
          <div class="price">${escapeHtml(priceText(p.price))}</div>
          <div class="card-actions">
            <a class="mini-link" href="product.html?pid=${encodeURIComponent(p.id)}">View</a>
            <button
              type="button"
              class="mini-cart-btn"
              data-add-cart="1"
              data-id="${escapeHtml(p.id)}"
              data-name="${escapeHtml(p.name)}"
              data-price="${escapeHtml(priceText(p.price))}"
              data-image="${escapeHtml(p.image)}"
              data-category="${escapeHtml(p.category)}">Add to Cart</button>
          </div>
        </div>
      </article>`
    )
    .join("");

  els.count.textContent = `${state.filtered.length} items`;
  els.title.textContent = state.active === "ALL" ? "All Products" : state.active;

  const hasMore = state.visible < state.filtered.length;
  els.loadMore.style.display = hasMore ? "inline-block" : "none";
}

function pickSpecialProducts(items, limit = 6) {
  const preferred = ["FUNDA", "AUDIO", "CARGADORES", "PROTECTORES PANTALLA", "CABLE", "SOPORTE"];
  const out = [];

  for (const cat of preferred) {
    const found = items.find((p) => p.category === cat && !out.some((o) => o.id === p.id));
    if (found) out.push(found);
    if (out.length >= limit) return out;
  }

  for (const p of items) {
    if (!out.some((o) => o.id === p.id)) out.push(p);
    if (out.length >= limit) break;
  }

  return out;
}

function renderSpecialPreview() {
  if (!els.specialPreviewGrid) return;

  const special = pickSpecialProducts(state.all, 6);
  els.specialPreviewGrid.innerHTML = special
    .map(
      (p) => `
      <article class="special-mini-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <div class="special-mini-body">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${escapeHtml(p.category)}</p>
          <div class="special-mini-foot">
            <span>${escapeHtml(priceText(p.price))}</span>
            <a href="special-products.html?pid=${encodeURIComponent(p.id)}">Open</a>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function extractNumericPrice(raw) {
  const s = String(raw || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return s ? Number(s[1]) : null;
}

function formatRs(v) {
  return `Rs.${Math.round(v).toLocaleString("en-US")}`;
}

function dealPercentFromId(id) {
  const txt = String(id || "");
  let h = 0;
  for (let i = 0; i < txt.length; i += 1) h = (h * 31 + txt.charCodeAt(i)) % 9973;
  return 10 + (h % 46); // 10%..55%
}

function pickFlashProducts(items, limit = 6) {
  const preferred = ["FUNDA", "AUDIO", "CARGADORES", "CABLE", "GADGETS", "PROTECTORES PANTALLA"];
  const out = [];
  const seen = new Set();

  for (const cat of preferred) {
    for (const p of items) {
      if (p.category !== cat || seen.has(p.id)) continue;
      out.push(p);
      seen.add(p.id);
      break;
    }
    if (out.length >= limit) return out;
  }

  for (const p of items) {
    if (seen.has(p.id)) continue;
    out.push(p);
    seen.add(p.id);
    if (out.length >= limit) break;
  }
  return out;
}

function renderFlashSale() {
  if (!els.flashGrid) return;
  const flash = pickFlashProducts(state.all, 6);

  els.flashGrid.innerHTML = flash
    .map((p) => {
      const current = extractNumericPrice(priceText(p.price));
      const off = dealPercentFromId(p.id);
      const old = current ? current * (1 + off / 100) : null;
      const currentText = current ? formatRs(current) : escapeHtml(priceText(p.price));
      const oldText = old ? formatRs(old) : "";

      return `
      <article class="flash-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <h3>${escapeHtml(shortText(p.name, 52))}</h3>
        <div class="flash-price">${currentText}</div>
        <div class="flash-meta">
          ${oldText ? `<s>${oldText}</s>` : `<span></span>`}
          <b>-${off}%</b>
        </div>
      </article>`;
    })
    .join("");
}

function pickStudioProducts(items, limit = 6) {
  const funda = items.filter((p) => p.category === "FUNDA");
  const source = funda.length ? funda : items;
  const out = [];
  const seenImages = new Set();

  for (const p of source) {
    const key = (p.image || "").toLowerCase();
    if (!key || seenImages.has(key)) continue;
    seenImages.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }

  if (out.length < limit) {
    for (const p of items) {
      if (out.some((o) => o.id === p.id)) continue;
      const key = (p.image || "").toLowerCase();
      if (!key || seenImages.has(key)) continue;
      seenImages.add(key);
      out.push(p);
      if (out.length >= limit) break;
    }
  }

  return out;
}

function shortText(v, max = 34) {
  if (!v) return "";
  return v.length > max ? `${v.slice(0, max - 1)}...` : v;
}

function renderStudioCases() {
  if (!els.studioCases) return;
  const studioItems = pickStudioProducts(state.all, 6);

  els.studioCases.innerHTML = studioItems
    .map(
      (p) => `
      <article class="case-item dynamic-case">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <div class="lens"></div>
        <div class="case-label">${escapeHtml(shortText(p.name.toUpperCase(), 30))}</div>
      </article>`
    )
    .join("");
}

function renderFanBusinessCards() {
  const cards = [els.fanCardA, els.fanCardB, els.fanCardC].filter(Boolean);
  if (!cards.length) return;

  const categories = ["FUNDA", "CARGADORES", "AUDIO"];
  const picks = [];
  const seen = new Set();

  for (const c of categories) {
    const found = state.all.find((p) => p.category === c && p.image && !seen.has(p.image));
    if (found) {
      picks.push(found);
      seen.add(found.image);
    }
  }

  for (const p of state.all) {
    if (p.image && !seen.has(p.image)) {
      picks.push(p);
      seen.add(p.image);
    }
    if (picks.length >= 3) break;
  }

  cards.forEach((card, i) => {
    const item = picks[i];
    if (!item) return;
    card.style.backgroundImage = `linear-gradient(180deg, rgba(4,16,35,.18), rgba(4,16,35,.46)), url("${item.image}")`;
  });
}

function renderFundasLifestyle() {
  if (!els.fundasGrid) return;

  const labels = [
    "Transparentes",
    "Basicas",
    "Compatibles con MagSafe",
    "Impacto",
    "Silicona Soft",
    "Premium Sparkle",
  ];

  const adImages = [
    "assets/lifestyle/ad1.jpg",
    "assets/lifestyle/ad2.jpg",
    "assets/lifestyle/ad3.jpg",
    "assets/lifestyle/ad4.jpg",
    "assets/lifestyle/ad5.jpg",
    "assets/lifestyle/ad6.jpg",
  ];

  els.fundasGrid.innerHTML = adImages
    .map((img, i) => {
      const label = labels[i] || "Funda Premium";
      return `
      <article class="funda-card life-card">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(label)}" loading="lazy" onerror="this.onerror=null;this.src='1.png';" />
        <span>${escapeHtml(label)}</span>
      </article>`;
    })
    .join("");
}

function renderAccessoryCards() {
  const mapping = [
    { el: els.apCam, img: "assets/products/5371e580dc174115a8054cd3544074d6.jpg" },
    { el: els.apStrap, img: "assets/products/82ca3158f1b4a814f39340c22444b696.jpg" },
    { el: els.apGlass, img: "assets/products/0784ac3d71cdb4b4dab4c884ece53dce.jpg" },
    { el: els.apPower, img: "assets/products/396ef4e1443c3b6f4a1c2cc22653cea5.jpg" },
    { el: els.apCharge, img: "assets/products/0eef1d408c7ce9dc88c9734d85d23212.jpg" },
    { el: els.apAudio, img: "assets/products/29c1397780f2c32f3416bbaba6af1e30.jpg" },
  ];

  mapping.forEach((m) => {
    if (!m.el) return;
    m.el.style.backgroundImage = "none";
    let img = m.el.querySelector(".ap-photo");
    if (!img) {
      img = document.createElement("img");
      img.className = "ap-photo";
      img.alt = "Accessory";
      img.loading = "lazy";
      m.el.insertBefore(img, m.el.firstChild);
    }
    img.src = m.img;
    img.onerror = () => {
      img.src = "1.png";
    };
  });
}

function getJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showAuthMsg(msg) {
  if (!els.authMsg) return;
  els.authMsg.textContent = msg || "";
}

function setAuthTab(tab) {
  if (!els.tabLogin || !els.tabSignup || !els.loginForm || !els.signupForm) return;
  const login = tab === "login";
  els.tabLogin.classList.toggle("active", login);
  els.tabSignup.classList.toggle("active", !login);
  els.loginForm.classList.toggle("hidden", !login);
  els.signupForm.classList.toggle("hidden", login);
  if (els.authSession) els.authSession.classList.add("hidden");
  showAuthMsg("");
}

function updateAuthUI() {
  const session = getJson(AUTH_KEYS.session, null);
  if (!els.profileBtn) return;
  if (session && session.name) {
    els.profileBtn.textContent = session.name.trim().slice(0, 1).toUpperCase() || "👤";
    if (els.authWelcome) els.authWelcome.textContent = `Welcome, ${session.name}`;
  } else {
    els.profileBtn.textContent = "👤";
    if (els.authWelcome) els.authWelcome.textContent = "Welcome";
  }
}

function openAuthModal() {
  if (!els.authModal) return;
  els.authModal.classList.add("open");
  const session = getJson(AUTH_KEYS.session, null);
  if (session && els.authSession) {
    if (els.authWelcome) els.authWelcome.textContent = `Welcome, ${session.name}`;
    els.authSession.classList.remove("hidden");
    if (els.loginForm) els.loginForm.classList.add("hidden");
    if (els.signupForm) els.signupForm.classList.add("hidden");
    if (els.tabLogin) els.tabLogin.classList.remove("active");
    if (els.tabSignup) els.tabSignup.classList.remove("active");
    showAuthMsg("You are logged in.");
    return;
  }
  setAuthTab("login");
}

function closeAuthModal() {
  if (!els.authModal) return;
  els.authModal.classList.remove("open");
  showAuthMsg("");
}

function setupAuth() {
  if (!els.profileBtn || !els.authModal) return;

  updateAuthUI();
  setAuthTab("login");

  els.profileBtn.addEventListener("click", openAuthModal);
  if (els.authClose) els.authClose.addEventListener("click", closeAuthModal);
  els.authModal.addEventListener("click", (e) => {
    if (e.target === els.authModal) closeAuthModal();
  });
  if (els.tabLogin) els.tabLogin.addEventListener("click", () => setAuthTab("login"));
  if (els.tabSignup) els.tabSignup.addEventListener("click", () => setAuthTab("signup"));

  if (els.signupForm) {
    els.signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (els.signupName?.value || "").trim();
      const email = (els.signupEmail?.value || "").trim().toLowerCase();
      const phone = (els.signupPhone?.value || "").trim();
      const password = els.signupPassword?.value || "";

      if (!name || !email || !phone || password.length < 6) {
        showAuthMsg("Fill all fields. Password must be at least 6 characters.");
        return;
      }

      const users = getJson(AUTH_KEYS.users, []);
      if (users.some((u) => (u.email || "").toLowerCase() === email)) {
        showAuthMsg("Email already registered. Please login.");
        return;
      }

      const user = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      setJson(AUTH_KEYS.users, users);

      const contacts = getJson(AUTH_KEYS.contacts, []);
      contacts.push({ name, email, phone, source: "signup", addedAt: new Date().toISOString() });
      setJson(AUTH_KEYS.contacts, contacts);

      setJson(AUTH_KEYS.session, { id: user.id, name: user.name, email: user.email, phone: user.phone });
      updateAuthUI();
      if (els.authSession) els.authSession.classList.remove("hidden");
      if (els.loginForm) els.loginForm.classList.add("hidden");
      if (els.signupForm) els.signupForm.classList.add("hidden");
      if (els.tabLogin) els.tabLogin.classList.remove("active");
      if (els.tabSignup) els.tabSignup.classList.remove("active");
      showAuthMsg("Account created successfully.");
    });
  }

  if (els.loginForm) {
    els.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (els.loginEmail?.value || "").trim().toLowerCase();
      const password = els.loginPassword?.value || "";
      const users = getJson(AUTH_KEYS.users, []);

      const user = users.find((u) => (u.email || "").toLowerCase() === email && u.password === password);
      if (!user) {
        showAuthMsg("Invalid email or password.");
        return;
      }

      setJson(AUTH_KEYS.session, { id: user.id, name: user.name, email: user.email, phone: user.phone });
      updateAuthUI();
      if (els.authSession) els.authSession.classList.remove("hidden");
      if (els.loginForm) els.loginForm.classList.add("hidden");
      if (els.signupForm) els.signupForm.classList.add("hidden");
      if (els.tabLogin) els.tabLogin.classList.remove("active");
      if (els.tabSignup) els.tabSignup.classList.remove("active");
      showAuthMsg("Login successful.");
    });
  }

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(AUTH_KEYS.session);
      updateAuthUI();
      setAuthTab("login");
      if (els.authSession) els.authSession.classList.add("hidden");
      showAuthMsg("Logged out.");
    });
  }
}

function setupSearch() {
  function onInput(value, source) {
    state.query = value;
    state.visible = 48;
    if (source !== "top" && els.searchTop) els.searchTop.value = value;
    if (source !== "header" && els.searchHeader) els.searchHeader.value = value;
    if (source !== "main" && els.search) els.search.value = value;
    applyFilters();
  }

  els.search.addEventListener("input", (e) => {
    onInput(e.target.value, "main");
  });

  if (els.searchTop) {
    els.searchTop.addEventListener("input", (e) => {
      onInput(e.target.value, "top");
    });
  }

  if (els.searchHeader) {
    els.searchHeader.addEventListener("input", (e) => {
      onInput(e.target.value, "header");
    });
  }

  els.loadMore.addEventListener("click", () => {
    state.visible += 48;
    renderProducts();
  });
}

function renderHeroDots(total) {
  els.heroDots.innerHTML = Array.from({ length: total })
    .map((_, i) => `<span class="hero-dot ${i === 0 ? "active" : ""}" data-i="${i}"></span>`)
    .join("");

  els.heroDots.querySelectorAll(".hero-dot").forEach((d) => {
    d.addEventListener("click", () => {
      heroIdx = Number(d.dataset.i) || 0;
      updateHero();
      restartHero();
    });
  });
}

function updateHero() {
  els.heroTrack.style.transform = `translateX(${-heroIdx * 50}%)`;
  document.querySelectorAll(".hero-dot").forEach((d, i) => d.classList.toggle("active", i === heroIdx));
  document.querySelectorAll(".hero-slide img").forEach((img, i) => {
    img.style.transform = i === heroIdx ? "scale(1.08)" : "scale(1.03)";
  });
}

function restartHero() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    heroIdx = (heroIdx + 1) % 2;
    updateHero();
  }, 5000);
}

function setupHero() {
  renderHeroDots(2);
  updateHero();
  restartHero();

  els.heroPrev.addEventListener("click", () => {
    heroIdx = (heroIdx - 1 + 2) % 2;
    updateHero();
    restartHero();
  });

  els.heroNext.addEventListener("click", () => {
    heroIdx = (heroIdx + 1) % 2;
    updateHero();
    restartHero();
  });

  const box = document.querySelector(".hero-slider");
  box.addEventListener("mouseenter", () => clearInterval(heroTimer));
  box.addEventListener("mouseleave", restartHero);
}

async function init() {
  setupAuth();
  setupHero();
  setupSearch();

  const res = await fetch("products.json", { cache: "no-store" });
  const data = await res.json();

  state.all = Array.isArray(data) ? data : [];
  renderCategories();
  applyFilters();
  renderStudioCases();
  renderFundasLifestyle();
  renderAccessoryCards();
  renderFanBusinessCards();
  renderSpecialPreview();
  renderCategoryTiles();
  renderFlashSale();
}

init().catch((err) => {
  console.error(err);
  els.grid.innerHTML = '<p>Failed to load products.</p>';
});

