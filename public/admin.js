const $ = (id) => document.getElementById(id);

function setMsg(text, kind = "small") {
  const el = $("msg");
  el.className = kind;
  el.textContent = text;
}

async function api(path, token, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "x-admin-token": token
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

function renderPackaging(summary) {
  const div = $("packaging");
  div.innerHTML = `
    <div class="small">
      <span class="badge">Respuestas: ${summary.count}</span>
      <span class="badge">Heat factor: ${summary.heatFactor}</span>
    </div>
    <table style="margin-top:10px">
      <thead><tr><th>Item</th><th>Compra sugerida</th></tr></thead>
      <tbody>
        ${summary.packaging.map((x) => `<tr><td>${x.item}</td><td>${x.buy}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="small" style="margin-top:10px;opacity:.85">
      Nota: son sugerencias “operables”; podés ajustar tamaños reales según marca (latas 473/500, botellas 2.25/3L, etc.).
    </div>
  `;
}

function renderSweets(summary) {
  const div = $("sweets");
  if (!summary.sweetsSummary.length) {
    div.innerHTML = `<div class="small">No hay selecciones de mesa dulce todavía.</div>`;
    return;
  }

  div.innerHTML = `
    <table>
      <thead><tr><th>Item</th><th>Estimado</th><th>Sugerido</th></tr></thead>
      <tbody>
        ${summary.sweetsSummary
          .map((s) => `<tr><td>${s.label}</td><td>${s.grams} g</td><td>${s.suggested}</td></tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function renderResponses(responses) {
  const div = $("responses");
  if (!responses.length) {
    div.innerHTML = `<div class="small">Todavía no respondió nadie. O están en “modo fantasma” 👻</div>`;
    return;
  }

  div.innerHTML = `
    <table>
      <thead><tr><th>Nombre</th><th>Grupo</th><th>Selecciones</th><th>Actualizado</th></tr></thead>
      <tbody>
        ${responses
          .map((r) => `
            <tr>
              <td>${escapeHtml(r.name)}</td>
              <td><span class="badge">${r.ageGroup}</span></td>
              <td class="small">${(r.selections || []).map(escapeHtml).join(", ")}</td>
              <td class="small">${new Date(r.updatedAt).toLocaleString()}</td>
            </tr>
          `)
          .join("")}
      </tbody>
    </table>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

async function loadAll() {
  const token = $("token").value.trim();
  if (!token) return setMsg("Poné el token de admin.", "small error");

  setMsg("Cargando...", "small");

  try {
    const summaryData = await api("/api/admin/summary", token);
    const respData = await api("/api/admin/responses", token);

    renderPackaging(summaryData.summary);
    renderSweets(summaryData.summary);
    renderResponses(respData.data);

    setMsg("✅ OK", "small success");
  } catch (e) {
    setMsg("Error: " + e.message, "small error");
  }
  const exportLink = document.getElementById("exportLink");
if (exportLink) {
  exportLink.href = "/api/admin/export/html";
}
}

async function clearAll() {
  const token = $("token").value.trim();
  if (!token) return setMsg("Poné el token de admin.", "small error");

  if (!confirm("¿Borrar TODAS las respuestas?")) return;

  try {
    await api("/api/admin/clear", token, { method: "DELETE" });
    $("packaging").innerHTML = "";
    $("sweets").innerHTML = "";
    $("responses").innerHTML = "";
    setMsg("🧹 Borrado. Arrancamos de cero.", "small success");
  } catch (e) {
    setMsg("Error: " + e.message, "small error");
  }
}

$("loadBtn").addEventListener("click", loadAll);
$("clearBtn").addEventListener("click", clearAll);