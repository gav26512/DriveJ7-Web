// Settings overlay: тема (dark/light), язык (ru/en), яркость экрана.
// Все настройки сохраняются в localStorage и применяются мгновенно.

(() => {
  const overlay = document.getElementById('settings-overlay');
  const closeBtn = document.getElementById('settings-close');

  const langSelect = document.getElementById('setting-lang');
  const brightInput = document.getElementById('setting-brightness');

  function close() { overlay?.classList.add('hidden'); }

  // Open-кнопка живёт в climate-strip (#btn-config) — wire'ится в climate.js.
  // Здесь обрабатываем только close и клик по фону overlay.
  closeBtn?.addEventListener('click', close);

  // ============================== Widget visibility + climate config checkboxes
  const cfgCheckboxes = [
    // Плавающие виджеты
    { id: 'cfg-w-wifi',    key: 'widgetWifi' },
    { id: 'cfg-w-dt',      key: 'widgetDateTime' },
    { id: 'cfg-w-temp',    key: 'widgetOutdoorT' },
    // Кнопки климата
    { id: 'cfg-two-zone',  key: 'twoZoneClimate' },
    { id: 'cfg-auto',      key: 'auto' },
    { id: 'cfg-recirc',    key: 'recirc' },
    { id: 'cfg-front-glass', key: 'frontGlass' },
    { id: 'cfg-rear-glass',  key: 'rearGlass' },
    { id: 'cfg-steer-heat',  key: 'steerHeat' },
    { id: 'cfg-rear-seat',   key: 'rearSeat' },
    { id: 'cfg-vent-drv',    key: 'seatVentDrv' },
    { id: 'cfg-vent-pass',   key: 'seatVentPass' },
    // Память
    { id: 'cfg-mem1',  key: 'memorySlot1' },
    { id: 'cfg-mem2',  key: 'memorySlot2' },
    { id: 'cfg-mem3',  key: 'memorySlot3' },
  ];
  for (const cb of cfgCheckboxes) {
    const el = document.getElementById(cb.id);
    if (!el) continue;
    el.checked = !!window.config?.[cb.key];
    el.addEventListener('change', () => {
      window.configApi?.set(cb.key, el.checked);
    });
  }

  // ============================== Language
  langSelect.value = i18n.getLang();
  langSelect.addEventListener('change', () => {
    i18n.setLang(langSelect.value);
    // Перерисовать все статические строки через data-i18n.
    applyI18nAttributes();
  });

  function applyI18nAttributes() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (key) el.textContent = i18n.t(key);
    });
  }
  applyI18nAttributes();
  window.addEventListener('langChanged', applyI18nAttributes);

  // ============================== Accent color palette
  // 'auto' → использовать default профиля (CSS правило body.profile-*).
  // конкретный HEX → переопределить --accent на :root.
  const ACCENT_KEY = 'accent-color';
  // ВАЖНО: ставим на <body>, а не на <html>. body.profile-j7/j8/tiggo9
  // переопределяет --accent в своих правилах — если поставим на <html>,
  // правило body выиграет каскад. На самом body inline-style побеждает.
  function applyAccent(value) {
    if (value === 'auto' || !value) {
      document.body.style.removeProperty('--accent');
    } else {
      document.body.style.setProperty('--accent', value);
    }
  }
  const savedAccent = localStorage.getItem(ACCENT_KEY) || 'auto';
  applyAccent(savedAccent);

  document.querySelectorAll('.accent-swatch').forEach((btn) => {
    if (btn.dataset.accent === savedAccent) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const val = btn.dataset.accent;
      document.querySelectorAll('.accent-swatch').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyAccent(val);
      localStorage.setItem(ACCENT_KEY, val);
    });
  });

  // ============================== Player auto-launch
  const playerSelect = document.getElementById('setting-player');
  function reloadPlayerOptions() {
    if (!playerSelect) return;
    const detected = window.playerDetect?.detectInstalled() || [];
    const saved = window.playerDetect?.getSelected() || '';
    playerSelect.innerHTML = '<option value="">Не выбран</option>';
    for (const p of detected) {
      const opt = document.createElement('option');
      opt.value = p.package;
      opt.textContent = p.label;
      if (p.package === saved) opt.selected = true;
      playerSelect.appendChild(opt);
    }
    if (detected.length === 0) {
      // Если ничего не нашли — оставляем заглушку.
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(музыкальные приложения не найдены)';
      opt.disabled = true;
      playerSelect.appendChild(opt);
    }
  }
  reloadPlayerOptions();
  playerSelect?.addEventListener('change', () => {
    window.playerDetect?.setSelected(playerSelect.value);
  });

  // ============================== Profile (car model)
  const profileSelect = document.getElementById('setting-profile');
  if (profileSelect) {
    const savedProfile = localStorage.getItem('profile') || 'auto';
    profileSelect.value = savedProfile;
    profileSelect.addEventListener('change', () => {
      if (profileSelect.value === 'auto') {
        localStorage.removeItem('profile');
      } else {
        localStorage.setItem('profile', profileSelect.value);
      }
      // Перезагружаем чтобы профиль применился к layout/cssVars.
      location.reload();
    });
  }

  // ============================== Brightness
  const savedBright = parseInt(localStorage.getItem('brightness') || '80', 10);
  brightInput.value = savedBright;
  api.setBrightness(savedBright);
  brightInput.addEventListener('input', () => {
    const v = parseInt(brightInput.value, 10);
    api.setBrightness(v);
    localStorage.setItem('brightness', String(v));
  });
})();
