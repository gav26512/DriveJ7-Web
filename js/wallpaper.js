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

  // Dev-фолбэк: десктоп Chrome не получает CORS-headers от Bing API, fetch падает.
  // Сами картинки (CDN) грузятся через background-image без CORS — поэтому
  // достаточно захардкодить актуальные URL'ы. На ГУ Android WebView CORS не
  // применяет, fetchBing работает, этот список не используется.
  // Обновлять раз в несколько месяцев когда Bing CDN перестанет отдавать.
  const FALLBACK_URLS = [
    'https://www.bing.com/th?id=OHR.BumbleBee_ROW7621208242_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.SpainLighthouse_ROW0931685772_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.NPFortnight2026_ROW9483729156_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.ShenandoahSunset_ROW7042145908_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.SmithRockPark_ROW6845039893_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.EndangeredWhales_ROW6081633589_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.Pitigliano_ROW4097720054_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
    'https://www.bing.com/th?id=OHR.AlabamaHills_ROW6449052938_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp',
  ];

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
    // Кавычки внутри url() — иначе амперсанды в Bing URL ломают CSS-парсер.
    wallpaperEl.style.backgroundImage = `url("${url}")`;
  }

  function applyCurrent() {
    if (localStorage.getItem(MODE_KEY) === 'black') {
      wallpaperEl.style.backgroundImage = '';
      wallpaperEl.style.background = '#000';
      return;
    }
    applyUrl(urls[idx]);
  }

  /** Загрузить список из Bing API. На ГУ WebView CORS не применяется и работает;
   *  в десктопном Chrome CORS блокирует — переключаемся на FALLBACK_URLS. */
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
      console.warn('[wallpaper] Bing API fetch failed (CORS в браузере — норма для dev):', e.message);
      if (urls.length === 0) {
        urls = FALLBACK_URLS.slice();
        localStorage.setItem(CACHE_KEY, JSON.stringify(urls));
        console.info('[wallpaper] using dev fallback list, n=', urls.length);
      }
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

  // 2. Свежий запрос к Bing (асинхронно, не блокирует UI). В браузере CORS
  // блокирует, fetchBing внутри переключится на FALLBACK_URLS. После — всегда
  // переприменяем (кроме black-mode), даже если в DOM уже стоит градиент:
  // style.background мог затереть backgroundImage и проверка по нему ненадёжна.
  fetchBing().then(() => {
    if (urls.length > 0 && localStorage.getItem(MODE_KEY) !== 'black') {
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
