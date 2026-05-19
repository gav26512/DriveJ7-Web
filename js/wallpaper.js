// Wallpaper: подтягивает 8 свежих Bing daily images, кеширует URL в localStorage.
// При первой загрузке выбирает случайную, кнопки "🖼" перебирают следующую,
// "⬛" ставит чёрный фон.
//
// На JCarTools хост может сам управлять фоном (передавать через getFile или
// API event). Тогда наша логика — это override (юзер явно нажал кнопку).

(() => {
  const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=ru-RU';
  const BING_BASE = 'https://www.bing.com';
  const CACHE_KEY = 'wallpaper-urls';
  const INDEX_KEY = 'wallpaper-index';
  const MODE_KEY  = 'wallpaper-mode';   // 'bing' / 'black'

  const wallpaperEl = document.getElementById('wallpaper');

  let urls = [];     // массив абсолютных URL'ов
  let idx = 0;

  function applyUrl(url) {
    if (!url) {
      wallpaperEl.style.backgroundImage = '';
      wallpaperEl.style.background = 'linear-gradient(135deg, #1a1c25 0%, #2d1f3a 50%, #1a2532 100%)';
      return;
    }
    wallpaperEl.style.background = '';
    wallpaperEl.style.backgroundImage = `url(${url})`;
  }

  function applyCurrent() {
    if (localStorage.getItem(MODE_KEY) === 'black') {
      wallpaperEl.style.backgroundImage = '';
      wallpaperEl.style.background = '#000';
      return;
    }
    applyUrl(urls[idx]);
  }

  /** Загрузить список из Bing API. CORS обычно открыт у bing.com. */
  async function fetchBing() {
    try {
      const r = await fetch(BING_API);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const list = (data.images || []).map((img) => {
        const u = img.url;
        return u.startsWith('http') ? u : BING_BASE + u;
      });
      if (list.length > 0) {
        urls = list;
        localStorage.setItem(CACHE_KEY, JSON.stringify(urls));
        console.info('[wallpaper] loaded', urls.length, 'images from Bing');
      }
    } catch (e) {
      console.warn('[wallpaper] Bing API fetch failed:', e.message);
    }
  }

  /** Перейти к следующему изображению (циклически). */
  function next() {
    if (urls.length === 0) return;
    idx = (idx + 1) % urls.length;
    localStorage.setItem(INDEX_KEY, String(idx));
    localStorage.setItem(MODE_KEY, 'bing');
    applyCurrent();
  }

  /** Чёрный фон. */
  function black() {
    localStorage.setItem(MODE_KEY, 'black');
    applyCurrent();
  }

  // ============================== Init
  // 1. Кэш из localStorage сразу — мгновенный фон при перезагрузке
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      urls = cached;
      idx = parseInt(localStorage.getItem(INDEX_KEY), 10) || 0;
      idx = Math.max(0, Math.min(urls.length - 1, idx));
    }
  } catch (e) {}

  applyCurrent();

  // 2. Свежий запрос к Bing (асинхронно, не блокирует UI). На JCarTools-хосте
  // тоже работает — у Android WebView CORS обычно отключён для нативных WebView'ов.
  fetchBing().then(() => {
    // Если ещё не показывали фон (urls был пустой) — применяем теперь.
    if (urls.length > 0 && !wallpaperEl.style.backgroundImage && localStorage.getItem(MODE_KEY) !== 'black') {
      applyCurrent();
    }
  });

  // 3. Кнопки в плеер-блоке
  document.getElementById('btn-bg-bing')?.addEventListener('click', next);
  document.getElementById('btn-bg-black')?.addEventListener('click', black);

  // 4. Long-press на самом фоне → чёрный (как было в нативном)
  let pressTimer = 0;
  wallpaperEl.addEventListener('pointerdown', () => {
    pressTimer = setTimeout(black, 700);
  });
  wallpaperEl.addEventListener('pointerup', () => clearTimeout(pressTimer));
  wallpaperEl.addEventListener('pointerleave', () => clearTimeout(pressTimer));
})();
