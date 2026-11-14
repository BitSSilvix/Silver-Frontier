const tauri = window.__TAURI__;
const invoke = tauri?.core?.invoke || tauri?.invoke;

async function openNativePage(targetUrl) {
  const anchor = document.getElementById("viewport-anchor");
  if (!anchor || !invoke) return;

  const rect = anchor.getBoundingClientRect();

  try {
    await invoke("create_web_view", {
      url: targetUrl,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  } catch (err) {
    console.error("Ошибка Rust при открытии сайта:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. ЖЕЛЕЗОБЕТОННЫЕ КНОПКИ ОКНА
  const btnMin = document.getElementById("win-min");
  const btnMax = document.getElementById("win-max");
  const btnClose = document.getElementById("win-close");

  if (btnMin) {
    btnMin.addEventListener("click", (e) => {
      e.stopPropagation();
      invoke("win_minimize");
    });
  }

  if (btnMax) {
    btnMax.addEventListener("click", (e) => {
      e.stopPropagation();
      invoke("win_toggle_maximize");
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", (e) => {
      e.stopPropagation();
      invoke("win_close");
    });
  }

  // 2. ОМНИБОКС И НАВИГАЦИЯ
  const urlInput = document.getElementById("url-input");
  const btnGo = document.getElementById("btn-go");

  function navigate() {
    if (!urlInput) return;
    let query = urlInput.value.trim();
    if (!query) return;

    let targetUrl = query;
    if (query.includes(".") && !query.includes(" ")) {
      if (!/^https?:\/\//i.test(query)) {
        targetUrl = "https://" + query;
      }
    } else {
      targetUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
    }
    openNativePage(targetUrl);
  }

  btnGo?.addEventListener("click", navigate);
  urlInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") navigate();
  });
  urlInput?.addEventListener("focus", () => urlInput.select());

  // 3. АВТОЗАПУСК ПРИ СТАРТЕ
  setTimeout(() => {
    openNativePage("https://www.google.com");
  }, 150);

  const anchor = document.getElementById("viewport-anchor");
  if (anchor) {
    const resizeObserver = new ResizeObserver(() => {
      // Как только размер окна меняется, замеряем новые координаты
      const rect = anchor.getBoundingClientRect();
      
      // И отправляем их в Rust обновлять границы вьюпорта на лету!
      invoke("update_webview_bounds", {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }).catch(err => console.error("Ошибка ресайза:", err));
    });
    
    // Запускаем слежку за нашим якорем
    resizeObserver.observe(anchor);
  }
});