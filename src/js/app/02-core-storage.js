// ── Storage helpers ──────────────────────────────────────────────────────
// localStorage kept only for geocode cache (perf optimisation, not user data)
async function localGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
async function localSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}
// Legacy aliases so any remaining calls still work during transition
async function storageGet(key) {
  return localGet(key);
}
async function storageSet(key, value) {
  return localSet(key, value);
}

function initials(name) {
  if (!name || !name.trim()) return "?";
  const p = name.trim().split(/s+/);
  return (p[0][0] + (p.length > 1 ? p[1][0] : "")).toUpperCase();
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function escapeHtml(s) {
  return String(s != null ? s : "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function showToast(msg, type = "info") {
  let wrap = document.getElementById("cu-toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "cu-toast-wrap";
    wrap.className = "cu-toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className =
    "cu-toast" +
    (type === "error" ? " error" : type === "success" ? " success" : "");
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add("hiding");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  }, 3200);
}
function showConfirm(title, body, confirmLabel, dangerFnName) {
  const ov = document.createElement("div");
  ov.className = "cu-confirm-overlay";
  ov.setAttribute("id", "cu-confirm-overlay");
  ov.innerHTML = `<div class="cu-confirm-sheet" role="dialog" aria-modal="true"><div class="cu-confirm-title">${escapeHtml(title)}</div><div class="cu-confirm-body">${escapeHtml(body)}</div><div class="cu-confirm-actions"><button class="btn btn-cancel" onclick="document.getElementById('cu-confirm-overlay')?.remove()">Cancel</button><button class="btn" onclick="document.getElementById('cu-confirm-overlay')?.remove();window['${dangerFnName}'](true)">${escapeHtml(confirmLabel)}</button></div></div>`;
  document.body.appendChild(ov);
}
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

