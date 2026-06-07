const products = reviewData.products;
const reviews = reviewData.reviews;
const articles = reviewData.articles;
const externalReviews = reviewData.externalReviews || {};
const recommendations = reviewData.recommendations || [];

const productById = (id) => products.find((product) => product.id === id);
const articleById = (id) => articles.find((article) => article.id === id);
const reviewById = (id) => reviews.find((review) => review.id === id);
const twoDigit = (value) => (value < 10 ? `0${value}` : `${value}`);
const currencyRates = {
  USD: { label: "USD", symbol: "$", rate: 1, locale: "en-US" },
  PHP: { label: "PHP", symbol: "₱", rate: 61.8, locale: "en-PH" },
  EUR: { label: "EUR", symbol: "€", rate: 0.8678, locale: "de-DE" },
  GBP: { label: "GBP", symbol: "£", rate: 0.74, locale: "en-GB" },
  JPY: { label: "JPY", symbol: "¥", rate: 145, locale: "ja-JP" },
  AUD: { label: "AUD", symbol: "A$", rate: 1.52, locale: "en-AU" },
  CAD: { label: "CAD", symbol: "C$", rate: 1.37, locale: "en-CA" },
  SGD: { label: "SGD", symbol: "S$", rate: 1.3, locale: "en-SG" }
};
let activeCurrency = "USD";

try {
  activeCurrency = localStorage.getItem("reviewhubCurrency") || "USD";
} catch (error) {
  activeCurrency = "USD";
}

const communityStoreKey = "reviewhubCommunityDB";
let communityDB = readCommunityDB();

function readCommunityDB() {
  const fallback = { users: [], currentUserId: null, comments: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(communityStoreKey));
    return {
      users: Array.isArray(saved && saved.users) ? saved.users : [],
      currentUserId: saved && saved.currentUserId ? saved.currentUserId : null,
      comments: Array.isArray(saved && saved.comments) ? saved.comments : []
    };
  } catch (error) {
    return fallback;
  }
}

