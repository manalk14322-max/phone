(() => {
  const SELECTOR = [
    ".product-card img",
    ".card img",
    ".pd-main-image",
    ".pd-related-card img",
    ".special-page-card img",
    ".pf-card img",
    ".bc-card img",
    ".category-card img",
    ".cart-item img",
    ".twm-cart-item img",
  ].join(",");

  let serial = 0;
  let observer = null;

  function extFromSrc(src) {
    const clean = String(src || "").split("?")[0].split("#")[0].toLowerCase();
    if (clean.endsWith(".png")) return "png";
    if (clean.endsWith(".webp")) return "webp";
    if (clean.endsWith(".avif")) return "avif";
    return "jpg";
  }

  function makeBrandName(src) {
    serial += 1;
    const ext = extFromSrc(src);
    return `the-world-mobile-product-${String(serial).padStart(3, "0")}.${ext}`;
  }

  function looksSuspicious(src, alt) {
    let decoded = "";
    try {
      decoded = decodeURIComponent(String(src || ""));
    } catch {
      decoded = String(src || "");
    }

    const combined = `${decoded} ${String(alt || "")}`.toLowerCase();
    return (
      combined.includes("ellietech") ||
      combined.includes("ellie") ||
      combined.includes("wp-content") ||
      combined.includes("/assets/products/") ||
      combined.includes("\\assets\\products\\") ||
      /%e[0-9a-f]{2}/i.test(String(src || "")) ||
      /[\u4e00-\u9fff]/.test(decoded)
    );
  }

  function ensureWrap(img) {
    const parent = img.parentElement;
    if (!parent) return null;

    if (parent.classList.contains("twm-brand-wrap")) {
      return parent;
    }

    const wrap = document.createElement("span");
    wrap.className = "twm-brand-wrap";
    parent.insertBefore(wrap, img);
    wrap.appendChild(img);
    return wrap;
  }

  function brandImage(img) {
    if (!img || img.dataset.twmBranded === "1") return;

    const src = img.currentSrc || img.getAttribute("src") || "";
    const suspicious = looksSuspicious(src, img.alt);
    const wrap = ensureWrap(img);
    if (!wrap) return;

    const brandedName = makeBrandName(src);
    img.alt = brandedName;
    img.setAttribute("data-branded-name", brandedName);
    img.classList.add("twm-brand-image");
    if (suspicious) img.classList.add("twm-brand-image-strong");

    const mark = document.createElement("small");
    mark.className = suspicious ? "twm-brand-watermark is-strong" : "twm-brand-watermark";
    mark.textContent = "The World Mobile";
    wrap.appendChild(mark);

    img.loading = "lazy";
    img.decoding = "async";
    img.dataset.twmBranded = "1";
  }

  function scan(root = document) {
    root.querySelectorAll(SELECTOR).forEach((img) => brandImage(img));
  }

  function initObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(SELECTOR)) {
            brandImage(node);
          } else if (node.querySelectorAll) {
            scan(node);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    scan();
    initObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

