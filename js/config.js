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
    // Плавающие виджеты
    widgetWifi:     false,   // нет API в core_manifest пока
    widgetDateTime: true,
    widgetOutdoorT: true,
    // Кнопки климата
    twoZoneClimate: true,
    auto:           true,
    recirc:         true,
    frontGlass:     true,
    rearGlass:      true,
    steerHeat:      true,
    rearSeat:       true,    // задние сиденья (подогрев)
    seatVentDrv:    true,
    seatVentPass:   true,
    // Память сидений
    memorySlot1:    true,
    memorySlot2:    true,
    memorySlot3:    true,
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
    // Плавающие виджеты
    bySel('#ov-datetime',                       c.widgetDateTime);
    bySel('#ov-outdoor',                        c.widgetOutdoorT);
    bySel('#ov-wifi',                           c.widgetWifi);

    // Климат
    bySel('#t-pass-stepper',                    c.twoZoneClimate);
    bySel('[data-btn-id="auto"]',               c.auto);
    bySel('[data-btn-id="recirc"]',             c.recirc);
    bySel('[data-btn-id="front_defrost"]',      c.frontGlass);
    bySel('[data-btn-id="rear_defrost"]',       c.rearGlass);
    bySel('[data-btn-id="steering_heat"]',      c.steerHeat);
    // Задние сиденья — пара (RL + RR)
    bySel('[data-btn-id="seat_rl"]',            c.rearSeat);
    bySel('[data-btn-id="seat_rr"]',            c.rearSeat);
    bySel('[data-btn-id="vent_drv"]',           c.seatVentDrv);
    bySel('[data-btn-id="vent_pass"]',          c.seatVentPass);

    // Память сидений
    bySel('[data-mem="1"]',                     c.memorySlot1);
    bySel('[data-mem="2"]',                     c.memorySlot2);
    bySel('[data-mem="3"]',                     c.memorySlot3);
  }

  function bySel(sel, visible) {
    const el = document.querySelector(sel);
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

  // Применяем accent сразу при загрузке (до settings.js), иначе на 100-200ms
  // мелькает default цвет.
  try {
    const accent = localStorage.getItem('accent-color');
    if (accent && accent !== 'auto') {
      document.documentElement.style.setProperty('--accent', accent);
    }
  } catch (e) {}

  // Apply на DOMContentLoaded чтобы элементы существовали.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