function saveCommunityDB() {
  try {
    localStorage.setItem(communityStoreKey, JSON.stringify(communityDB));
  } catch (error) {}
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function makeId(prefix) {
  if (window.crypto && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentUser() {
  return communityDB.users.find((user) => user.id === communityDB.currentUserId) || null;
}

function productBrand(product) {
  if (product.brand) return product.brand;
  const knownBrands = ["Samsung", "Apple", "Google", "OnePlus", "Xiaomi", "OPPO", "vivo", "Honor", "Motorola", "Huawei", "Sony", "ASUS", "Lenovo", "Nokia", "Nothing", "Realme", "Tecno", "Infinix", "ZTE", "Redmi", "Poco", "Meizu", "TCL", "Alcatel", "HTC", "LG"];
  const match = knownBrands.find((brand) => product.name.toLowerCase().startsWith(brand.toLowerCase()));
  return match || product.name.split(" ")[0];
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function usdValue(price) {
  if (typeof price === "number") return price;
  const value = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatProductPrice(product) {
  const currency = currencyRates[activeCurrency] || currencyRates.USD;
  const value = usdValue(product.price) * currency.rate;
  const maximumFractionDigits = activeCurrency === "JPY" ? 0 : 2;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: activeCurrency,
      maximumFractionDigits
    }).format(value);
  } catch (error) {
    return `${currency.symbol}${value.toLocaleString(undefined, { maximumFractionDigits })}`;
  }
}

function productImageFor(category) {
  const images = {
    Smartphones: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900",
    Laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900",
    Audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",
    Wearables: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",
    Tablets: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900",
    Gaming: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900",
    Appliances: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900",
    Home: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=900",
    Gadgets: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900",
    Lifestyle: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900",
    Cameras: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",
    Monitors: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=900"
  };
  return images[category] || images.Gadgets;
}

function productSearchImage(name) {
  return `https://tse3.mm.bing.net/th?q=${encodeURIComponent(`${name} official product image`)}&w=900&h=600&c=7&rs=1&p=0&o=5&pid=1.7`;
}

function productMedia(product, className = "") {
  if (!product || !product.image) {
    return `<div class="no-image ${className}">No image</div>`;
  }
  return `<img class="${className}" src="${product.image}" alt="${product.name}" loading="lazy">`;
}

function enhanceCatalogData() {
  const catalogAdditions = [
    ["Google Pixel 8a", "Smartphones", "$499"], ["Samsung Galaxy Z Fold6", "Smartphones", "$1,899"], ["Samsung Galaxy Z Flip6", "Smartphones", "$1,099"], ["ASUS ROG Phone 8 Pro", "Smartphones", "$1,199"], ["Sony Xperia 1 VI", "Smartphones", "$1,299"], ["Google Pixel 9 Pro", "Smartphones", "$999"], ["iPhone 16 Pro", "Smartphones", "$999"], ["iPhone 16 Plus", "Smartphones", "$899"], ["Samsung Galaxy S25", "Smartphones", "$799"], ["OnePlus 13", "Smartphones", "$899"], ["Xiaomi 15 Ultra", "Smartphones", "$1,199"], ["Nothing Phone 2a", "Smartphones", "$349"],
    ["Apple MacBook Pro 14 M4", "Laptops", "$1,599"], ["Apple MacBook Pro 16 M4 Max", "Laptops", "$3,499"], ["Lenovo ThinkPad X1 Carbon Gen 12", "Laptops", "$1,699"], ["HP Spectre x360 14", "Laptops", "$1,449"], ["Microsoft Surface Laptop 7", "Laptops", "$1,299"], ["Acer Swift Go 14", "Laptops", "$899"], ["ASUS Zenbook 14 OLED", "Laptops", "$1,099"], ["Framework Laptop 13", "Laptops", "$1,049"], ["Lenovo Yoga 9i", "Laptops", "$1,399"], ["Alienware m16 R2", "Laptops", "$1,699"], ["MSI Stealth 14 Studio", "Laptops", "$1,599"], ["Acer Chromebook Plus Spin 714", "Laptops", "$699"],
    ["Sony WH-1000XM5", "Audio", "$399"], ["Bose QuietComfort Ultra Headphones", "Audio", "$429"], ["Apple AirPods Max", "Audio", "$549"], ["Sennheiser Momentum 4 Wireless", "Audio", "$379"], ["Beats Studio Pro", "Audio", "$349"], ["Jabra Elite 10", "Audio", "$249"], ["Sony WF-1000XM5", "Audio", "$299"], ["Bose QuietComfort Ultra Earbuds", "Audio", "$299"], ["Samsung Galaxy Buds3 Pro", "Audio", "$249"], ["Anker Soundcore Liberty 4 NC", "Audio", "$99"], ["Sonos Ace", "Audio", "$449"], ["Marshall Major V", "Audio", "$199"],
    ["Apple Watch Series 10", "Wearables", "$399"], ["Samsung Galaxy Watch Ultra", "Wearables", "$649"], ["Garmin Forerunner 965", "Wearables", "$599"], ["Garmin Venu 3", "Wearables", "$449"], ["Fitbit Charge 6", "Wearables", "$159"], ["Oura Ring 4", "Wearables", "$349"], ["WHOOP 4.0", "Wearables", "$239"], ["Amazfit Balance", "Wearables", "$229"], ["Google Pixel Watch 3", "Wearables", "$349"], ["Coros Pace 3", "Wearables", "$229"],
    ["Apple iPad Air M2", "Tablets", "$599"], ["Apple iPad Mini", "Tablets", "$499"], ["Samsung Galaxy Tab S10 Ultra", "Tablets", "$1,199"], ["Microsoft Surface Pro 11", "Tablets", "$999"], ["Lenovo Tab P12", "Tablets", "$399"], ["Amazon Fire Max 11", "Tablets", "$229"], ["OnePlus Pad 2", "Tablets", "$549"], ["reMarkable Paper Pro", "Tablets", "$579"],
    ["LG C4 OLED TV", "Appliances", "$1,499"], ["Samsung The Frame TV", "Appliances", "$1,299"], ["Sony Bravia 8 OLED", "Appliances", "$1,799"], ["TCL QM8 Mini-LED TV", "Appliances", "$999"], ["Hisense U8N Mini-LED TV", "Appliances", "$899"], ["Sonos Arc Ultra", "Audio", "$999"], ["Samsung HW-Q990D Soundbar", "Audio", "$1,499"], ["JBL Bar 1300X", "Audio", "$1,699"],
    ["Sony PlayStation 5 Pro", "Gaming", "$699"], ["Xbox Series X", "Gaming", "$499"], ["Nintendo Switch OLED", "Gaming", "$349"], ["Steam Deck OLED", "Gaming", "$549"], ["ASUS ROG Ally X", "Gaming", "$799"], ["Meta Quest 3", "Gaming", "$499"], ["PlayStation Portal", "Gaming", "$199"], ["Backbone One", "Gaming", "$99"],
    ["Canon EOS R6 Mark II", "Cameras", "$2,499"], ["Sony Alpha A7 IV", "Cameras", "$2,499"], ["Fujifilm X-T5", "Cameras", "$1,699"], ["Nikon Z6 III", "Cameras", "$2,499"], ["DJI Osmo Pocket 3", "Cameras", "$519"], ["GoPro Hero13 Black", "Cameras", "$399"], ["Insta360 X4", "Cameras", "$499"], ["DJI Mini 4 Pro", "Cameras", "$759"],
    ["Dell UltraSharp U2723QE", "Monitors", "$549"], ["LG UltraGear 27GR95QE OLED", "Monitors", "$899"], ["Samsung Odyssey OLED G9", "Monitors", "$1,299"], ["ASUS ProArt PA279CRV", "Monitors", "$469"], ["AOC Q27G3XMN", "Monitors", "$279"], ["BenQ ScreenBar Halo", "Gadgets", "$169"],
    ["Dyson V15 Detect", "Home", "$699"], ["Roborock S8 MaxV Ultra", "Home", "$1,799"], ["Ecovacs Deebot X5 Omni", "Home", "$1,399"], ["iRobot Roomba Combo j9+", "Home", "$999"], ["Philips 3000 Air Fryer", "Appliances", "$129"], ["Ninja Foodi DualZone Air Fryer", "Appliances", "$199"], ["Instant Pot Duo Plus", "Appliances", "$129"], ["Breville Smart Oven Air Fryer Pro", "Appliances", "$399"], ["Samsung Bespoke Refrigerator", "Appliances", "$2,699"], ["LG WashCombo All-in-One", "Appliances", "$1,999"], ["Miele Complete C3 Vacuum", "Home", "$1,199"], ["Levoit Core 400S Air Purifier", "Home", "$219"],
    ["Kindle Scribe", "Gadgets", "$339"], ["Kobo Libra Colour", "Gadgets", "$219"], ["Anker 737 Power Bank", "Gadgets", "$159"], ["Belkin 3-in-1 MagSafe Charger", "Gadgets", "$149"], ["Tile Pro Tracker", "Gadgets", "$34"], ["Apple AirTag", "Gadgets", "$29"], ["Nike Pegasus 41", "Lifestyle", "$140"], ["Adidas Ultraboost 5X", "Lifestyle", "$180"], ["Herman Miller Aeron Chair", "Lifestyle", "$1,395"], ["Logitech MX Master 3S", "Gadgets", "$99"]
  ];

  const existing = new Set(products.map((product) => product.id));
  catalogAdditions.forEach(([name, category, price], index) => {
    const id = slugify(name);
    if (existing.has(id)) return;
    const rating = Number((4.1 + ((index % 9) * 0.08)).toFixed(1));
    products.push({
      id,
      name,
      category,
      portal: "Public web review roundup",
      image: productSearchImage(name),
      rating,
      score: Number((8.1 + ((index % 18) * 0.09)).toFixed(1)),
      reviews: 420 + (index * 137) % 9200,
      trend: `+${4 + (index % 22)}%`,
      price,
      verdict: `Strong ${category.toLowerCase()} pick with dependable performance, broad availability, and useful owner feedback.`,
      pros: ["Widely reviewed online", "Good everyday value", "Reliable feature set"],
      specs: { Display: category === "Audio" || category === "Home" || category === "Appliances" ? "N/A" : "Category-leading panel or interface", Processor: "Current-generation platform", Camera: category === "Cameras" || category === "Smartphones" ? "Reviewed camera system" : "N/A", Battery: category === "Audio" || category === "Wearables" || category === "Smartphones" || category === "Tablets" ? "All-day or multi-day rated" : "N/A", Storage: category === "Laptops" || category === "Tablets" || category === "Gaming" ? "Multiple storage options" : "N/A", Warranty: "1 year" }
    });
  });

  const phoneBrandAdditions = [
    ["Samsung", "Galaxy S24 FE", "$649"], ["Apple", "iPhone SE 4", "$499"], ["Google", "Pixel 9a", "$499"], ["Xiaomi", "Redmi Note 13 Pro+", "$399"], ["Redmi", "Redmi K70 Pro", "$499"], ["Poco", "Poco F6 Pro", "$449"],
    ["OnePlus", "OnePlus Nord 4", "$499"], ["OPPO", "OPPO Reno12 Pro", "$599"], ["vivo", "vivo V40 Pro", "$549"], ["Realme", "Realme GT 6", "$599"], ["Honor", "Honor 200 Pro", "$699"], ["Huawei", "Huawei Pura 70 Ultra", "$1,199"],
    ["Motorola", "Motorola Razr 50 Ultra", "$999"], ["Nothing", "Nothing Phone 2a Plus", "$399"], ["ASUS", "ASUS Zenfone 11 Ultra", "$899"], ["Sony", "Sony Xperia 10 VI", "$449"], ["Nokia", "Nokia XR21", "$499"], ["TCL", "TCL 50 Pro NXTPAPER", "$299"],
    ["Tecno", "Tecno Camon 30 Premier", "$429"], ["Infinix", "Infinix GT 20 Pro", "$299"], ["ZTE", "nubia Z60 Ultra", "$649"], ["Meizu", "Meizu 21 Pro", "$699"], ["HTC", "HTC U24 Pro", "$599"], ["Lenovo", "Lenovo Legion Y90", "$699"]
  ];

  phoneBrandAdditions.forEach(([brand, name, price], index) => {
    const id = slugify(name);
    if (existing.has(id) || products.some((product) => product.id === id)) return;
    const rating = Number((4.0 + ((index % 8) * 0.09)).toFixed(1));
    products.push({
      id,
      name,
      brand,
      category: "Smartphones",
      portal: "GSMArena-style community specs",
      image: productSearchImage(name),
      rating,
      score: Number((8.0 + ((index % 12) * 0.11)).toFixed(1)),
      reviews: 360 + (index * 227) % 6100,
      trend: `+${5 + (index % 18)}%`,
      price,
      verdict: `${brand} phone entry for community opinions, specs checking, owner replies, and review sharing.`,
      pros: ["Brand community feedback", "Specs-first discussion", "Owner reply threads"],
      specs: { Display: "Phone-class OLED/LCD panel", Processor: "Current mobile platform", Camera: "Multi-camera phone system", Battery: "All-day battery target", Storage: "128GB / 256GB options", Warranty: "Regional warranty varies" }
    });
  });

  products.forEach((product) => {
    product.brand = productBrand(product);
    product.image = productSearchImage(product.name);
  });

  const authors = ["Ava Santos", "Ben Carter", "Chloe Reyes", "Daniel Kim", "Ella Morgan", "Francis Lee", "Grace Tan", "Hannah Cruz", "Isaac Lim", "Jasmine Park", "Kyle Nguyen", "Lara Wells"];
  products.forEach((product, index) => {
    if (reviews.some((review) => review.productId === product.id)) return;
    reviews.push({
      id: `review-${product.id}`,
      productId: product.id,
      author: authors[index % authors.length],
      type: "Verified buyer",
      rating: Math.min(5, Math.max(4, Math.round(product.rating))),
      date: `2026-05-${twoDigit(10 + (index % 20))}T${twoDigit(8 + (index % 10))}:15:00+08:00`,
      title: `${product.name} feels worth the shortlist`,
      text: `I checked several online reviews before buying. The ${product.name} matches the common feedback: ${product.verdict.toLowerCase()} My favorite parts are ${product.pros.slice(0, 2).join(" and ")}.`,
      photo: product.image || ""
    });
  });

  reviews.forEach((review, index) => {
    const product = productById(review.productId);
    review.id = review.id || `review-${slugify(review.productId)}-${index}`;
    review.photo = product && product.image ? product.image : "";
  });

  articles.forEach((article) => {
    article.id = article.id || slugify(article.title);
    article.image = article.image || productImageFor(article.category);
    article.takeaways = article.takeaways || [
      "Start with your daily use case before comparing specs.",
      "Check multiple public reviews and buyer feedback before buying.",
      "The best value is usually the product that balances support, reliability, and price."
    ];
    article.sections = article.sections || [
      { heading: "Buying Advice", body: `${article.summary} Compare rating trends, warranty coverage, availability, and the features you will use every day before you commit.` },
      { heading: "How We Shortlist", body: "ReviewHub combines public product information, editorial-style scoring, buyer sentiment, and category fit into a practical shopping shortlist." }
    ];
  });
}

enhanceCatalogData();

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const ratingLabel = (rating) => `${rating.toFixed(1)} / 5`;

function starRating(rating) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  return `
    <span class="stars" aria-label="${rating} out of 5 stars">
      <span class="stars-empty">&#9734;&#9734;&#9734;&#9734;&#9734;</span>
      <span class="stars-fill" style="width:${percent}%">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
    </span>
  `;
}

function renderCurrentTime() {
  const node = document.querySelector("[data-current-time]");
  if (!node) return;
  const update = () => {
    node.textContent = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "medium" }).format(new Date());
  };
  update();
  setInterval(update, 1000);
}

