const $ = (id) => document.getElementById(id);

let catalog = null;

function makeCheck(container, item) {
  const label = document.createElement("label");
  label.className = "chk";
  label.innerHTML = `
    <input type="checkbox" value="${item.id}">
    <span>${item.label}</span>
  `;
  container.appendChild(label);
}

async function loadCatalog() {
  const res = await fetch("/api/catalog");
  const data = await res.json();
  if (!data.ok) throw new Error("No se pudo cargar catálogo");

  catalog = data.catalog;

  const drinks = $("drinks");
  const sweets = $("sweets");
  drinks.innerHTML = "";
  sweets.innerHTML = "";

  catalog.drinks.forEach((it) => makeCheck(drinks, it));
  catalog.sweets.forEach((it) => makeCheck(sweets, it));
}

function getSelections() {
  const checked = Array.from(document.querySelectorAll("input[type=checkbox]:checked"));
  return checked.map((c) => c.value);
}

async function submit() {
  const name = $("name").value.trim();
  const ageGroup = $("ageGroup").value;
  const selections = getSelections();

  const msg = $("msg");
  msg.className = "small";
  msg.textContent = "";

  if (!name) {
    msg.classList.add("error");
    msg.textContent = "Poné tu nombre, campeón/a. Sin nombre no hay trazabilidad 😄";
    return;
  }

  const res = await fetch("/api/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ageGroup, selections })
  });

  const data = await res.json();
  if (!data.ok) {
    msg.classList.add("error");
    msg.textContent = data.message || "Error guardando";
    return;
  }

  msg.classList.add("success");
  msg.textContent = "✅ Guardado. Tu consumo ya está en el backlog de compras.";
}

$("saveBtn").addEventListener("click", submit);

loadCatalog().catch((e) => {
  const msg = $("msg");
  msg.className = "small error";
  msg.textContent = "Error cargando opciones: " + e.message;
});