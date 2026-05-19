// Конфиг видимости элементов UI — клон ConfigSettings из нативного DriveJ7.
// Сохраняется в localStorage под ключом 'config-v1', применяется к DOM при
// инициализации + при изменении в Settings.
//
// Нативные ключи (см. MainActivity.kt CFG_*) и их web-эквиваленты:
//   widgetDateTime → window.config.widgetDateTime  → #ov-datetime visibility
//   widgetOutdoorT → window.config.widgetOutdoorT  → #ov-outdoor visibility
//   twoZoneClimate → window.config.twoZoneClimate → правый T-stepper (passenger)
//   memorySlot2    → window.config.memorySlot2    → кнопка В2
//   memorySlot3    → window.config.memorySlot3    → кнопка В3

(() => {
  const STORAGE_KEY = 'config-v1';

  const DEFAULTS = {
    widgetDateTime: true,
    widgetOutdoorT: true,
    twoZoneClimate: true,
    memorySlot2: true,
    memorySlot3: true,
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return { ...DEFAULTS, ...obj };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.config));
  }

  /** Применить config к DOM — спрятать/показать виджеты и кнопки. */
  function apply() {
    const c = window.config;
    setVisible('ov-datetime', c.widgetDateTime);
    setVisible('ov-outdoor', c.widgetOutdoorT);
    setVisible('t-pass-stepper', c.twoZoneClimate);
    // В1/В2/В3 — В1 всегда видна (по умолчанию активная), В2/В3 опционально
    setVisible(null, c.memorySlot2, '[data-mem="2"]');
    setVisible(null, c.memorySlot3, '[data-mem="3"]');
  }

  function setVisible(id, visible, sel) {
    const el = id ? document.getElementById(id) : (sel ? document.querySelector(sel) : null);
    if (el) el.style.display = visible ? '' : 'none';
  }

  /** Установить значение и применить + сохранить. */
  function set(key, value) {
    if (!(key in DEFAULTS)) return;
    window.config[key] = value;
    apply();
    save();
  }

  window.config = load();
  window.configApi = { apply, set, DEFAULTS };

  // Apply на DOMContentLoaded чтобы элементы существовали.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
