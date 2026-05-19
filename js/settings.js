// Settings overlay: тема (dark/light), язык (ru/en), яркость экрана.
// Все настройки сохраняются в localStorage и применяются мгновенно.

(() => {
  const overlay = document.getElementById('settings-overlay');
  const closeBtn = document.getElementById('settings-close');
  const openBtn = document.getElementById('btn-settings');

  const themeSelect = document.getElementById('setting-theme');
  const langSelect = document.getElementById('setting-lang');
  const brightInput = document.getElementById('setting-brightness');

  function open() { overlay.classList.remove('hidden'); }
  function close() { overlay.classList.add('hidden'); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ============================== Theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
  themeSelect.value = savedTheme;
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
    localStorage.setItem('theme', themeSelect.value);
  });

  function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  }

  // Подписка на theme от хоста (приоритет над user choice если хост явно прислал).
  api.on('theme', (data) => {
    if (data?.mode) applyTheme(data.mode);
  });

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
