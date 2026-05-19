// Climate strip — клон нативного HVAC-управления. 12 кнопок в 2×6 сетке +
// T-степперы по краям + Fan-bar 0..10 + M1/M2/M3 памяти.
//
// Кнопки рендерятся ИЗ JS (не хардкодом в HTML) — это позволяет:
//   - drag-n-drop перестановку с сохранением порядка в localStorage 'hvac-order'
//   - перекрашивание иконок через CSS mask-image (icon одного цвета с border)
//   - условный disable если команда не в getRunEnum()

(() => {
  // ============================== BUTTONS: декларация всех 12 HVAC кнопок
  // type: 'toggle' — on/off булевое состояние; 'level' — cycle 0..3
  // stateKey: ключ в `state` объекте откуда читать состояние для render'а
  // icon: data-icon атрибут для CSS-маски; text: текст вместо иконки (для AC)
  // badge: бейдж в углу (например "З" для задних сидений)

  // Имена runEnum-команд взяты из реализации StreletS27 (репо JCarTools/StreletS27/js/climate.js):
  //   - Toggle: cmd.on/cmd.off (binary)
  //   - Level (0..3): cmd.base + '_' + level (1/2/3), cmd.off (=0)
  //
  // AUTO/AC/Fan/T_driver/T_passenger в StreletS27 не задокументированы —
  // оставляем placeholder-имена с TODO, конкретные нужно уточнить у автора JCarTools.

  const BUTTONS = [
    // AUTO — только включает. Выключение приходит через climateState event
    // (когда юзер вручную крутит T/Fan, ECU выключает AUTO сам). См. native
    // MainActivity.kt: `if (autoOn) return@ClimateToggle`.
    { id: 'auto',          type: 'toggle', stateKey: 'auto',          icon: 'auto',          cmd: { on: 'AUTO_On',           off: 'AUTO_Off' },           title: 'Авто', onlyOn: true },
    { id: 'recirc',        type: 'toggle', stateKey: 'recirc',        icon: 'recirc',        cmd: { on: 'Recirculation_On',  off: 'Recirculation_Off' },  title: 'Рециркуляция' },
    { id: 'ac',            type: 'toggle', stateKey: 'ac',            text: 'AC',            cmd: { on: 'AC_On',             off: 'AC_Off' },             title: 'A/C' },
    { id: 'front_defrost', type: 'toggle', stateKey: 'front_defrost', icon: 'glass_front',   cmd: { on: 'heat_windshield_on', off: 'heat_windshield_off' }, title: 'Лоб. стекло' },
    { id: 'rear_defrost',  type: 'toggle', stateKey: 'rear_defrost',  icon: 'glass_rear',    cmd: { on: 'heat_rearwindow_on', off: 'heat_rearwindow_off' }, title: 'Зад. стекло' },
    { id: 'steering_heat', type: 'toggle', stateKey: 'steering_heat', icon: 'steer',         cmd: { on: 'heat_wheel_on',     off: 'heat_wheel_off' },     title: 'Подогрев руля' },
    { id: 'seat_drv',      type: 'level',  stateKey: 'seats.drv',     icon: 'seat_heat_drv', cmd: { base: 'heat_seat_l',     off: 'heat_seat_l_0' },     title: 'Подогрев водителя' },
    { id: 'seat_pass',     type: 'level',  stateKey: 'seats.pass',    icon: 'seat_heat_pass',cmd: { base: 'heat_seat_r',     off: 'heat_seat_r_0' },     title: 'Подогрев пассажира' },
    { id: 'seat_rl',       type: 'level',  stateKey: 'seats.rl',      icon: 'seat_heat_drv', cmd: { base: 'heat_zad_seat_l', off: 'heat_zad_seat_l_0' }, title: 'Подогрев заднего левого', badge: 'З' },
    { id: 'seat_rr',       type: 'level',  stateKey: 'seats.rr',      icon: 'seat_heat_pass',cmd: { base: 'heat_zad_seat_r', off: 'heat_zad_seat_r_off' }, title: 'Подогрев заднего правого', badge: 'З' },
    { id: 'vent_drv',      type: 'level',  stateKey: 'vents.drv',     icon: 'seat_vent_drv', cmd: { base: 'vent_seat_l',     off: 'vent_seat_l_0' },     title: 'Обдув водителя' },
    { id: 'vent_pass',     type: 'level',  stateKey: 'vents.pass',    icon: 'seat_vent_pass',cmd: { base: 'vent_seat_r',     off: 'vent_seat_r_0' },     title: 'Обдув пассажира' },
  ];

  // Step-команды (T water/passenger/fan up/down) — не в DnD grid, в T-stepper'ах и Fan-bar.
  // TODO: точные имена для T+/-/Fan+/- уточнить у автора JCarTools — в StreletS27 не нашли.
  const STEP_CMDS = {
    driver_up:     'temp_driver_up',
    driver_down:   'temp_driver_down',
    passenger_up:  'temp_passenger_up',
    passenger_down:'temp_passenger_down',
    fan_up:        'fan_up',
    fan_down:      'fan_down',
    mem_1:         'voditel_seat_1',   // подтверждено в StreletS27
    mem_2:         'voditel_seat_2',
    mem_3:         'voditel_seat_3',
  };

  // ============================== State (optimistic UI)
  const state = {
    tDriver: 7,
    tPassenger: 7,
    fan: 0,
    auto: false,
    recirc: false,
    ac: false,
    front_defrost: false,
    rear_defrost: false,
    steering_heat: false,
    seats: { drv: 0, pass: 0, rl: 0, rr: 0 },
    vents: { drv: 0, pass: 0 },
    mem: 1,
  };

  function readState(stateKey) {
    const parts = stateKey.split('.');
    let val = state;
    for (const p of parts) val = val?.[p];
    return val;
  }

  function writeState(stateKey, value) {
    const parts = stateKey.split('.');
    let obj = state;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
  }

  // ============================== Available cmds
  let availableCmds = new Set();
  function loadAvailable() {
    const enums = api.getRunEnum();
    availableCmds = new Set(Array.isArray(enums) ? enums : []);
  }

  function runIfAvailable(cmdName) {
    if (!cmdName) return;
    if (availableCmds.size > 0 && !availableCmds.has(cmdName)) {
      console.warn(`[climate] ${cmdName} not available`);
      return;
    }
    api.runEnum(cmdName);
  }

  /**
   * Вычисляет имя runEnum-команды по button-def и новому состоянию.
   * - Toggle (cmd={on, off}): `cmd.on` если newState=true, иначе `cmd.off`.
   * - Level (cmd={base, off}): `cmd.off` если newLevel=0, иначе `cmd.base_<level>`.
   * @returns {string|null}
   */
  function resolveCmd(def, newValue) {
    const c = def.cmd;
    if (!c) return null;
    if (def.type === 'toggle') {
      return newValue ? c.on : c.off;
    }
    if (def.type === 'level') {
      return newValue === 0 ? c.off : `${c.base}_${newValue}`;
    }
    return null;
  }

  // ============================== Order storage
  const ORDER_KEY = 'hvac-order';

  function loadOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      if (!raw) return BUTTONS.map((b) => b.id);
      const arr = JSON.parse(raw);
      // Валидация: все id должны быть в BUTTONS, отсутствующие добавляем в конец.
      const validIds = new Set(BUTTONS.map((b) => b.id));
      const saved = arr.filter((id) => validIds.has(id));
      const missing = BUTTONS.filter((b) => !saved.includes(b.id)).map((b) => b.id);
      return [...saved, ...missing];
    } catch (e) {
      return BUTTONS.map((b) => b.id);
    }
  }

  function saveOrder(ids) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
  }

  // ============================== Render
  const gridEl = document.getElementById('hvac-grid');

  function renderGrid() {
    const order = loadOrder();
    gridEl.innerHTML = '';
    for (const id of order) {
      const def = BUTTONS.find((b) => b.id === id);
      if (!def) continue;
      gridEl.appendChild(renderButton(def));
    }
    updateAllVisuals();
  }

  function renderButton(def) {
    const btn = document.createElement('button');
    btn.className = 'hvac-btn';
    btn.dataset.dndId = def.id;
    btn.dataset.btnId = def.id;
    btn.title = def.title;

    if (def.icon) {
      const icon = document.createElement('div');
      icon.className = 'hvac-icon';
      icon.dataset.icon = def.icon;
      btn.appendChild(icon);
    }
    if (def.text) {
      const text = document.createElement('span');
      text.className = 'hvac-text';
      text.textContent = def.text;
      btn.appendChild(text);
    }
    if (def.badge) {
      const badge = document.createElement('span');
      badge.className = 'seat-badge';
      badge.textContent = def.badge;
      btn.appendChild(badge);
    }
    if (def.type === 'level') {
      const dots = document.createElement('div');
      dots.className = 'level-dots';
      dots.dataset.level = '0';
      for (let i = 0; i < 3; i++) dots.appendChild(document.createElement('span'));
      btn.appendChild(dots);
    }
    // Дизейбл если ни одна из cmd-вариаций кнопки не в availableCmds.
    // В browser stub режиме (api.isHost=false) НЕ дизейблим — stub возвращает
    // ограниченный список, реальный хост даст полный набор.
    if (api.isHost && availableCmds.size > 0 && def.cmd) {
      const allCmds = def.type === 'toggle'
        ? [def.cmd.on, def.cmd.off]
        : [def.cmd.off, `${def.cmd.base}_1`, `${def.cmd.base}_2`, `${def.cmd.base}_3`];
      if (!allCmds.some((c) => availableCmds.has(c))) {
        btn.classList.add('disabled');
      }
    }
    btn.addEventListener('click', () => onClick(def, btn));
    return btn;
  }

  function onClick(def, btn) {
    if (btn.classList.contains('disabled')) return;
    let newValue;
    if (def.type === 'toggle') {
      const cur = readState(def.stateKey);
      // `onlyOn`-кнопки (AUTO) при повторном клике остаются включёнными.
      // Выключение приходит исключительно через climateState event от хоста.
      if (def.onlyOn && cur) return;
      newValue = !cur;
      writeState(def.stateKey, newValue);
    } else if (def.type === 'level') {
      const cur = readState(def.stateKey);
      newValue = (cur + 1) % 4;
      writeState(def.stateKey, newValue);
    }
    updateButtonVisual(btn, def);
    runIfAvailable(resolveCmd(def, newValue));
  }

  function updateButtonVisual(btn, def) {
    if (def.type === 'toggle') {
      btn.classList.toggle('active', !!readState(def.stateKey));
    } else if (def.type === 'level') {
      const lvl = readState(def.stateKey) || 0;
      btn.classList.toggle('active', lvl > 0);
      const dots = btn.querySelector('.level-dots');
      if (dots) dots.dataset.level = String(lvl);
    }
  }

  function updateAllVisuals() {
    for (const btn of gridEl.querySelectorAll('.hvac-btn')) {
      const def = BUTTONS.find((b) => b.id === btn.dataset.btnId);
      if (def) updateButtonVisual(btn, def);
    }
    document.getElementById('t-driver-value').textContent = tDisplay(state.tDriver);
    document.getElementById('t-passenger-value').textContent = tDisplay(state.tPassenger);
    document.getElementById('fan-segments').dataset.level = String(state.fan);
    for (const btn of document.querySelectorAll('[data-mem]')) {
      btn.classList.toggle('active', Number(btn.dataset.mem) === state.mem);
    }
  }

  // T helper: 0=LO, 1..16=16..31°C, 17=HI
  function tDisplay(v) {
    if (v <= 0) return 'LO';
    if (v >= 17) return 'HI';
    return `${15 + v}°`;
  }

  // ============================== T / Fan step handlers (вне DnD)
  document.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.step;
      switch (key) {
        case 'driver_up':    state.tDriver = Math.min(17, state.tDriver + 1); break;
        case 'driver_down':  state.tDriver = Math.max(0,  state.tDriver - 1); break;
        case 'passenger_up':   state.tPassenger = Math.min(17, state.tPassenger + 1); break;
        case 'passenger_down': state.tPassenger = Math.max(0,  state.tPassenger - 1); break;
        case 'fan_up':   state.fan = Math.min(10, state.fan + 1); break;
        case 'fan_down': state.fan = Math.max(0,  state.fan - 1); break;
      }
      updateAllVisuals();
      runIfAvailable(STEP_CMDS[key]);
    });
  });

  // Fan segments — тап по конкретному сегменту = установить fan на этот уровень.
  // Уровни 1..10 (индекс span'а + 1). Имя команды: `fan_<N>` (placeholder, как у seat heat).
  const fanSegments = document.querySelectorAll('#fan-segments span');
  fanSegments.forEach((seg, idx) => {
    seg.style.cursor = 'pointer';
    seg.addEventListener('click', () => {
      const level = idx + 1;
      state.fan = level;
      updateAllVisuals();
      runIfAvailable(`fan_${level}`);
    });
  });

  // M-memory
  document.querySelectorAll('[data-mem]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mem = Number(btn.dataset.mem);
      updateAllVisuals();
      runIfAvailable(STEP_CMDS[`mem_${btn.dataset.mem}`]);
    });
  });

  // Config (⚙) — открыть settings
  document.getElementById('btn-config')?.addEventListener('click', () => {
    document.getElementById('settings-overlay')?.classList.remove('hidden');
  });

  // ============================== Sync from getCarData (полное чтение)
  // Тянем состояния всех контролов из системы. Если хост даёт climateState event —
  // см. ниже подписку, обновления приходят push'ем. Poll каждые 2 сек как
  // fallback на случай если event не пришёл.
  function syncFromCarData() {
    const heat = api.getCarData('heat');
    if (heat) {
      if (typeof heat.driverTemp === 'number') {
        state.tDriver = Math.max(0, Math.min(17, heat.driverTemp - 15));
      }
      if (typeof heat.passengerTemp === 'number') {
        state.tPassenger = Math.max(0, Math.min(17, heat.passengerTemp - 15));
      }
      state.front_defrost = !!heat.lobHeat;
      state.rear_defrost = !!heat.zadHeat;
      state.steering_heat = !!heat.rulHeat;
    }
    const seats = api.getCarData('seats');
    if (seats) {
      state.seats.drv = Number(seats.front?.driverHeat) || 0;
      state.seats.pass = Number(seats.front?.passengerHeat) || 0;
      state.seats.rl = Number(seats.rear?.leftHeat) || 0;
      state.seats.rr = Number(seats.rear?.rightHeat) || 0;
      state.vents.drv = Number(seats.front?.driverVent) || 0;
      state.vents.pass = Number(seats.front?.passengerVent) || 0;
    }
    // Vehicle: auto/ac/recirc/fan/mem. В core_manifest эти поля не задокументированы,
    // но в нашем stub лежат там; если реальный JCarTools отдаёт их в vehicle — тоже подхватим.
    const vehicle = api.getCarData('vehicle');
    if (vehicle) {
      if (typeof vehicle.auto !== 'undefined')     state.auto    = !!vehicle.auto;
      if (typeof vehicle.ac !== 'undefined')       state.ac      = !!vehicle.ac;
      if (typeof vehicle.recirc !== 'undefined')   state.recirc  = !!vehicle.recirc;
      if (typeof vehicle.fan === 'number')         state.fan     = Math.max(0, Math.min(10, vehicle.fan));
      if (typeof vehicle.memorySlot === 'number')  state.mem     = vehicle.memorySlot;
    }
    updateAllVisuals();
  }

  /**
   * Push-обновление: хост шлёт event 'climateState' когда что-то меняется
   * (физ.кнопки, штатная шторка, AUTO регулирование). Тот же объект что вернул бы
   * getCarData('all') — обновляем стейт и UI мгновенно.
   *
   * В StreletS27 эта подписка используется тем же паттерном — каждый модуль
   * слушает свой кусок состояния.
   */
  api.on('climateState', () => {
    syncFromCarData();
  });
  api.on('seats', () => syncFromCarData());
  api.on('heat', () => syncFromCarData());

  // ============================== Init
  loadAvailable();
  renderGrid();
  syncFromCarData();
  setInterval(syncFromCarData, 2000);

  // Подключаем DnD к hvac-grid.
  console.log('[climate] init: gridEl =', gridEl, ', children =', gridEl?.children.length, ', window.dnd =', typeof window.dnd);
  if (window.dnd && gridEl) {
    window.dnd.enable(gridEl, {
      onReorder: (ids) => {
        saveOrder(ids);
        console.info('[climate] reordered:', ids.join(','));
      },
    });
    console.log('[climate] DnD enabled on', gridEl.children.length, 'buttons');
  } else {
    console.error('[climate] DnD NOT enabled: dnd=', !!window.dnd, ' gridEl=', !!gridEl);
  }
})();