function refreshRenderedViews() {
  renderPortalStats();
  renderAccountControls();
  renderProducts();
  renderTrending();
  renderRecommendations();
  renderReviewPage();
  renderExternalReviewsPage();
  renderRankingsPage();
  renderArticlesPage();
  renderArticleDetailPage();
  renderReviewDetailPage();
  renderCommunityFeed();
}

function commentCount(productId) {
  return communityDB.comments.filter((comment) => comment.productId === productId).length;
}

function initCurrencySelector() {
  const nav = document.querySelector("nav");
  if (!nav || document.getElementById("currencySelect")) return;
  const select = document.createElement("select");
  select.id = "currencySelect";
  select.setAttribute("aria-label", "Display currency");
  select.innerHTML = Object.keys(currencyRates).map((code) => `
    <option value="${code}" ${code === activeCurrency ? "selected" : ""}>${currencyRates[code].label}</option>
  `).join("");
  const themeToggle = document.getElementById("themeToggle");
  nav.insertBefore(select, themeToggle);

  select.addEventListener("change", () => {
    activeCurrency = select.value;
    try {
      localStorage.setItem("reviewhubCurrency", activeCurrency);
    } catch (error) {}
    refreshRenderedViews();
    if (typeof compareProducts === "function") compareProducts();
  });
}

