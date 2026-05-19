// Profile loader. Выбирает активный профиль и применяет его конфиг к UI.
//
// Приоритет источников (по убыванию):
//   1. URL hash `#profile=j7` — dev/тестинг
//   2. localStorage 'profile' — user manual override через settings
//   3. getCarData() → определение по модели/VIN — нужен поддерживающий API
//   4. Эвристика по разрешению экрана: вертикальный → j7-like, горизонтальный → j8-like
//   5. Generic fallback
//
// Активный профиль экспонируется как `window.profile`. UI-модули должны читать
// `profile.widgets.<id>` для решения о показе виджета и `profile.hvac.<id>` для
// HVAC-кнопок.

(() => {
  const ALL_PROFILES = window.PROFILES || {};

  function fromHash() {
    const m = location.hash.match(/profile=([a-z0-9_-]+)/i);
    return m && ALL_PROFILES[m[1]] ? m[1] : null;
  }

  function fromStorage() {
    const id = localStorage.getItem('profile');
    return id && ALL_PROFILES[id] ? id : null;
  }

  function fromCarData() {
    const car = api.getCarData('all');
    // TODO: уточнить у автора JCarTools какое поле содержит модель/VIN.
    // Пока ищем common-варианты.
    const model = car?.vehicle?.model || car?.model || car?.vin || null;
    if (!model) return null;
    const m = String(model).toLowerCase();
    if (m.includes('j7') || m.includes('jaecoo j7')) return 'j7';
    if (m.includes('j8') || m.includes('jaecoo j8')) return 'j8';
    if (m.includes('tiggo 9') || m.includes('tiggo9')) return 'tiggo9';
    return null;
  }

  function fromOrientation() {
    // Эвристика: на portrait-устройствах предполагаем J7 (вертикальный планшет),
    // на landscape с QHD-плотностью — Tiggo 9, иначе J8.
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (h > w) return 'j7';
    // 2560×1440 → площадь >= 3.6M pixels, попадаем в Tiggo 9 диапазон.
    if (w * h >= 3_500_000) return 'tiggo9';
    return 'j8';
  }

  function chooseProfile() {
    const hash = fromHash();
    if (hash) { console.info(`[profile] from hash: ${hash}`); return hash; }
    const saved = fromStorage();
    if (saved) { console.info(`[profile] from storage: ${saved}`); return saved; }
    const detected = fromCarData();
    if (detected) { console.info(`[profile] from car data: ${detected}`); return detected; }
    const orient = fromOrientation();
    console.info(`[profile] from orientation: ${orient}`);
    return orient;
  }

  function apply(profile) {
    // Снимаем все profile-* классы и накладываем нужный.
    Array.from(document.body.classList)
      .filter((c) => c.startsWith('profile-'))
      .forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(profile.bodyClass);

    // layout='auto' → определяем по ориентации, иначе по явному значению.
    let layout = profile.layout;
    if (layout === 'auto') {
      layout = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    document.body.classList.remove('layout-portrait', 'layout-landscape');
    document.body.classList.add(`layout-${layout}`);
    document.body.dataset.profile = profile.id;
    document.body.dataset.layout = layout;

    // Применить cssVars из профиля (для high-DPI масштабирования и т.п.).
    if (profile.cssVars) {
      for (const [k, v] of Object.entries(profile.cssVars)) {
        document.documentElement.style.setProperty(k, v);
      }
    }
  }

  const chosenId = chooseProfile();
  const profile = ALL_PROFILES[chosenId] || ALL_PROFILES.generic;
  apply(profile);

  // Применить runtime visibility виджетов согласно профилю.
  function applyWidgetVisibility() {
    for (const [widget, visible] of Object.entries(profile.widgets || {})) {
      const el = document.querySelector(`[data-widget="${widget}"]`);
      if (el) el.style.display = visible ? '' : 'none';
    }
    // HVAC-кнопки: скрываем те что выключены в профиле
    for (const [hvac, visible] of Object.entries(profile.hvac || {})) {
      const el = document.querySelector(`[data-hvac="${hvac}"]`);
      if (el) el.style.display = visible ? '' : 'none';
    }
  }
  applyWidgetVisibility();

  // Перенаправление при ресайзе (если поворот экрана).
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (profile.layout === 'auto') apply(profile);
    }, 200);
  });

  window.profile = profile;
  console.info('[profile] active:', profile.id, profile.name);
})();
