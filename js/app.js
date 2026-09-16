function renderTools(list) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty-state");
  grid.innerHTML = "";

  if (list.length === 0) {
    empty.classList.add("visible");
    return;
  }
  empty.classList.remove("visible");

  list.forEach((tool) => {
    const card = document.createElement("a");
    card.className = "card";
    card.href = tool.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `Abrir ${tool.name}`);

    const iconHtml = tool.icon
      ? `<div class="card-icon icon-img"><img src="${tool.icon}" alt="" loading="lazy" /></div>`
      : `<div class="card-icon icon-text" style="background:${tool.color}">${tool.initials}</div>`;

    card.innerHTML = `
      ${iconHtml}
      <div class="card-name">${tool.name}</div>
      <div class="card-desc">${tool.desc}</div>
    `;
    grid.appendChild(card);
  });
}

function setupSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    const filtered = TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.desc.toLowerCase().includes(term)
    );
    renderTools(filtered);
  });
}

function setupInstallPrompt() {
  const btn = document.getElementById("install-btn");
  const iosHint = document.getElementById("ios-hint");
  const genericHint = document.getElementById("generic-install-hint");
  let deferredPrompt = null;

  // Já instalado (rodando em modo standalone): não mostra nada.
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (isStandalone) return;

  const ua = window.navigator.userAgent;
  // iPadOS 13+ se identifica como "MacIntel" com suporte a touch.
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile =
    isIOS || /android/i.test(ua) || (navigator.maxTouchPoints > 0 && window.innerWidth < 900);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.classList.add("visible");
    genericHint.classList.remove("visible");
  });

  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.classList.remove("visible");
  });

  window.addEventListener("appinstalled", () => {
    btn.classList.remove("visible");
    genericHint.classList.remove("visible");
  });

  if (isIOS) {
    // iOS nunca dispara beforeinstallprompt: instrução manual é o único caminho.
    iosHint.classList.add("visible");
  } else if (isMobile) {
    // Android/outros: dá um tempo para o beforeinstallprompt disparar.
    // Se não disparar (heurística do navegador, engajamento, etc.), mostra instrução manual.
    setTimeout(() => {
      if (!deferredPrompt) {
        genericHint.classList.add("visible");
      }
    }, 2500);
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderTools(TOOLS);
  setupSearch();
  setupInstallPrompt();
  registerServiceWorker();
});
