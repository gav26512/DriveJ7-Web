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

  const BUTTONS = [
    { id: 'auto',          type: 'toggle', stateKey: 'auto',          icon: 'auto',          cmd: 'HVAC_AUTO_TOGGLE',          title: 'Авто' },
    { id: 'recirc',        type: 'toggle', stateKey: 'recirc',        icon: 'recirc',        cmd: 'HVAC_RECIRC_TOGGLE',        title: 'Рециркуляция' },
    { id: 'ac',            type: 'toggle', stateKey: 'ac',            text: 'AC',            cmd: 'HVAC_AC_TOGGLE',            title: 'A/C' },
    { id: 'front_defrost', type: 'toggle', stateKey: 'front_defrost', icon: 'glass_front',   cmd: 'HVAC_FRONT_DEFROST_TOGGLE', title: 'Лоб. стекло' },
    { id: 'rear_defrost',  type: 'toggle', stateKey: 'rear_defrost',  icon: 'glass_rear',    cmd: 'HVAC_REAR_DEFROST_TOGGLE',  title: 'Зад. стекло' },
    { id: 'steering_heat', type: 'toggle', stateKey: 'steering_heat', icon: 'steer',         cmd: 'HVAC_STEERING_HEAT_TOGGLE', title: 'Подогрев руля' },
    { id: 'seat_drv',      type: 'level',  stateKey: 'seats.drv',     icon: 'seat_heat_drv', cmd: 'HVAC_SEAT_DRIVER_HEAT_CYCLE',  title: 'Подогрев водителя' },
    { id: 'seat_pass',     type: 'level',  stateKey: 'seats.pass',    icon: 'seat_heat_pass',cmd: 'HVAC_SEAT_PASSENGER_HEAT_CYCLE', title: 'Подогрев пассажира' },
    { id: 'seat_rl',       type: 'level',  stateKey: 'seats.rl',      icon: 'seat_heat_drv', cmd: 'HVAC_SEAT_REAR_LEFT_HEAT_CYCLE',  title: 'Подогрев заднего левого', badge: 'З' },
    { id: 'seat_rr',       type: 'level',  stateKey: 'seats.rr',      icon: 'seat_heat_pass',cmd: 'HVAC_SEAT_REAR_RIGHT_HEAT_CYCLE', title: 'Подогрев заднего правого', badge: 'З' },
    { id: 'vent_drv',      type: 'level',  stateKey: 'vents.drv',     icon: 'seat_vent_drv', cmd: 'HVAC_SEAT_DRIVER_VENT_CYCLE',  title: 'Обдув водителя' },
    { id: 'vent_pass',     type: 'level',  stateKey: 'vents.pass',    icon: 'seat_vent_pass',cmd: 'HVAC_SEAT_PASSENGER_VENT_CYCLE', title: 'Обдув пассажира' },
  ];

  // Step-команды (T water/passenger/fan up/down) — не в DnD grid, в T-stepper'ах и Fan-bar.
  const STEP_CMDS = {
    driver_up:     'HVAC_TEMP_DRIVER_UP',
    driver_down:   'HVAC_TEMP_DRIVER_DOWN',
    passenger_up:  'HVAC_TEMP_PASSENGER_UP',
    passenger_down:'HVAC_TEMP_PASSENGER_DOWN',
    fan_up:        'HVAC_FAN_UP',
    fan_down:      'HVAC_FAN_DOWN',
    mem_1:         'SEAT_MEMORY_RECALL_1',
    mem_2:         'SEAT_MEMORY_RECALL_2',
    mem_3:         'SEAT_MEMORY_RECALL_3',
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
    // Дизейбл если команда не доступна.
    if (availableCmds.size > 0 && def.cmd && !availableCmds.has(def.cmd)) {
      btn.classList.add('disabled');
    }
    btn.addEventListener('click', () => onClick(def, btn));
    return btn;
  }

  function onClick(def, btn) {
    if (btn.classList.contains('disabled')) return;
    if (def.type === 'toggle') {
      const cur = readState(def.stateKey);
      writeState(def.stateKey, !cur);
      updateButtonVisual(btn, def);
    } else if (def.type === 'level') {
      const cur = readState(def.stateKey);
      const next = (cur + 1) % 4;
      writeState(def.stateKey, next);
      updateButtonVisual(btn, def);
    }
    runIfAvailable(def.cmd);
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

  // ============================== Sync from getCarData (real read state)
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
    updateAllVisuals();
  }

  // ============================== Init
  loadAvailable();
  renderGrid();
  syncFromCarData();
  setInterval(syncFromCarData, 2000);

  // Подключаем DnD к hvac-grid.
  window.dnd?.enable(gridEl, {
    onReorder: (ids) => {
      saveOrder(ids);
      console.info('[climate] reordered:', ids.join(','));
    },
  });
})();