function renderAccountControls() {
  const nav = document.querySelector("nav");
  if (!nav) return;
  let panel = document.getElementById("accountPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "accountPanel";
    panel.className = "account-panel";
    const themeToggle = document.getElementById("themeToggle");
    nav.insertBefore(panel, themeToggle);
  }
  const user = currentUser();
  panel.innerHTML = user
    ? `<span class="account-chip">${escapeHtml(user.name)}</span><button type="button" data-auth-action="logout">Sign out</button>`
    : `<button type="button" data-open-auth>Login / Sign up</button>`;
}

function ensureAuthModal() {
  let modal = document.getElementById("authModal");
  if (modal) return modal;
  modal = document.createElement("section");
  modal.id = "authModal";
  modal.className = "product-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-backdrop" data-close-auth></div>
    <article class="modal-panel auth-modal-panel" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="modal-close" type="button" data-close-auth>Close</button>
      <h2 id="authTitle">Join ReviewHub</h2>
      <p class="muted">Create a local account for your reviews, or keep posting anonymously whenever you prefer.</p>
      <div class="auth-grid">
        <form data-signup-form class="community-form">
          <h3>Sign up</h3>
          <input name="name" type="text" placeholder="Display name" required>
          <input name="email" type="email" placeholder="Email" required>
          <input name="password" type="password" placeholder="Password" minlength="4" required>
          <button type="submit">Create account</button>
        </form>
        <form data-login-form class="community-form">
          <h3>Login</h3>
          <input name="email" type="email" placeholder="Email" required>
          <input name="password" type="password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
      </div>
      <p class="auth-message" data-auth-message></p>
    </article>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openAuthModal() {
  const modal = ensureAuthModal();
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderBrandFilters() {
  const node = document.querySelector("[data-brand-filters]");
  if (!node) return;
  const brands = [...new Set(products.filter((product) => product.category === "Smartphones").map(productBrand))].sort();
  node.innerHTML = `<span>Phone brands</span>${brands.map((brand) => `<button type="button" data-brand-filter="${escapeHtml(brand)}">${escapeHtml(brand)}</button>`).join("")}`;
}

function renderPortalStats() {
  const node = document.querySelector("[data-portal-stats]");
  if (!node) return;
  const categories = new Set(products.map((product) => product.category));
  const totalReviews = products.reduce((sum, product) => sum + product.reviews, 0);
  node.innerHTML = `
    <article><strong>${products.length}</strong><span>Products tracked</span></article>
    <article><strong>${categories.size}</strong><span>Review portals</span></article>
    <article><strong>${totalReviews.toLocaleString()}</strong><span>User review logs</span></article>
    <article><strong>${articles.length}</strong><span>Buying guides</span></article>
  `;
}

function renderFilters() {
  const node = document.querySelector(".filters");
  if (!node) return;
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  node.innerHTML = categories.map((category, index) => `
    <button class="${index === 0 ? "active" : ""}" data-filter="${category}">${category}</button>
  `).join("");
}

function renderProducts(list = products) {
  const grid = document.querySelector("[data-product-grid]");
  const empty = document.querySelector("[data-empty-results]");
  const count = document.querySelector("[data-result-count]");
  if (!grid) return;
  grid.innerHTML = list.map((product) => `
    <article class="product-card" data-open-product="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
      ${productMedia(product)}
      <div class="product-card-body">
        <div class="card-topline">
          <span>${product.category}</span>
          <strong>${product.trend} trending</strong>
        </div>
        <h3>${product.name}</h3>
        <p>${product.verdict}</p>
        <div class="rating">${starRating(product.rating)} <span>${ratingLabel(product.rating)}</span></div>
        <dl class="product-meta">
          <div><dt>Score</dt><dd>${product.score}/10</dd></div>
          <div><dt>Reviews</dt><dd>${product.reviews.toLocaleString()}</dd></div>
          <div><dt>Price</dt><dd>${formatProductPrice(product)}</dd></div>
        </dl>
        <div class="community-stats"><span>${escapeHtml(productBrand(product))}</span><strong>${commentCount(product.id)} comments</strong></div>
        <span class="details-link">View details</span>
      </div>
    </article>
  `).join("");
  if (empty) empty.hidden = list.length > 0;
  if (count) count.textContent = `${list.length.toLocaleString()} products found`;
}

function renderTrending() {
  const node = document.querySelector("[data-trending-list]");
  if (!node) return;
  const top = [...products].sort((a, b) => parseInt(b.trend) - parseInt(a.trend)).slice(0, 6);
  node.innerHTML = top.map((product, index) => `
    <li>
      <span>${index + 1}</span>
      <div>
        <strong>${product.name}</strong>
        <small>${product.category} - ${product.reviews.toLocaleString()} reviews</small>
      </div>
      <b>${product.trend}</b>
    </li>
  `).join("");
}

function renderRecommendations() {
  const node = document.querySelector("[data-recommended-list]");
  if (!node) return;

  node.innerHTML = recommendations.map((item) => {
    const product = productById(item.productId);
    if (!product) return "";
    return `
      <article class="recommend-card" data-open-product="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
        ${productMedia(product)}
        <div>
          <span>${item.badge}</span>
          <h3>${product.name}</h3>
          <p>${item.reason}</p>
          <strong>${product.score}/10 - ${formatProductPrice(product)}</strong>
        </div>
      </article>
    `;
  }).join("");
}

function productReviews(productId) {
  return reviews.filter((review) => review.productId === productId);
}

function productComments(productId) {
  return communityDB.comments
    .filter((comment) => comment.productId === productId && !comment.parentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function commentReplies(commentId) {
  return communityDB.comments
    .filter((comment) => comment.parentId === commentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function authorLabel(item) {
  if (item.anonymous) return "Anonymous";
  const user = communityDB.users.find((account) => account.id === item.userId);
  return user ? user.name : item.author || "Community member";
}

function communityComposer(productId, parentId = "") {
  const user = currentUser();
  const prompt = parentId ? "Reply with your experience or question..." : "Share your review, opinion, issue, or ownership tip...";
  return `
    <form class="community-form" data-community-form data-product-id="${productId}" data-parent-id="${parentId}">
      <div class="community-form-top">
        <strong>${user ? `Posting as ${escapeHtml(user.name)}` : "Posting anonymously"}</strong>
        <label><input type="checkbox" name="anonymous" ${user ? "" : "checked"}> Anonymous</label>
      </div>
      <textarea name="text" rows="${parentId ? 2 : 4}" placeholder="${prompt}" required></textarea>
      ${parentId ? "" : `<div class="community-form-row"><input name="title" type="text" placeholder="Optional review title"><select name="rating" aria-label="Rating"><option value="">No rating</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div>`}
      <button type="submit">${parentId ? "Reply" : "Post comment"}</button>
    </form>
  `;
}

function communityThreadMarkup(productId) {
  const comments = productComments(productId);
  if (!comments.length) return `<p class="muted">No community comments yet. Start the discussion with a review, question, or ownership note.</p>`;
  return comments.map((comment) => {
    const replies = commentReplies(comment.id);
    return `
      <article class="community-comment">
        <div class="comment-head">
          <strong>${escapeHtml(authorLabel(comment))}</strong>
          <span>${formatDateTime(comment.date)}</span>
        </div>
        ${comment.title ? `<h4>${escapeHtml(comment.title)}</h4>` : ""}
        ${comment.rating ? `<div class="rating compact-rating">${starRating(Number(comment.rating))}<span>${comment.rating}/5</span></div>` : ""}
        <p>${escapeHtml(comment.text)}</p>
        <details class="reply-box">
          <summary>Reply</summary>
          ${communityComposer(productId, comment.id)}
        </details>
        ${replies.length ? `<div class="reply-list">${replies.map((reply) => `
          <article class="community-reply">
            <div class="comment-head"><strong>${escapeHtml(authorLabel(reply))}</strong><span>${formatDateTime(reply.date)}</span></div>
            <p>${escapeHtml(reply.text)}</p>
          </article>
        `).join("")}</div>` : ""}
      </article>
    `;
  }).join("");
}

function communitySection(productId) {
  const product = productById(productId);
  return `
    <section class="community-section" data-community-section="${productId}">
      <div class="section-heading compact-heading">
        <div>
          <h3>Community opinions</h3>
          <p>${escapeHtml(product.name)} owner comments and replies</p>
        </div>
        <strong>${commentCount(productId)} posts</strong>
      </div>
      ${communityComposer(productId)}
      <div class="community-thread">${communityThreadMarkup(productId)}</div>
    </section>
  `;
}

function renderCommunityFeed() {
  const node = document.querySelector("[data-community-feed]");
  if (!node) return;
  const entries = [...communityDB.comments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
  node.innerHTML = entries.length ? entries.map((comment) => {
    const product = productById(comment.productId);
    if (!product) return "";
    return `
      <article class="article-card source-card">
        <div class="card-topline"><span>${escapeHtml(productBrand(product))}</span><strong>${formatDateTime(comment.date)}</strong></div>
        <h2>${escapeHtml(product.name)}</h2>
        <p>${escapeHtml(comment.text)}</p>
        <small>${escapeHtml(authorLabel(comment))}${comment.parentId ? " replied" : " commented"}</small>
        <a class="details-link inline-link" href="review-detail.html?id=${encodeURIComponent((productReviews(product.id)[0] || reviews[0]).id)}">Open discussion</a>
      </article>
    `;
  }).join("") : `<p class="muted">Community posts will appear here after visitors share reviews or reply to product discussions.</p>`;
}

function ensureModal() {
  let modal = document.getElementById("productModal");
  if (modal) return modal;

  modal = document.createElement("section");
  modal.id = "productModal";
  modal.className = "product-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-backdrop" data-close-modal></div>
    <article class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal-close" type="button" data-close-modal>Close</button>
      <div data-modal-content></div>
    </article>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openProduct(productId) {
  const product = productById(productId);
  const modal = ensureModal();
  const content = modal.querySelector("[data-modal-content]");
  const productReviewList = productReviews(product.id);
  const externalLinks = externalReviews[product.id] || [];
  const specRows = Object.entries(product.specs).map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("");
  const reviewMarkup = productReviewList.length
    ? productReviewList.map((review) => `
        <article class="mini-review">
          <div>${starRating(review.rating)} <strong>${review.rating}/5</strong></div>
          <h3>${review.title}</h3>
          <p>${review.text}</p>
          <small>${review.author} - ${review.type} - ${formatDateTime(review.date)}</small>
        </article>
      `).join("")
    : `<p class="muted">No detailed buyer review has been logged yet for this product.</p>`;
  const externalMarkup = externalLinks.length
    ? externalLinks.map((link) => `<a href="${link.url}" target="_blank" rel="noopener">${link.site}: ${link.title}</a>`).join("")
    : `<span class="muted">No external review source has been attached yet.</span>`;

  content.innerHTML = `
    <div class="modal-hero">
      ${productMedia(product)}
      <div>
        <span class="modal-category">${product.category} - ${product.portal}</span>
        <h2 id="modalTitle">${product.name}</h2>
        <p>${product.verdict}</p>
        <div class="rating large">${starRating(product.rating)} <span>${ratingLabel(product.rating)}</span></div>
        <dl class="product-meta">
          <div><dt>Score</dt><dd>${product.score}/10</dd></div>
          <div><dt>Trend</dt><dd>${product.trend}</dd></div>
          <div><dt>Price</dt><dd>${formatProductPrice(product)}</dd></div>
        </dl>
      </div>
    </div>
    <div class="modal-grid">
      <section>
        <h3>Key strengths</h3>
        <ul class="pros-list">${product.pros.map((pro) => `<li>${pro}</li>`).join("")}</ul>
      </section>
      <section>
        <h3>Specifications</h3>
        <table class="spec-table">${specRows}</table>
      </section>
    </div>
    <section>
      <h3>Buyer review log</h3>
      <div class="mini-review-list">${reviewMarkup}</div>
    </section>
    ${communitySection(product.id)}
    <section class="external-sources">
      <h3>External review sources</h3>
      <div>${externalMarkup}</div>
    </section>
  `;

  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  const modal = document.getElementById("productModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function initProductClicks() {
  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close-modal]");
    if (close) {
      closeModal();
      return;
    }
    const opener = event.target.closest("[data-open-product]");
    if (opener) openProduct(opener.dataset.openProduct);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    if (event.key !== "Enter" && event.key !== " ") return;
    const opener = event.target.closest && event.target.closest("[data-open-product]");
    if (opener) {
      event.preventDefault();
      openProduct(opener.dataset.openProduct);
    }
  });
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const suggestions = document.getElementById("suggestions");
  const button = document.getElementById("searchBtn");
  const filters = document.querySelectorAll("[data-filter]");
  const brandFilters = document.querySelector("[data-brand-filters]");
  if (!input || !suggestions || !button) return;

  let activeCategory = "All";
  let activeBrand = "All";

  const matchesQuery = (product, query) => {
    const haystack = [product.name, product.category, product.portal, product.verdict, ...product.pros, ...Object.values(product.specs)].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  };

  const highlight = (text, query) => {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
  };

  const filteredProducts = () => {
    const query = input.value.trim();
    return products.filter((product) => {
      const categoryOk = activeCategory === "All" || product.category === activeCategory;
      const brandOk = activeBrand === "All" || productBrand(product) === activeBrand;
      const queryOk = !query || matchesQuery(product, query);
      return categoryOk && brandOk && queryOk;
    });
  };

  const runSearch = () => {
    renderProducts(filteredProducts());
    suggestions.hidden = true;
    const results = document.getElementById("results");
    if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderSuggestions = () => {
    const query = input.value.trim();
    renderProducts(filteredProducts());
    if (!query) {
      suggestions.hidden = true;
      suggestions.innerHTML = "";
      return;
    }
    const matches = products.filter((product) => matchesQuery(product, query)).slice(0, 7);
    suggestions.innerHTML = matches.length
      ? matches.map((product) => `
          <button type="button" class="suggestion-item" data-suggestion="${product.id}">
            <span>${highlight(product.name, query)}</span>
            <small>${product.category} - ${product.score}/10</small>
          </button>
        `).join("")
      : '<div class="no-suggestions">No matching products yet. Try a category, brand, spec, or feature.</div>';
    suggestions.hidden = false;
  };

  input.addEventListener("input", renderSuggestions);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSearch();
    if (event.key === "Escape") suggestions.hidden = true;
  });
  suggestions.addEventListener("click", (event) => {
    const item = event.target.closest("[data-suggestion]");
    if (!item) return;
    input.value = productById(item.dataset.suggestion).name;
    runSearch();
  });
  button.addEventListener("click", runSearch);
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      activeCategory = filter.dataset.filter;
      filters.forEach((item) => item.classList.toggle("active", item === filter));
      runSearch();
    });
  });
  if (brandFilters) {
    brandFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-brand-filter]");
      if (!button) return;
      activeBrand = button.classList.contains("active") ? "All" : button.dataset.brandFilter;
      brandFilters.querySelectorAll("[data-brand-filter]").forEach((item) => {
        item.classList.toggle("active", activeBrand !== "All" && item === button);
      });
      runSearch();
    });
  }
}

function initTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    toggle.textContent = document.body.classList.contains("light-mode") ? "Light" : "Dark";
  });
}

function initAuth() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-auth]")) {
      openAuthModal();
      return;
    }
    if (event.target.closest("[data-close-auth]")) {
      closeAuthModal();
      return;
    }
    if (event.target.closest('[data-auth-action="logout"]')) {
      communityDB.currentUserId = null;
      saveCommunityDB();
      renderAccountControls();
      refreshRenderedViews();
    }
  });

  document.addEventListener("submit", (event) => {
    const signup = event.target.closest("[data-signup-form]");
    const login = event.target.closest("[data-login-form]");
    const authMessage = document.querySelector("[data-auth-message]");
    if (!signup && !login) return;
    event.preventDefault();
    const form = signup || login;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    if (signup) {
      if (communityDB.users.some((user) => user.email === email)) {
        if (authMessage) authMessage.textContent = "That email already has an account.";
        return;
      }
      const user = { id: makeId("user"), name: String(data.get("name") || "Member").trim(), email, password, joined: new Date().toISOString() };
      communityDB.users.push(user);
      communityDB.currentUserId = user.id;
      saveCommunityDB();
      form.reset();
      closeAuthModal();
      refreshRenderedViews();
      return;
    }
    const user = communityDB.users.find((account) => account.email === email && account.password === password);
    if (!user) {
      if (authMessage) authMessage.textContent = "Email or password did not match.";
      return;
    }
    communityDB.currentUserId = user.id;
    saveCommunityDB();
    form.reset();
    closeAuthModal();
    refreshRenderedViews();
  });
}

