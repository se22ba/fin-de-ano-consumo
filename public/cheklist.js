const listEl = document.getElementById("list");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const STORAGE_KEY = "finDeAnoChecklist_v1";
const AISLES = {
  "Cerveza rubia": "Bebidas",
  "Cerveza negra": "Bebidas",
  "Coca-Cola": "Bebidas",
  "Pomelo": "Bebidas",
  "Agua": "Bebidas",
  "Fernet": "Alcohol",
  "Sidra": "Alcohol",
  "Sidra sin alcohol": "Bebidas",
  "Ananá Fizz": "Alcohol"
};

const ADMIN_TOKEN = prompt("Token admin:");

let checklist = [];

async function loadChecklist() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    const parsed = JSON.parse(saved);
    checklist = parsed.checklist;
    totalsCache = parsed.totals;
    renderAll();
    return;
  }

  const res = await fetch("/api/admin/checklist", {
    headers: { "x-admin-token": ADMIN_TOKEN }
  });

  const data = await res.json();
  if (!data.ok) {
    alert("Error cargando checklist");
    return;
  }

  checklist = data.checklist;
  totalsCache = data.totals;

  persist();
  renderAll();
}

async function loadChecklist() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    const parsed = JSON.parse(saved);
    checklist = parsed.checklist;
    totalsCache = parsed.totals;
    renderAll();
    return;
  }

  const res = await fetch("/api/admin/checklist", {
    headers: { "x-admin-token": ADMIN_TOKEN }
  });

  const data = await res.json();
  if (!data.ok) {
    alert("Error cargando checklist");
    return;
  }

  checklist = data.checklist;
  totalsCache = data.totals;

  persist();
  renderAll();
}

function renderList() {
  listEl.innerHTML = "";

  const grouped = {};

  checklist.forEach(item => {
    const aisle = AISLES[item.label] || "Otros";
    if (!grouped[aisle]) grouped[aisle] = [];
    grouped[aisle].push(item);
  });

  Object.keys(grouped).forEach(aisle => {
    const title = document.createElement("h4");
    title.textContent = aisle;
    listEl.appendChild(title);

    grouped[aisle].forEach((item, i) => {
      const index = checklist.indexOf(item);
      const div = document.createElement("div");
      div.className = "check-item";

      div.innerHTML = `
        <input type="checkbox" ${item.checked ? "checked" : ""}/>
        <div class="${item.checked ? "done" : ""}">
          <strong>${item.label}</strong><br/>
          <span class="small">${item.quantity}</span>
        </div>
      `;

      div.querySelector("input").addEventListener("change", (e) => {
        checklist[index].checked = e.target.checked;
        persist();
        renderAll();
      });

      listEl.appendChild(div);
    });
  });
}

function renderProgress() {
  const total = checklist.length;
  const done = checklist.filter(i => i.checked).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  progressBar.style.width = percent + "%";
  progressText.textContent = `${percent}% completo (${done}/${total})`;
}

function renderChart(totals) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const alcohol =
    (totals.beer_blonde_l || 0) +
    (totals.beer_dark_l || 0) +
    (totals.sidra_l || 0) +
    (totals.anana_fizz_l || 0);

  const noAlcohol =
    (totals.coke_l || 0) +
    (totals.pomelo_l || 0) +
    (totals.water_l || 0) +
    (totals.sidra_na_l || 0);

  const total = alcohol + noAlcohol || 1;

  const alcoholPct = alcohol / total;
  const noAlcoholPct = noAlcohol / total;

  const centerX = canvas.width / 2;
  const centerY = 110;
  const radius = 70;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#ff7c7c";
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2 * alcoholPct);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.fillStyle = "#4f7cff";
  ctx.arc(
    centerX,
    centerY,
    radius,
    Math.PI * 2 * alcoholPct,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#e8eefc";
  ctx.font = "14px system-ui";
  ctx.fillText(
    `Alcohol ${(alcoholPct * 100).toFixed(0)}%`,
    centerX - 90,
    centerY + radius + 20
  );
  ctx.fillText(
    `Sin alcohol ${(noAlcoholPct * 100).toFixed(0)}%`,
    centerX + 10,
    centerY + radius + 20
  );
}

document.getElementById("recalcBtn").addEventListener("click", () => {
  if (!confirm("Esto vuelve a calcular y reinicia el checklist. ¿Seguimos?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

loadChecklist();