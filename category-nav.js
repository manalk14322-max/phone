(() => {
  const categories = [
    {
      key: "BRAND",
      label: "BRAND",
      hint: "Apple, Samsung, Xiaomi, Oppo, Huawei, and more",
      href: "iphone.html?cat=FUNDAS",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M10 5.5h4"></path><path d="M10 18.5h4"></path></svg>',
    },
    {
      key: "CASES",
      label: "CASES",
      hint: "Silicone, matte, transparent, and MagSafe",
      href: "iphone.html?cat=FUNDAS",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h10l2 3v9H5V9Z"></path><path d="M9 6v10"></path><path d="M15 6v10"></path></svg>',
    },
    {
      key: "SCREEN_PROTECTORS",
      label: "SCREEN PROTECTORS",
      hint: "Tempered glass and camera safety",
      href: "iphone.html?cat=PROTECTORES_PHONE",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>',
    },
    {
      key: "CHARGERS",
      label: "CHARGERS",
      hint: "Fast and wireless charging",
      href: "iphone.html?cat=ACCESSORIES&sub=FAST_CHARGER",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="4" width="6" height="16" rx="2"></rect><path d="M11 2h2"></path><path d="M12 8v6"></path><path d="M9.5 11H12"></path><path d="M12 11h2.5"></path></svg>',
    },
    {
      key: "CABLES",
      label: "CABLE",
      hint: "Charging and data cables",
      href: "iphone.html?cat=ACCESSORIES&sub=CABLE",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h10"></path><path d="M8 6v5a4 4 0 1 0 8 0V6"></path><path d="M12 15v6"></path><path d="M9 21h6"></path></svg>',
    },
    {
      key: "AUDIO",
      label: "AUDIO",
      hint: "Earphones, headphones, and speakers",
      href: "iphone.html?cat=AUDIO",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a8 8 0 0 1 16 0"></path><path d="M6 14v4a2 2 0 0 0 2 2h1v-6H8a2 2 0 0 0-2 2Z"></path><path d="M18 14v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"></path></svg>',
    },
    {
      key: "WEARABLES",
      label: "SUPPORT",
      hint: "Smart watches, bands, and holders",
      href: "iphone.html?cat=SMART_WATCH",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="10" height="12" rx="2"></rect><path d="M9 2h6"></path><path d="M9 22h6"></path><path d="M12 9.5v3l2 1.5"></path></svg>',
    },
    {
      key: "COMPUTING",
      label: "COMPUTING",
      hint: "Tablets, cases, and desktop accessories",
      href: "iphone.html?cat=ACCESSORIES&sub=USB",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v10H4z"></path><path d="M9 20h6"></path><path d="M12 16v4"></path></svg>',
    },
    {
      key: "GADGETS",
      label: "GADGETS",
      hint: "Power banks and add-ons",
      href: "iphone.html?cat=POWER_BANK",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h10"></path><path d="M8 6v5a4 4 0 1 0 8 0V6"></path><path d="M12 15v6"></path><path d="M9 21h6"></path></svg>',
    },
    {
      key: "SIM",
      label: "SIM",
      hint: "Vodafone, Orange, Lebara, and eSIM",
      href: "iphone.html?cat=SIM",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h6l4 4v14H7z"></path><path d="M13 3v4h4"></path><path d="M9 12h6"></path><path d="M9 16h6"></path></svg>',
    },
    {
      key: "MEMORY_CARDS",
      label: "MEMORY CARDS",
      hint: "SD cards and USB drives",
      href: "iphone.html?cat=ACCESSORIES&sub=SD_CARD",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v14H7z"></path><path d="M10 9h4"></path><path d="M10 13h4"></path></svg>',
    },
  ];

  const brandCategories = [
    { key: "APPLE", label: "Apple", href: "iphone.html?cat=FUNDAS&sub=IPHONE" },
    { key: "SAMSUNG", label: "Samsung", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG" },
    { key: "XIAOMI", label: "Xiaomi", href: "iphone.html?cat=FUNDAS&sub=XIAOMI" },
    { key: "OPPO", label: "Oppo", href: "iphone.html?cat=FUNDAS&sub=OPPO" },
    { key: "HUAWEI", label: "Huawei", href: "iphone.html?cat=FUNDAS" },
    { key: "ALIVE", label: "Alive", href: "iphone.html?cat=FUNDAS" },
    { key: "LENOVO", label: "Lenovo", href: "iphone.html?cat=FUNDAS" },
    { key: "ZTE", label: "ZTE", href: "iphone.html?cat=FUNDAS" },
    { key: "TCL", label: "TCL", href: "iphone.html?cat=FUNDAS" },
    { key: "GOOGLE", label: "Google", href: "iphone.html?cat=FUNDAS&sub=GOOGLE" },
    { key: "ALCATEL", label: "Alcatel", href: "iphone.html?cat=FUNDAS" },
    { key: "ONEPLUS", label: "One Plus", href: "iphone.html?cat=FUNDAS" },
    { key: "MOTOROLA", label: "Motorola", href: "iphone.html?cat=FUNDAS" },
    { key: "WIKO", label: "Wiko", href: "iphone.html?cat=FUNDAS" },
  ];

  const caseStyleCategories = [
    {
      key: "SILICONE_CASES",
      label: "Silicone Cases",
      href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES",
      hint: "Soft-touch silicone and TPU",
      children: [
        { key: "SILICONE_ORIGINAL", label: "Silicone Original", href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES" },
        { key: "SILICONE_TPU", label: "Silicone TPU", href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES" },
        { key: "SILICONE_CORD", label: "Silicone with Cord", href: "iphone.html?cat=FUNDAS&sub=LANYARD_CASES" },
        { key: "CARBON_FIBER", label: "Carbon Fiber", href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES" },
        { key: "CAMERA_FRAME_TPU", label: "Camera Frame TPU", href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES" },
        { key: "PREMIUM", label: "Premium Silicone", href: "iphone.html?cat=FUNDAS&sub=SILICONE_CASES" },
      ],
    },
    {
      key: "MATTE_CASES",
      label: "Matte Cases",
      href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES",
      hint: "Matte looks and premium finishes",
      children: [
        { key: "MATTE_CAMERA", label: "Matte Camera", href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES" },
        { key: "MATTE_GSTYLE", label: "Matte Gstyle", href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES" },
        { key: "MATTE_JINDUN", label: "Matte JINDUN", href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES" },
        { key: "MATTE_YADUN", label: "Matte YADUN", href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES" },
        { key: "MATTE_BIJIAN", label: "Matte BIJIAN", href: "iphone.html?cat=FUNDAS&sub=MATTE_CASES" },
      ],
    },
    {
      key: "TRANSPARENT_CASES",
      label: "Transparent Cases",
      href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES",
      hint: "Clear protection with extra grip",
      children: [
        { key: "ANTI_DROP_CORD", label: "Anti-drop with Cord", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
        { key: "TPU_1_5", label: "TPU 1.5 mm", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
        { key: "ANTI_DROP", label: "Anti-drop", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
        { key: "ANTI_DROP_PREMIUM", label: "Anti-drop Premium", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
        { key: "DOUBLE_360", label: "360° Double", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
        { key: "TRANSPARENT_GSTYLE", label: "Transparent Gstyle", href: "iphone.html?cat=FUNDAS&sub=TRANSPARENT_CASES" },
      ],
    },
    {
      key: "MAGSAFE_CASES",
      label: "MagSafe Cases",
      href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES",
      hint: "MagSafe-friendly case styles",
      children: [
        { key: "ANTI_DROP_MAGSAFE", label: "Anti-drop with MagSafe", href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES" },
        { key: "SILICONE_MAGSAFE", label: "Silicone with MagSafe", href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES" },
        { key: "TRANSPARENT_MAGSAFE", label: "Transparent MagSafe", href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES" },
        { key: "RING_MAGSAFE", label: "MagSafe Ring", href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES" },
        { key: "SUPPORT_CAMERA", label: "MagSafe with Camera Support", href: "iphone.html?cat=FUNDAS&sub=MAGSAFE_CASES" },
      ],
    },
    { key: "SUPPORT_CASES", label: "Support Cases", href: "iphone.html?cat=FUNDAS&sub=SUPPORT_CASES", hint: "Ring and stand cases", children: [
        { key: "MATTE_RING", label: "Matte with Ring", href: "iphone.html?cat=FUNDAS&sub=SUPPORT_CASES" },
        { key: "ARMOR_RING", label: "Armor with Ring", href: "iphone.html?cat=FUNDAS&sub=SUPPORT_CASES" },
        { key: "FLIP_RING", label: "Flip with Ring", href: "iphone.html?cat=FUNDAS&sub=SUPPORT_CASES" },
    ]},
    { key: "LANYARD_CASES", label: "Lanyard Cases", href: "iphone.html?cat=FUNDAS&sub=LANYARD_CASES", hint: "Cases with cords and straps", children: [
        { key: "SILICONE_CORD", label: "Silicone with Cord", href: "iphone.html?cat=FUNDAS&sub=LANYARD_CASES" },
        { key: "TRANSPARENT_CORD", label: "Transparent with Cord", href: "iphone.html?cat=FUNDAS&sub=LANYARD_CASES" },
        { key: "GLITTER_CORD", label: "Glitter with Cord", href: "iphone.html?cat=FUNDAS&sub=LANYARD_CASES" },
    ]},
    { key: "FLIP_CASES", label: "Flip Cases", href: "iphone.html?cat=FUNDAS&sub=FLIP_CASES", hint: "Book and wallet styles", children: [
        { key: "BOOK_WINDOW", label: "Book Case with Window", href: "iphone.html?cat=FUNDAS&sub=FLIP_CASES" },
        { key: "LEATHER_BOOK", label: "Leather Book Case", href: "iphone.html?cat=FUNDAS&sub=FLIP_CASES" },
    ]},
    { key: "PATTERN_CASES", label: "Pattern Cases", href: "iphone.html?cat=FUNDAS&sub=PATTERN_CASES", hint: "Glitter, laser, and design cases", children: [
        { key: "DIAMOND_SHINE", label: "Diamond Shine", href: "iphone.html?cat=FUNDAS&sub=PATTERN_CASES" },
        { key: "GLITTER", label: "Glitter", href: "iphone.html?cat=FUNDAS&sub=PATTERN_CASES" },
        { key: "GLITTER_CHROME", label: "Glitter and Chrome", href: "iphone.html?cat=FUNDAS&sub=PATTERN_CASES" },
        { key: "LASER", label: "Laser", href: "iphone.html?cat=FUNDAS&sub=PATTERN_CASES" },
    ]},
    { key: "TABLET_PORTABLE_CASES", label: "Tablet / Laptop Cases", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "Portable devices and tablets", children: [
        { key: "TABLET", label: "Tablet", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES" },
        { key: "LAPTOP", label: "Laptop", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES" },
    ]},
  ];

  const drawerColumns = {
    BRAND: brandCategories,
    CASES: caseStyleCategories,
    SCREEN_PROTECTORS: [
      {
        key: "PROTECTORES_PHONE",
        label: "Phone Protectors",
        href: "iphone.html?cat=PROTECTORES_PHONE",
        hint: "Tempered glass and screen shields",
        children: [
          { key: "TEMPERED_GLASS", label: "Tempered Glass", href: "iphone.html?cat=PROTECTORES_PHONE" },
          { key: "PRIVACY_GLASS", label: "Privacy Glass", href: "iphone.html?cat=PROTECTORES_PHONE" },
          { key: "ANTI_SHOCK", label: "Anti-shock Glass", href: "iphone.html?cat=PROTECTORES_PHONE" },
        ],
      },
      {
        key: "PROTECTORES_CAMERA",
        label: "Camera Protectors",
        href: "iphone.html?cat=PROTECTORES_CAMERA",
        hint: "Lens glass and camera safety",
        children: [
          { key: "LENS_GLASS", label: "Lens Glass", href: "iphone.html?cat=PROTECTORES_CAMERA" },
          { key: "CAMERA_SHIELD", label: "Camera Shield", href: "iphone.html?cat=PROTECTORES_CAMERA" },
          { key: "LENS_COVER", label: "Lens Cover", href: "iphone.html?cat=PROTECTORES_CAMERA" },
        ],
      },
    ],
    CHARGERS: [
      {
        key: "FAST_CHARGER",
        label: "Fast Charger",
        href: "iphone.html?cat=ACCESSORIES&sub=FAST_CHARGER",
        hint: "USB-C and GaN charging",
        children: [
          { key: "USB_C", label: "USB-C Fast Charger", href: "iphone.html?cat=ACCESSORIES&sub=FAST_CHARGER" },
          { key: "GAN", label: "GaN Charger", href: "iphone.html?cat=ACCESSORIES&sub=FAST_CHARGER" },
          { key: "DUAL", label: "Dual Port Charger", href: "iphone.html?cat=ACCESSORIES&sub=FAST_CHARGER" },
        ],
      },
      {
        key: "ADAPTER",
        label: "Travel Adapter",
        href: "iphone.html?cat=ACCESSORIES&sub=ADAPTER",
        hint: "Travel-friendly adapters",
        children: [
          { key: "EU", label: "EU Adapter", href: "iphone.html?cat=ACCESSORIES&sub=ADAPTER" },
          { key: "UK", label: "UK Adapter", href: "iphone.html?cat=ACCESSORIES&sub=ADAPTER" },
          { key: "UNIVERSAL", label: "Universal Adapter", href: "iphone.html?cat=ACCESSORIES&sub=ADAPTER" },
        ],
      },
    ],
    CABLES: [
      {
        key: "CABLE",
        label: "Cable",
        href: "iphone.html?cat=ACCESSORIES&sub=CABLE",
        hint: "Charging and data cables",
        children: [
          { key: "USB_C_CABLE", label: "USB-C Cable", href: "iphone.html?cat=ACCESSORIES&sub=CABLE" },
          { key: "LIGHTNING_CABLE", label: "Lightning Cable", href: "iphone.html?cat=ACCESSORIES&sub=CABLE" },
          { key: "MICRO_USB", label: "Micro USB", href: "iphone.html?cat=ACCESSORIES&sub=CABLE" },
        ],
      },
      {
        key: "USB",
        label: "USB Flash Drive",
        href: "iphone.html?cat=ACCESSORIES&sub=USB",
        hint: "Portable storage",
        children: [
          { key: "USB_32", label: "USB 32 GB", href: "iphone.html?cat=ACCESSORIES&sub=USB" },
          { key: "USB_64", label: "USB 64 GB", href: "iphone.html?cat=ACCESSORIES&sub=USB" },
        ],
      },
    ],
    AUDIO: [
      {
        key: "WIRELESS_EARPHONES",
        label: "Wireless Earphones",
        href: "iphone.html?cat=AUDIO",
        hint: "Bluetooth earbuds",
        children: [
          { key: "BT_EARBUDS", label: "Bluetooth Earbuds", href: "iphone.html?cat=AUDIO" },
          { key: "TWS", label: "TWS Earbuds", href: "iphone.html?cat=AUDIO" },
        ],
      },
      {
        key: "EARPHONE",
        label: "Earphones",
        href: "iphone.html?cat=AUDIO",
        hint: "Wired earphones",
        children: [
          { key: "WIRED", label: "Wired Earphones", href: "iphone.html?cat=AUDIO" },
          { key: "HEADSET", label: "Headset", href: "iphone.html?cat=AUDIO" },
        ],
      },
      {
        key: "SPEAKERS",
        label: "Wireless Speakers",
        href: "iphone.html?cat=AUDIO",
        hint: "Portable speakers",
        children: [
          { key: "PORTABLE", label: "Portable Speaker", href: "iphone.html?cat=AUDIO" },
          { key: "MINI", label: "Mini Speaker", href: "iphone.html?cat=AUDIO" },
        ],
      },
    ],
    WEARABLES: [
      {
        key: "SMART_WATCH",
        label: "Smart Watch",
        href: "iphone.html?cat=SMART_WATCH",
        hint: "Watches, bands, and cases",
        children: [
          { key: "WATCH", label: "Smart Watch", href: "iphone.html?cat=SMART_WATCH" },
          { key: "BAND", label: "Watch Band", href: "iphone.html?cat=SMART_WATCH" },
          { key: "CASE", label: "Protective Case", href: "iphone.html?cat=SMART_WATCH" },
        ],
      },
      {
        key: "XM_BAND",
        label: "XM Band",
        href: "iphone.html?cat=SMART_WATCH",
        hint: "Bands and straps",
        children: [
          { key: "BAND_1", label: "XM Band", href: "iphone.html?cat=SMART_WATCH" },
          { key: "BAND_2", label: "Silicone Band", href: "iphone.html?cat=SMART_WATCH" },
        ],
      },
    ],
    COMPUTING: [
      {
        key: "TABLET",
        label: "Tablet",
        href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES",
        hint: "Tablet covers and accessories",
        children: [
          { key: "TABLET_CASES", label: "Tablet Cases", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES" },
          { key: "TABLET_STAND", label: "Tablet Stand", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
        ],
      },
      {
        key: "LAPTOP",
        label: "Laptop",
        href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES",
        hint: "Laptop covers and sleeves",
        children: [
          { key: "SLEEVES", label: "Laptop Sleeves", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES" },
          { key: "LAPTOP_CASES", label: "Laptop Cases", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES" },
        ],
      },
    ],
    GADGETS: [
      {
        key: "POWER_BANK",
        label: "Power Banks",
        href: "iphone.html?cat=POWER_BANK",
        hint: "Magnetic and standard power banks",
        children: [
          { key: "MAGNETIC", label: "Magnetic Wireless", href: "iphone.html?cat=POWER_BANK" },
          { key: "STANDARD", label: "Power Bank", href: "iphone.html?cat=POWER_BANK" },
        ],
      },
      {
        key: "MOBILE_ACCESSORIES",
        label: "Mobile Accessories",
        href: "iphone.html?cat=MOBILE_ACCESSORIES",
        hint: "Phone holders and add-ons",
        children: [
          { key: "CORDON", label: "Cordon", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
          { key: "MAGNETIC_CARD", label: "Magnetic Card", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
          { key: "SOPORTE", label: "Phone Holder", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
          { key: "AIRPODS_CASE", label: "AirPods Case", href: "iphone.html?cat=MOBILE_ACCESSORIES" },
        ],
      },
      {
        key: "OFFERS",
        label: "Offers",
        href: "oferta.html",
        hint: "Sale picks and bundle deals",
        children: [
          { key: "FEATURED", label: "Sale Picks", href: "oferta.html" },
          { key: "BUNDLES", label: "Bundle Deals", href: "oferta.html?page=2" },
          { key: "NEW", label: "New Arrivals", href: "oferta.html?page=3" },
        ],
      },
    ],
    MEMORY_CARDS: [
      {
        key: "SD_CARD",
        label: "SD Cards",
        href: "iphone.html?cat=ACCESSORIES&sub=SD_CARD",
        hint: "Memory cards",
        children: [
          { key: "SD_32", label: "SD 32 GB", href: "iphone.html?cat=ACCESSORIES&sub=SD_CARD" },
          { key: "SD_64", label: "SD 64 GB", href: "iphone.html?cat=ACCESSORIES&sub=SD_CARD" },
        ],
      },
      {
        key: "USB",
        label: "USB Flash Drives",
        href: "iphone.html?cat=ACCESSORIES&sub=USB",
        hint: "Portable storage",
        children: [
          { key: "USB_32", label: "USB 32 GB", href: "iphone.html?cat=ACCESSORIES&sub=USB" },
          { key: "USB_64", label: "USB 64 GB", href: "iphone.html?cat=ACCESSORIES&sub=USB" },
        ],
      },
    ],
    SIM: [
      { key: "VODAFONE", label: "Vodafone", href: "iphone.html?cat=SIM&sub=VODAFONE", hint: "SIM and eSIM plans", children: [{ key: "SIM", label: "SIM", href: "iphone.html?cat=SIM&sub=VODAFONE" }, { key: "ESIM", label: "eSIM", href: "iphone.html?cat=SIM&sub=E_VODAFONE" }] },
      { key: "ORANGE", label: "Orange", href: "iphone.html?cat=SIM&sub=ORANGE", hint: "SIM and eSIM plans", children: [{ key: "SIM", label: "SIM", href: "iphone.html?cat=SIM&sub=ORANGE" }, { key: "ESIM", label: "eSIM", href: "iphone.html?cat=SIM&sub=E_ORANGE" }] },
      { key: "LEBARA", label: "Lebara", href: "iphone.html?cat=SIM&sub=LEBARA", hint: "SIM and eSIM plans", children: [{ key: "SIM", label: "SIM", href: "iphone.html?cat=SIM&sub=LEBARA" }, { key: "ESIM", label: "eSIM", href: "iphone.html?cat=SIM&sub=E_LEBARA" }] },
      { key: "LLAMAYA", label: "Llamaya", href: "iphone.html?cat=SIM&sub=LLAMAYA", hint: "SIM and eSIM plans", children: [{ key: "SIM", label: "SIM", href: "iphone.html?cat=SIM&sub=LLAMAYA" }, { key: "ESIM", label: "eSIM", href: "iphone.html?cat=SIM&sub=E_LLAMAYA" }] },
      { key: "MOVISTAR", label: "Movistar", href: "iphone.html?cat=SIM&sub=MOVISTAR", hint: "SIM and eSIM plans", children: [{ key: "SIM", label: "SIM", href: "iphone.html?cat=SIM&sub=MOVISTAR" }, { key: "ESIM", label: "eSIM", href: "iphone.html?cat=SIM&sub=MOVISTAR" }] },
    ],
    OFFERS: [
      { key: "FEATURED", label: "Sale Picks", href: "oferta.html", hint: "Featured offers", children: [{ key: "TOP_DEALS", label: "Top Deals", href: "oferta.html" }, { key: "CLEARANCE", label: "Clearance", href: "oferta.html?page=2" }] },
      { key: "BUNDLES", label: "Bundle Deals", href: "oferta.html?page=2", hint: "Value packs", children: [{ key: "VALUE_PACK", label: "Value Pack", href: "oferta.html?page=2" }, { key: "BUY_MORE", label: "Buy More Save More", href: "oferta.html?page=3" }] },
      { key: "NEW", label: "New Arrivals", href: "oferta.html?page=3", hint: "Fresh products", children: [{ key: "LATEST", label: "Latest", href: "oferta.html?page=3" }, { key: "TRENDING", label: "Trending", href: "oferta.html?page=3" }] },
    ],
  };

  const drawerDetails = {
    APPLE: [
      { key: "IPHONE", label: "iPhone", href: "iphone.html?cat=FUNDAS&sub=IPHONE", hint: "Cases for iPhone models" },
      { key: "IPAD", label: "iPad", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "Tablet cases and covers" },
      { key: "APPLE_WATCH", label: "Apple Watch", href: "iphone.html?cat=SMART_WATCH", hint: "Watch bands and covers" },
      { key: "AIRPODS", label: "AirPods", href: "iphone.html?cat=AUDIO", hint: "Audio and protection" },
    ],
    SAMSUNG: [
      { key: "SERIES_S", label: "Series S", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG", hint: "Galaxy S covers" },
      { key: "SERIES_A", label: "Series A", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG", hint: "Galaxy A covers" },
      { key: "FOLD_FLIP", label: "Fold / Flip", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG", hint: "Foldable covers" },
      { key: "NOTE_SERIES", label: "Note Series", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG", hint: "Note models" },
      { key: "OTHER", label: "Other", href: "iphone.html?cat=FUNDAS&sub=SAMSUNG", hint: "Legacy Samsung models" },
      { key: "TAB_SERIES", label: "Tab Series", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "Samsung tablets" },
    ],
    XIAOMI: [
      { key: "MI_SERIES", label: "Mi Series", href: "iphone.html?cat=FUNDAS&sub=XIAOMI", hint: "Mi flagship covers" },
      { key: "MI_NOTE", label: "Mi Note", href: "iphone.html?cat=FUNDAS&sub=XIAOMI", hint: "Mi Note covers" },
      { key: "REDMI", label: "Redmi", href: "iphone.html?cat=FUNDAS&sub=REDMI", hint: "Redmi covers" },
      { key: "REDMI_NOTE", label: "Redmi Note", href: "iphone.html?cat=FUNDAS&sub=REDMI", hint: "Redmi Note covers" },
      { key: "POCOPHONE", label: "Pocophone", href: "iphone.html?cat=FUNDAS&sub=XIAOMI", hint: "Poco phone covers" },
      { key: "TABLET", label: "Tablet", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "Xiaomi tablets" },
    ],
    OPPO: [
      { key: "RENO", label: "Reno Series", href: "iphone.html?cat=FUNDAS&sub=OPPO", hint: "Reno covers" },
      { key: "A_SERIES", label: "A Series", href: "iphone.html?cat=FUNDAS&sub=OPPO", hint: "A series covers" },
      { key: "F_SERIES", label: "F Series", href: "iphone.html?cat=FUNDAS&sub=OPPO", hint: "F series covers" },
      { key: "FIND", label: "Find Series", href: "iphone.html?cat=FUNDAS&sub=OPPO", hint: "Find series covers" },
    ],
    HUAWEI: [
      { key: "P_SERIES", label: "P Series", href: "iphone.html?cat=FUNDAS&sub=HUAWEI", hint: "Huawei P covers" },
      { key: "MATE_SERIES", label: "Mate Series", href: "iphone.html?cat=FUNDAS&sub=HUAWEI", hint: "Huawei Mate covers" },
      { key: "NOVA_SERIES", label: "Nova Series", href: "iphone.html?cat=FUNDAS&sub=HUAWEI", hint: "Huawei Nova covers" },
    ],
    ALIVE: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=ALIVE", hint: "Budget phone covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
    LENOVO: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=LENOVO", hint: "Lenovo phone covers" },
      { key: "TABLETS", label: "Tablet Covers", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "Tablet covers" },
    ],
    ZTE: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=ZTE", hint: "ZTE phone covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
    TCL: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=TCL", hint: "TCL phone covers" },
      { key: "TABLETS", label: "Tablet Covers", href: "iphone.html?cat=FUNDAS&sub=TABLET_PORTABLE_CASES", hint: "TCL tablets" },
    ],
    GOOGLE: [
      { key: "PIXEL", label: "Pixel", href: "iphone.html?cat=FUNDAS&sub=GOOGLE", hint: "Pixel covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Phone add-ons" },
    ],
    ALCATEL: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=ALCATEL", hint: "Alcatel covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
    ONEPLUS: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=ONEPLUS", hint: "One Plus covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
    MOTOROLA: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=MOTOROLA", hint: "Motorola covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
    WIKO: [
      { key: "PHONES", label: "Phone Covers", href: "iphone.html?cat=FUNDAS&sub=WIKO", hint: "Wiko covers" },
      { key: "ACCESSORIES", label: "Accessories", href: "iphone.html?cat=MOBILE_ACCESSORIES", hint: "Useful add-ons" },
    ],
  };

  function currentKey() {
    const params = new URLSearchParams(window.location.search);
    const raw = String(params.get("cat") || "").toUpperCase();
    const sub = String(params.get("sub") || "").toUpperCase();
    const aliases = {
      OFFERS: "OFFERS",
      OFERTA: "OFFERS",
      "CABLES_AND_CHARGERS": "CABLES",
      "PROTECTORES_PANTALLA": "PROTECTORES_PHONE",
      "PROTECTORES CAMERA": "PROTECTORES_CAMERA",
    };
    const cat = aliases[raw] || raw;
    if (cat === "SIM") return "SIM";
    if (cat === "PROTECTORES_PHONE" || cat === "PROTECTORES_CAMERA") return "SCREEN_PROTECTORS";
    if (cat === "POWER_BANK" || cat === "MOBILE_ACCESSORIES") return "GADGETS";
    if (cat === "AUDIO") return "AUDIO";
    if (cat === "SMART_WATCH") return "WEARABLES";
    if (cat === "ACCESSORIES") {
      if (/^(FAST_CHARGER|ADAPTER)$/i.test(sub)) return "CHARGERS";
      if (/^CABLE$/i.test(sub)) return "CABLES";
      if (/^(SD_CARD|USB)$/i.test(sub)) return "MEMORY_CARDS";
      return "COMPUTING";
    }
    if (cat === "OFERTA" || cat === "OFFERS") return "GADGETS";
    if (cat === "FUNDAS") {
      if (/^(SILICONE_CASES|MATTE_CASES|TRANSPARENT_CASES|MAGSAFE_CASES|SUPPORT_CASES|LANYARD_CASES|FLIP_CASES|PATTERN_CASES|TABLET_PORTABLE_CASES)$/i.test(sub)) {
        return "CASES";
      }
      return "BRAND";
    }
    if (cat === "BRAND" || cat === "CASES" || cat === "SCREEN_PROTECTORS" || cat === "CHARGERS" || cat === "CABLES" || cat === "AUDIO" || cat === "WEARABLES" || cat === "COMPUTING" || cat === "GADGETS" || cat === "MEMORY_CARDS" || cat === "OFFERS") {
      return cat;
    }

    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("/oferta.html") || path.endsWith("\\oferta.html")) return "GADGETS";
    return "BRAND";
  }

  function currentSubKey() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("sub") || "").toUpperCase();
  }

  function resolveDrawerState(rootKey, subKey) {
    const root = drawerColumns[rootKey] ? rootKey : "BRAND";
    const items = drawerColumns[root] || drawerColumns.BRAND;
    const sub = String(subKey || "").toUpperCase();
    const rawCat = String(new URLSearchParams(window.location.search).get("cat") || "").toUpperCase();
    const path = window.location.pathname.toLowerCase();
    let active = items[0]?.key || "";

    if (root === "BRAND") {
      active = brandKeyFromSub(sub) || active;
      if (!items.some((item) => item.key === active)) {
        active = items[0]?.key || "";
      }
      return { root, active };
    }

    if (root === "SIM") {
      active = simBrandKeyFromSub(sub) || active;
      if (!items.some((item) => item.key === active)) {
        active = items[0]?.key || "";
      }
      return { root, active };
    }

    if (root === "GADGETS") {
      if (rawCat === "SIM") {
        active = "SIM";
      } else if (rawCat === "OFERTA" || rawCat === "OFFERS") {
        active = "OFFERS";
      } else if (path.endsWith("/oferta.html") || path.endsWith("\\oferta.html")) {
        active = "OFFERS";
      }
    }

    const exact = items.find((item) => item.key === sub);
    if (exact) active = exact.key;
    return { root, active };
  }

  function renderDrawerRows(items, activeKey, rootKey, kind, showHint = false) {
    return (items || [])
      .map((entry) => {
        const hint = showHint && entry.hint ? `<small>${esc(entry.hint)}</small>` : "";
        return `
          <a class="category-drawer-mega-item${entry.key === activeKey ? " active" : ""}" href="${esc(entry.href)}" data-drawer-root="${esc(rootKey)}" data-drawer-child="${esc(entry.key)}">
            <span class="category-drawer-mega-copy">
              <strong>${esc(entry.label)}</strong>
              ${hint}
            </span>
            <span class="category-drawer-mega-arrow" aria-hidden="true">&#8250;</span>
          </a>
        `;
      })
      .join("");
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function brandKeyFromSub(sub) {
    const value = String(sub || "").toUpperCase();
    if (/^IPHONE(?:_|$)/i.test(value)) return "APPLE";
    if (/^IPAD(?:_|$)/i.test(value) || /^APPLE_WATCH(?:_|$)/i.test(value) || /^AIRPODS(?:_|$)/i.test(value)) return "APPLE";
    if (/^SAMSUNG(?:_|$)/i.test(value)) return "SAMSUNG";
    if (/^(REDMI|XIAOMI|POCO|POCOPHONE)(?:_|$)/i.test(value)) return "XIAOMI";
    if (/^OPPO(?:_|$)/i.test(value)) return "OPPO";
    if (/^HUAWEI(?:_|$)/i.test(value)) return "HUAWEI";
    if (/^ALIVE(?:_|$)/i.test(value)) return "ALIVE";
    if (/^LENOVO(?:_|$)/i.test(value)) return "LENOVO";
    if (/^ZTE(?:_|$)/i.test(value)) return "ZTE";
    if (/^TCL(?:_|$)/i.test(value)) return "TCL";
    if (/^GOOGLE(?:_|$)/i.test(value)) return "GOOGLE";
    if (/^ALCATEL(?:_|$)/i.test(value)) return "ALCATEL";
    if (/^ONE\s?PLUS(?:_|$)/i.test(value) || /^ONEPLUS(?:_|$)/i.test(value)) return "ONEPLUS";
    if (/^MOTOROLA(?:_|$)/i.test(value)) return "MOTOROLA";
    if (/^WIKO(?:_|$)/i.test(value)) return "WIKO";
    return "";
  }

  function simBrandKeyFromSub(sub) {
    const value = String(sub || "").toUpperCase();
    if (/^E_?VODAFONE$/.test(value) || /^VODAFONE(?:_|$)/.test(value)) return "VODAFONE";
    if (/^E_?ORANGE$/.test(value) || /^ORANGE(?:_|$)/.test(value)) return "ORANGE";
    if (/^E_?LEBARA$/.test(value) || /^LEBARA(?:_|$)/.test(value)) return "LEBARA";
    if (/^E_?LLAMAYA$/.test(value) || /^LLAMAYA(?:_|$)/.test(value)) return "LLAMAYA";
    if (/^E_?MOVISTAR$/.test(value) || /^MOVISTAR(?:_|$)/.test(value)) return "MOVISTAR";
    return "";
  }

  function render() {
    if (document.getElementById("category-drawer-widget")) return;

    const widget = document.createElement("div");
    widget.id = "category-drawer-widget";
    widget.innerHTML = `
      <button class="category-drawer-mobile-btn" id="category-drawer-mobile-btn" type="button" aria-label="Open category menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16"></path>
          <path d="M4 12h16"></path>
          <path d="M4 17h16"></path>
        </svg>
      </button>
      <div class="category-drawer-overlay" id="category-drawer-overlay" hidden></div>
      <aside class="category-drawer-shell" id="category-drawer-shell" aria-hidden="true">
        <div class="category-drawer-rail">
          <button class="category-drawer-toggle" id="category-drawer-toggle" type="button" aria-label="Open category menu" aria-expanded="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 17h16"></path>
            </svg>
          </button>
          ${categories
            .map(
              (item) => `
                <a class="category-drawer-icon-link" href="${esc(item.href)}" data-category-key="${item.key}" data-root-key="${item.key}" aria-label="${item.label}">
                  ${item.icon}
                </a>`
            )
            .join("")}
        </div>
        <div class="category-drawer-panel" id="category-drawer-panel">
          <div class="category-drawer-head">
            <div>
              <p>Quick Navigation</p>
              <strong>All Categories</strong>
            </div>
            <button class="category-drawer-close" id="category-drawer-close" type="button" aria-label="Close category menu">x</button>
          </div>
          <nav class="category-drawer-list" aria-label="Category links">
            ${categories
              .map(
                (item) => `
                  <a class="category-drawer-item" href="${esc(item.href)}" data-category-key="${item.key}" data-root-key="${item.key}">
                    <span class="category-drawer-item-icon">${item.icon}</span>
                    <span class="category-drawer-copy">
                      <strong>${item.label}</strong>
                    </span>
                    <span class="category-drawer-arrow" aria-hidden="true">&#8250;</span>
                  </a>`
              )
              .join("")}
          </nav>
          <section class="category-drawer-brand-section" aria-labelledby="category-drawer-middle-title">
            <div class="category-drawer-brand-head">
              <div>
                <strong id="category-drawer-middle-title">Phone Brands</strong>
                <small id="category-drawer-middle-hint">Quick filters for phone brands</small>
              </div>
            </div>
            <div class="category-drawer-mega-list" id="category-drawer-middle-list"></div>
          </section>
          <section class="category-drawer-group" aria-labelledby="category-drawer-detail-title">
            <div class="category-drawer-group-head">
              <strong id="category-drawer-detail-title">Sections</strong>
              <small id="category-drawer-detail-hint">Pick an item to explore</small>
            </div>
            <div class="category-drawer-mega-list" id="category-drawer-detail-list"></div>
          </section>
        </div>
      </aside>
    `;

    document.body.appendChild(widget);

    const body = document.body;
    const footer = document.querySelector(".footer, .site-footer, footer");
    const shell = document.getElementById("category-drawer-shell");
    const overlay = document.getElementById("category-drawer-overlay");
    const toggle = document.getElementById("category-drawer-toggle");
    const mobileToggle = document.getElementById("category-drawer-mobile-btn");
    const closeBtn = document.getElementById("category-drawer-close");
    const middleTitle = document.getElementById("category-drawer-middle-title");
    const middleHint = document.getElementById("category-drawer-middle-hint");
    const middleList = document.getElementById("category-drawer-middle-list");
    const detailTitle = document.getElementById("category-drawer-detail-title");
    const detailHint = document.getElementById("category-drawer-detail-hint");
    const detailList = document.getElementById("category-drawer-detail-list");

    const state = resolveDrawerState(currentKey(), currentSubKey());

    function renderColumns() {
      const rootKey = state.root;
      const items = drawerColumns[rootKey] || drawerColumns.BRAND;
      const activeItem = items.find((entry) => entry.key === state.active) || items[0];
      const detailItems = drawerDetails[activeItem?.key] || activeItem?.children || [];

      middleTitle.textContent = rootKey === "BRAND" ? "Phone Brands" : rootKey === "CASES" ? "Case Styles" : categories.find((entry) => entry.key === rootKey)?.label || "Sections";
      middleHint.textContent = rootKey === "BRAND"
        ? "Apple, Samsung, Xiaomi, Oppo, Huawei, and more"
        : rootKey === "CASES"
          ? "Silicone, matte, transparent, MagSafe, and more"
          : categories.find((entry) => entry.key === rootKey)?.hint || "";

      middleList.innerHTML = renderDrawerRows(items, activeItem?.key || "", rootKey, "middle", false);

      detailTitle.textContent = activeItem?.label || "Sections";
      detailHint.textContent = activeItem?.hint || categories.find((entry) => entry.key === rootKey)?.hint || "Pick an item to explore";
      detailList.innerHTML = detailItems.length
        ? renderDrawerRows(detailItems, "", rootKey, "detail", false)
        : `<div class="category-drawer-empty"><strong>${esc(activeItem?.label || "Sections")}</strong><small>${esc(
            activeItem?.hint || "No additional sections available."
          )}</small></div>`;

      widget.querySelectorAll("[data-category-key]").forEach((node) => {
        node.classList.toggle("active", node.getAttribute("data-category-key") === rootKey);
      });
    }

    renderColumns();

    function setOpen(open, syncFromUrl = true) {
      if (open) {
        if (syncFromUrl) {
          const current = resolveDrawerState(currentKey(), currentSubKey());
          state.root = current.root;
          state.active = current.active;
        }
        renderColumns();
      }
      shell.classList.toggle("open", open);
      shell.setAttribute("aria-hidden", open ? "false" : "true");
      overlay.hidden = !open;
      body.classList.toggle("category-drawer-open", open);
      toggle?.setAttribute("aria-expanded", open ? "true" : "false");
      mobileToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function selectRoot(rootKey, shouldOpen = true) {
      if (!rootKey) return;
      state.root = rootKey;
      state.active = (drawerColumns[rootKey] || drawerColumns.BRAND)[0]?.key || "";
      renderColumns();
      if (shouldOpen) setOpen(true, false);
    }

    let lastPointerToggleAt = 0;

    function toggleDrawer(forceOpen = null) {
      const shouldOpen = forceOpen === null ? !shell.classList.contains("open") : Boolean(forceOpen);
      setOpen(shouldOpen, false);
    }

    const bindToggle = (button) => {
      if (!button) return;
      const handlePointerToggle = (event) => {
        event.preventDefault();
        event.stopPropagation();
        lastPointerToggleAt = Date.now();
        toggleDrawer();
      };
      const handleClickToggle = (event) => {
        if (Date.now() - lastPointerToggleAt < 700) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        toggleDrawer();
      };
      button.addEventListener("pointerdown", handlePointerToggle);
      button.addEventListener("click", handleClickToggle);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          toggleDrawer();
        }
      });
    };

    bindToggle(toggle);
    bindToggle(mobileToggle);

    closeBtn?.addEventListener("click", () => setOpen(false));
    overlay?.addEventListener("click", () => setOpen(false));

    const setFooterHidden = (hidden) => {
      widget.classList.toggle("category-drawer-footer-hidden", hidden);
      if (hidden) setOpen(false, false);
    };

    if (footer) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const enteringFooter = Boolean(entry?.isIntersecting);
          setFooterHidden(enteringFooter);
        },
        {
          root: null,
          threshold: 0,
          rootMargin: "0px 0px -140px 0px",
        }
      );
      observer.observe(footer);
    }

    const navigateTo = (element) => {
      const href = element?.getAttribute("href") || "";
      if (href) window.location.href = href;
    };

    widget.addEventListener("click", (event) => {
      const railLink = event.target.closest(".category-drawer-icon-link");
      if (railLink && widget.contains(railLink)) {
        event.preventDefault();
        selectRoot(railLink.getAttribute("data-root-key") || "", true);
        navigateTo(railLink);
        return;
      }

      const rootLink = event.target.closest(".category-drawer-item");
      if (rootLink && widget.contains(rootLink) && rootLink.closest(".category-drawer-list")) {
        event.preventDefault();
        selectRoot(rootLink.getAttribute("data-root-key") || "", true);
        navigateTo(rootLink);
        return;
      }

      const middleLink = event.target.closest(".category-drawer-mega-item");
      if (middleLink && widget.contains(middleLink) && middleLink.closest(".category-drawer-brand-section")) {
        event.preventDefault();
        const childKey = middleLink.getAttribute("data-drawer-child") || "";
        if (childKey && childKey !== state.active) {
          state.active = childKey;
          renderColumns();
        }
        navigateTo(middleLink);
      }
    });

    widget.addEventListener("mouseover", (event) => {
      const rootLink = event.target.closest("[data-root-key]");
      if (rootLink && widget.contains(rootLink)) {
        const rootKey = rootLink.getAttribute("data-root-key") || "";
        if (rootKey) {
          selectRoot(rootKey, true);
        }
        return;
      }

      const childLink = event.target.closest("[data-drawer-child]");
      if (childLink && widget.contains(childLink) && childLink.closest(".category-drawer-brand-section")) {
        const childKey = childLink.getAttribute("data-drawer-child") || "";
        if (childKey && childKey !== state.active) {
          state.active = childKey;
          renderColumns();
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