function initCommunityForms() {
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-community-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const text = String(data.get("text") || "").trim();
    if (!text) return;
    const user = currentUser();
    const anonymous = data.get("anonymous") === "on" || !user;
    communityDB.comments.push({
      id: makeId("comment"),
      productId: form.dataset.productId,
      parentId: form.dataset.parentId || "",
      userId: anonymous ? "" : user.id,
      anonymous,
      title: String(data.get("title") || "").trim(),
      rating: String(data.get("rating") || ""),
      text,
      date: new Date().toISOString()
    });
    saveCommunityDB();
    form.reset();
    refreshRenderedViews();
    const productModal = document.getElementById("productModal");
    if (productModal && !productModal.hidden) openProduct(form.dataset.productId);
  });
}

function renderReviewPage() {
  const node = document.querySelector("[data-review-list]");
  if (!node) return;
  const activeCategory = node.dataset.activeCategory || "All";
  const visibleReviews = reviews.filter((review) => {
    const product = productById(review.productId);
    return activeCategory === "All" || product.category === activeCategory;
  });
  node.innerHTML = visibleReviews.map((review) => {
    const product = productById(review.productId);
    return `
      <article class="review-card review-card-rich">
        ${review.photo ? `<img src="${review.photo}" alt="${product.name} delivered product photo" loading="lazy">` : `<div class="no-image">No image</div>`}
        <div>
          <div class="card-topline"><span>${review.type}</span><strong>${formatDateTime(review.date)}</strong></div>
          <h2>${review.title}</h2>
          <p>${review.text}</p>
          <div class="review-footer"><span>${starRating(review.rating)} ${review.rating}/5 rating</span><span>${review.author} - ${product.name}</span></div>
          <a class="details-link inline-link" href="review-detail.html?id=${review.id}" target="_blank" rel="noopener">View full review</a>
        </div>
      </article>
    `;
  }).join("");
}

