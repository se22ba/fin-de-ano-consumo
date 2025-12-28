const tokenInput = document.getElementById("token");
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const msg = document.getElementById("msg");
const exportLink = document.getElementById("exportLink");

const packagingEl = document.getElementById("packaging");
const sweetsEl = document.getElementById("sweets");
const responsesEl = document.getElementById("responses");

loadBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();

  if (!token) {
    msg.textContent = "Ingresá el admin token";
    msg.className = "small error";
    return;
  }

  // 👉 Guardamos token para checklist
  localStorage.setItem("ADMIN_TOKEN", token);

  msg.textContent = "Cargando...";
  msg.className = "small";

  try {
    const res = await fetch("/api/admin/summary", {
      headers: { "x-admin-token": token }
    });

    const data = await res.json();
    if (!data.ok) throw new Error("Unauthorized");

    renderSummary(data.summary);
    msg.textContent = "Resumen cargado correctamente";
    msg.className = "small success";

    if (exportLink) {
      exportLink.href = "/checklist.html";
    }
  } catch (e) {
    msg.textContent = "Token inválido o error de servidor";
    msg.className = "small error";
  }
});

clearBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("ADMIN_TOKEN");
  if (!token) return;

  if (!confirm("¿Seguro que querés borrar todas las respuestas?")) return;

  await fetch("/api/admin/clear", {
    method: "DELETE",
    headers: { "x-admin-token": token }
  });

  packagingEl.innerHTML = "";
  sweetsEl.innerHTML = "";
  responsesEl.innerHTML = "";
  msg.textContent = "Datos borrados";
  msg.className = "small success";
});

function renderSummary(summary) {
  packagingEl.innerHTML = `
    <table>
      <tr><th>Item</th><th>Cantidad</th></tr>
      ${summary.packaging.map(p =>
        `<tr><td>${p.item}</td><td>${p.buy}</td></tr>`
      ).join("")}
    </table>
  `;

  sweetsEl.innerHTML = `
    <table>
      <tr><th>Producto</th><th>Sugerido</th></tr>
      ${summary.sweetsSummary.map(s =>
        `<tr><td>${s.label}</td><td>${s.suggested}</td></tr>`
      ).join("")}
    </table>
  `;

  responsesEl.innerHTML = `
    <div class="badge">Respuestas: ${summary.count}</div>
    <div class="badge">Factor calor: ${summary.heatFactor}</div>
  `;
}