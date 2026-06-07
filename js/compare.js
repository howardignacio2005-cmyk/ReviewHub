const categorySelect = document.getElementById("compareCategory");
const firstSelect = document.getElementById("product1");
const secondSelect = document.getElementById("product2");
const compareButton = document.getElementById("compareBtn");
const table = document.getElementById("comparisonTable");
const filterBar = document.querySelector("[data-compare-filters]");

const rows = ["Score", "Rating", "Price", "Trend", "Reviews", "Display", "Processor", "Camera", "Battery", "Storage", "Warranty"];
const categories = [...new Set(products.map((product) => product.category))];

categorySelect.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
if (filterBar) {
  filterBar.innerHTML = categories.map((category, index) => `
    <button type="button" class="${index === 0 ? "active" : ""}" data-compare-filter="${category}">${category}</button>
  `).join("");
}

function productsForCategory() {
  const category = categorySelect.value;
  return products.filter((product) => product.category === category);
}

function fillProductOptions() {
  const categoryProducts = productsForCategory();
  const optionMarkup = categoryProducts.map((product) => `<option value="${product.id}">${product.name}</option>`).join("");

  firstSelect.innerHTML = optionMarkup;
  secondSelect.innerHTML = optionMarkup;
  secondSelect.selectedIndex = categoryProducts.length > 1 ? 1 : 0;
}

function valueFor(product, row) {
  if (row === "Score") return `${product.score}/10`;
  if (row === "Rating") return `${product.rating.toFixed(1)}/5`;
  if (row === "Price") return formatProductPrice(product);
  if (row === "Trend") return product.trend;
  if (row === "Reviews") return product.reviews.toLocaleString();
  return product.specs[row] || "N/A";
}

function compareProducts() {
  const first = products.find((product) => product.id === firstSelect.value);
  const second = products.find((product) => product.id === secondSelect.value);

  if (!first || !second) {
    table.innerHTML = "<tr><th>No products available in this category yet.</th></tr>";
    return;
  }

  if (first.category !== second.category) {
    table.innerHTML = "<tr><th>Please choose products from the same category.</th></tr>";
    return;
  }

  table.innerHTML = `
    <tr><th>Feature</th><th>${first.name}</th><th>${second.name}</th></tr>
    <tr><td>Category</td><td>${first.category}</td><td>${second.category}</td></tr>
    ${rows.map((row) => `<tr><td>${row}</td><td>${valueFor(first, row)}</td><td>${valueFor(second, row)}</td></tr>`).join("")}
  `;
}

categorySelect.addEventListener("change", () => {
  fillProductOptions();
  syncFilterButtons();
  compareProducts();
});
compareButton.addEventListener("click", compareProducts);
firstSelect.addEventListener("change", () => {
  const first = products.find((product) => product.id === firstSelect.value);
  if (first && first.category !== categorySelect.value) {
    categorySelect.value = first.category;
    fillProductOptions();
    firstSelect.value = first.id;
    syncFilterButtons();
  }
  compareProducts();
});
secondSelect.addEventListener("change", compareProducts);

function syncFilterButtons() {
  if (!filterBar) return;
  filterBar.querySelectorAll("[data-compare-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.compareFilter === categorySelect.value);
  });
}

if (filterBar) {
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-compare-filter]");
    if (!button) return;
    categorySelect.value = button.dataset.compareFilter;
    fillProductOptions();
    syncFilterButtons();
    compareProducts();
  });
}

fillProductOptions();
syncFilterButtons();
compareProducts();