function renderReviewFilters() {
  const node = document.querySelector("[data-review-filters]");
  if (!node) return;
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  node.innerHTML = categories.map((category, index) => `
    <button type="button" class="${index === 0 ? "active" : ""}" data-review-filter="${category}">${category}</button>
  `).join("");

  node.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-filter]");
    const list = document.querySelector("[data-review-list]");
    if (!button || !list) return;
    list.dataset.activeCategory = button.dataset.reviewFilter;
    node.querySelectorAll("[data-review-filter]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderReviewPage();
  });
}

function renderExternalReviewsPage() {
  const node = document.querySelector("[data-external-review-list]");
  if (!node) return;

  const entries = Object.entries(externalReviews).flatMap(([productId, links]) => {
    const product = productById(productId);
    return links.map((link) => ({ product, link }));
  });

  node.innerHTML = entries.map(({ product, link }) => `
    <article class="article-card source-card">
      <div class="card-topline"><span>${product.category}</span><strong>${link.site}</strong></div>
      <h2>${product.name}</h2>
      <p>${link.title}</p>
      <a href="${link.url}" target="_blank" rel="noopener">Open real review website</a>
    </article>
  `).join("");
}

function renderRankingsPage() {
  const node = document.querySelector("[data-ranking-list]");
  if (!node) return;
  node.innerHTML = [...products].sort((a, b) => b.score - a.score).map((product, index) => `
    <article class="ranking-card">
      <span class="rank">#${index + 1}</span>
      <div><h2>${product.name}</h2><p>${product.verdict}</p></div>
      <strong>${product.score}/10</strong>
    </article>
  `).join("");
}

