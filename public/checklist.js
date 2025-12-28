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

const ADMIN_TOKEN = localStorage.getItem("ADMIN_TOKEN");

if (!ADMIN_TOKEN) {
  alert("Acceso admin requerido");
  location.href = "/admin.html";
}

let checklist = [];
let totalsCache = null;

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ checklist, totals: totalsCache })
  );
}

async function loadChecklist() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      // ✅ VALIDACIÓN REAL
      if (
        Array.isArray(parsed.checklist) &&
        parsed.checklist.length > 0 &&
        parsed.totals
      ) {
        checklist = parsed.checklist;
        totalsCache = parsed.totals;
        renderAll();
        return;
      }
    } catch (e) {
      // si falla el parse, seguimos normal
    }
  }

  // 👉 SI NO HAY DATA VÁLIDA, PEDIMOS AL BACKEND
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

function renderAll() {
  renderList();
  renderProgress();
  renderChart(totalsCache);
}

function renderList() {
  listEl.innerHTML = "";
  const grouped = {};

  checklist.forEach(item => {
    const aisle = AISLES[item.label] || "Otros";
    (grouped[aisle] ||= []).push(item);
  });

  Object.keys(grouped).forEach(aisle => {
    const h = document.createElement("h4");
    h.textContent = aisle;
    listEl.appendChild(h);

    grouped[aisle].forEach(item => {
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

      div.querySelector("input").addEventListener("change", e => {
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
  const percent = total ? Math.round(done / total * 100) : 0;

  progressBar.style.width = percent + "%";
  progressText.textContent = `${percent}% completo (${done}/${total})`;
}

function renderChart(totals) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

 const alcohol =
  (totals.beer_blonde_l || 0) +
  (totals.beer_dark_l || 0) +
  (totals.sidra_l || 0) +
  (totals.anana_fizz_l || 0) +
  ((totals.fernet_ml || 0) / 1000);

  const noAlcohol =
    (totals.coke_l || 0) +
    (totals.pomelo_l || 0) +
    (totals.water_l || 0) +
    (totals.sidra_na_l || 0);

  const total = alcohol + noAlcohol || 1;

  const alcoholPct = alcohol / total;
  const noAlcoholPct = noAlcohol / total;

  // ===== PIE =====
  const cx = canvas.width / 2;
  const cy = 90;
  const r = 60;

  // Alcohol
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.fillStyle = "#ff7c7c";
  ctx.arc(cx, cy, r, 0, Math.PI * 2 * alcoholPct);
  ctx.fill();

  // Sin alcohol
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.fillStyle = "#4f7cff";
  ctx.arc(
    cx,
    cy,
    r,
    Math.PI * 2 * alcoholPct,
    Math.PI * 2
  );
  ctx.fill();

  // ===== TEXTO CENTRAL =====
  ctx.fillStyle = "#e8eefc";
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(
    `${Math.round(alcoholPct * 100)}%`,
    cx,
    cy + 5
  );

  // ===== LEYENDA (HTML) =====
  let legend = document.getElementById("chartLegend");
  if (!legend) {
    legend = document.createElement("div");
    legend.id = "chartLegend";
    legend.style.display = "grid";
    legend.style.gridTemplateColumns = "1fr 1fr";
    legend.style.gap = "8px";
    legend.style.marginTop = "12px";
    legend.style.fontSize = "14px";
    canvas.parentElement.appendChild(legend);
  }

  legend.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:14px;height:14px;border-radius:50%;background:#ff7c7c"></span>
      <strong>Alcohol</strong> ${Math.round(alcoholPct * 100)}%
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:14px;height:14px;border-radius:50%;background:#4f7cff"></span>
      <strong>Sin alcohol</strong> ${Math.round(noAlcoholPct * 100)}%
    </div>
  `;
}

document.getElementById("recalcBtn").addEventListener("click", () => {
  if (!confirm("Esto reinicia el checklist. ¿Seguimos?")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

loadChecklist();