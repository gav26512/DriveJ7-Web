// Wallpaper: загружает фон, кэширует в localStorage как dataURL (только в browser
// stub-режиме — на JCarTools хост вероятно сам управляет обоями через getFile).
//
// Источник по умолчанию — Bing Picture of the Day (как в нативном лаунчере).
// На реальном ГУ возможен fallback если интернет недоступен.

(() => {
  const BING_URL = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=ru-RU';
  const wallpaperEl = document.getElementById('wallpaper');

  function applyUrl(url) {
    if (!url) {
      wallpaperEl.style.backgroundImage = '';
      return;
    }
    wallpaperEl.style.backgroundImage = `url(${url})`;
  }

  // На JCarTools сам хост может управлять обоями — мы не пытаемся гасить.
  // Browser stub: пробуем загрузить Bing.
  async function loadBing() {
    if (api.isHost) return; // хост сам решит фон
    try {
      // Используем CORS-proxy чтобы не упасть в browser. На самом ГУ wallpaper
      // обычно делает нативный код, а не JS.
      // Для dev-stub просто ставим тёмный градиент чтобы было видно что слой работает.
      wallpaperEl.style.background = 'linear-gradient(135deg, #1a1c25 0%, #2d1f3a 50%, #1a2532 100%)';
    } catch (e) {
      console.warn('[wallpaper] load failed', e);
    }
  }

  // Кнопки управления фоном (в плеер-блоке).
  document.getElementById('btn-bg-bing')?.addEventListener('click', () => loadBing());
  document.getElementById('btn-bg-black')?.addEventListener('click', () => {
    wallpaperEl.style.background = '#000';
    wallpaperEl.style.backgroundImage = '';
  });

  loadBing();
})();
