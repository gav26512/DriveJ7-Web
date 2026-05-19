// HVAC controls. Read: через getCarData('heat') + getCarData('seats') periodically.
// Write: через runEnum(commandName). Конкретные имена команд узнаём из getRunEnum()
// при старте — если у текущего билда JCarTools нет какой-то HVAC-команды, кнопка
// дизейблится.
//
// ВАЖНО: имена команд (HVAC_AC_TOGGLE, HVAC_TEMP_DRIVER_UP и т.п.) в документации
// core_manifest пока не задокументированы. Использую "разумные" имена-предположения
// и фолбэк на console.warn если команда не в getRunEnum-списке. Реальные имена
// уточним у автора JCarTools.

(() => {
  // Маппинг наших button data-hvac → предполагаемое имя runEnum-команды.
  // Если команды нет в getRunEnum() — кнопка дизейблится.
  const CMD_MAP = {
    auto:          'HVAC_AUTO_TOGGLE',
    ac:            'HVAC_AC_TOGGLE',
    recirc:        'HVAC_RECIRC_TOGGLE',
    front_defrost: 'HVAC_FRONT_DEFROST_TOGGLE',
    rear_defrost:  'HVAC_REAR_DEFROST_TOGGLE',
    steering_heat: 'HVAC_STEERING_HEAT_TOGGLE',
  };

  const STEP_MAP = {
    driver_up:     'HVAC_TEMP_DRIVER_UP',
    driver_down:   'HVAC_TEMP_DRIVER_DOWN',
    passenger_up:  'HVAC_TEMP_PASSENGER_UP',
    passenger_down:'HVAC_TEMP_PASSENGER_DOWN',
    fan_up:        'HVAC_FAN_UP',
    fan_down:      'HVAC_FAN_DOWN',
  };

  // Список доступных runEnum-команд на этом билде JCarTools.
  let availableCmds = new Set();

  function loadAvailableCmds() {
    const enums = api.getRunEnum();
    availableCmds = new Set(Array.isArray(enums) ? enums : []);
    applyAvailability();
  }

  function applyAvailability() {
    document.querySelectorAll('[data-hvac]').forEach((btn) => {
      const cmd = CMD_MAP[btn.dataset.hvac];
      if (cmd && !availableCmds.has(cmd) && availableCmds.size > 0) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.title = `Command ${cmd} not available`;
      }
    });
    document.querySelectorAll('[data-hvac-step]').forEach((btn) => {
      const cmd = STEP_MAP[btn.dataset.hvacStep];
      if (cmd && !availableCmds.has(cmd) && availableCmds.size > 0) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
      }
    });
  }

  // Toggle-кнопки HVAC.
  document.querySelectorAll('[data-hvac]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = CMD_MAP[btn.dataset.hvac];
      if (!cmd) return;
      if (availableCmds.size > 0 && !availableCmds.has(cmd)) {
        console.warn(`[climate] runEnum ${cmd} not available`);
        return;
      }
      api.runEnum(cmd);
    });
  });

  // Step-кнопки T/Fan.
  document.querySelectorAll('[data-hvac-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = STEP_MAP[btn.dataset.hvacStep];
      if (!cmd) return;
      if (availableCmds.size > 0 && !availableCmds.has(cmd)) {
        console.warn(`[climate] runEnum ${cmd} not available`);
        return;
      }
      api.runEnum(cmd);
    });
  });

  // Render state из getCarData.
  function renderState() {
    const heat = api.getCarData('heat');
    if (heat) {
      // T driver/passenger
      const tDriver = document.getElementById('t-driver');
      const tPass = document.getElementById('t-passenger');
      if (heat.driverTemp != null) tDriver.textContent = `${Math.round(heat.driverTemp)}°`;
      if (heat.passengerTemp != null) tPass.textContent = `${Math.round(heat.passengerTemp)}°`;

      // Подсветка активных toggle-кнопок (lobHeat/zadHeat/rulHeat — read).
      setActive('front_defrost', !!heat.lobHeat);
      setActive('rear_defrost', !!heat.zadHeat);
      setActive('steering_heat', !!heat.rulHeat);
    }
    const vehicle = api.getCarData('vehicle');
    // На vehicle.engine / acState нет явного поля для AC/AUTO/Recirc, ждём от
    // автора JCarTools уточнений. Пока эти кнопки рисуются без active-state.
  }

  function setActive(hvacName, isActive) {
    const btn = document.querySelector(`[data-hvac="${hvacName}"]`);
    if (btn) btn.classList.toggle('active', isActive);
  }

  loadAvailableCmds();
  renderState();
  setInterval(renderState, 2000);
})();