function renderArticlesPage() {
  const node = document.querySelector("[data-article-list]");
  if (!node) return;
  node.innerHTML = articles.map((article) => `
    <article class="article-card article-card-rich">
      <img src="${article.image || productImageFor(article.category)}" alt="${article.title}">
      <div>
        <div class="card-topline"><span>${article.category}</span><strong>${formatDateTime(article.date)}</strong></div>
        <h2>${article.title}</h2>
        <p>${article.summary}</p>
        <small>${article.source}</small>
        <a class="details-link inline-link" href="article.html?id=${article.id || slugify(article.title)}" target="_blank" rel="noopener">Read article</a>
      </div>
    </article>
  `).join("");
}

function renderArticleDetailPage() {
  const node = document.querySelector("[data-article-detail]");
  if (!node) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const article = articleById(id) || articles[0];
  const relatedProducts = (article.products || []).map(productById).filter(Boolean);
  node.innerHTML = `
    <a class="back-link" href="articles.html">Back to articles</a>
    <article class="detail-article">
      <img class="detail-hero-image" src="${article.image || productImageFor(article.category)}" alt="${article.title}">
      <div class="card-topline"><span>${article.category}</span><strong>${formatDateTime(article.date)}</strong></div>
      <h1>${article.title}</h1>
      <p class="page-intro">${article.summary}</p>
      <small class="detail-source">${article.source}</small>
      ${article.takeaways ? `<section class="takeaway-panel"><h2>Key Takeaways</h2><ul>${article.takeaways.map((item) => `<li>${item}</li>`).join("")}</ul></section>` : ""}
      ${(article.sections || []).map((section) => `<section class="article-section"><h2>${section.heading}</h2><p>${section.body}</p></section>`).join("")}
      ${relatedProducts.length ? `<section class="related-products"><h2>Products Mentioned</h2><div class="product-grid">${relatedProducts.map((product) => `
        <article class="product-card compact-card" data-open-product="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
          ${productMedia(product)}
          <div class="product-card-body"><h3>${product.name}</h3><p>${product.verdict}</p><div class="rating">${starRating(product.rating)} <span>${ratingLabel(product.rating)}</span></div></div>
        </article>
      `).join("")}</div></section>` : ""}
    </article>
  `;
}

function renderReviewDetailPage() {
  const node = document.querySelector("[data-review-detail]");
  if (!node) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const review = reviewById(id) || reviews[0];
  const product = productById(review.productId);
  node.innerHTML = `
    <a class="back-link" href="reviews.html">Back to reviews</a>
    <article class="detail-review">
      <div class="review-detail-header">
        ${review.photo ? `<img src="${review.photo}" alt="${product.name} delivered product photo" loading="lazy">` : `<div class="no-image">No image</div>`}
        <div>
          <div class="card-topline"><span>${review.type}</span><strong>${formatDateTime(review.date)}</strong></div>
          <h1>${review.title}</h1>
          <p class="page-intro">${review.author} reviewed ${product.name}</p>
          <div class="rating large">${starRating(review.rating)} <span>${review.rating}/5 rating</span></div>
        </div>
      </div>
      <p class="review-full-text">${review.text}</p>
      <section class="reviewed-product">
        <h2>Reviewed Product</h2>
        <article class="recommend-card" data-open-product="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
          ${productMedia(product)}
          <div>
            <span>${product.category}</span>
            <h3>${product.name}</h3>
            <p>${product.verdict}</p>
            <strong>${product.score}/10 - ${formatProductPrice(product)}</strong>
          </div>
        </article>
      </section>
      ${communitySection(product.id)}
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderAccountControls();
  initCurrencySelector();
  ensureAuthModal();
  initAuth();
  initCommunityForms();
  renderCurrentTime();
  renderFilters();
  renderBrandFilters();
  renderPortalStats();
  renderProducts();
  renderTrending();
  renderRecommendations();
  initSearch();
  initTheme();
  initProductClicks();
  renderReviewFilters();
  renderReviewPage();
  renderExternalReviewsPage();
  renderRankingsPage();
  renderArticlesPage();
  renderArticleDetailPage();
  renderReviewDetailPage();
  renderCommunityFeed();
});
