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

  // ============================== Diagnostics (JCT API dump)
  // Юзер открывает Settings на ГУ → видит реальные имена enum'ов / поля carData /
  // приходящие события. По этому дампу подгоняем имена в climate.js / music.js
  // под конкретный билд JCT, без гадания по StreletS27-аналогам.
  const diagEnumsEl = document.getElementById('diag-enums');
  const diagCarEl = document.getElementById('diag-car');
  const diagAppsEl = document.getElementById('diag-apps');
  const diagEventsEl = document.getElementById('diag-events');
  const diagMethodsEl = document.getElementById('diag-methods');
  const diagProbeEl = document.getElementById('diag-probe');
  const diagMetaEl = document.getElementById('diag-meta');
  const diagRefreshBtn = document.getElementById('diag-refresh');
  const diagCopyBtn = document.getElementById('diag-copy');

  /** Печатает значение одной строкой: примитивы — toString, объекты — JSON. */
  function fmt(v) {
    if (v == null) return String(v);
    if (typeof v !== 'object') return String(v);
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  function refreshDiagnostics() {
    if (!diagEnumsEl) return;
    const enums = api.getRunEnum();
    const apps = api.getUserApps();
    const events = api.getRecentEvents();

    diagEnumsEl.textContent = Array.isArray(enums) && enums.length
      ? enums.map((n, i) => `${String(i + 1).padStart(3, ' ')}. ${fmt(n)}`).join('\n')
      : `(пусто или ошибка)\nraw: ${fmt(enums)}`;

    // 'all' на DesaySV возвращает {error:"unknown_data"} — пробуем все имена из манифеста,
    // печатаем то, что не унижение и не null.
    const carNames = ['all', 'state', 'car', 'vehicle', 'heat', 'seats', 'fuel', 'speed', 'rpm',
                      'engine', 'outTemp', 'driverTemp', 'passengerTemp', 'battery',
                      'rulHeat', 'lobHeat', 'zadHeat'];
    const carLines = carNames.map((name) => {
      const v = api.getCarData(name);
      return `${name.padEnd(16, ' ')} → ${fmt(v)}`;
    });
    diagCarEl.textContent = carLines.join('\n');

    diagAppsEl.textContent = Array.isArray(apps) && apps.length
      ? apps.map((a) => fmt(a)).join('\n')
      : '(пусто)';

    diagEventsEl.textContent = events.length
      ? events.slice().reverse().map((e) => {
          const ts = new Date(e.t).toLocaleTimeString('ru-RU');
          return `[${ts}] ${e.type}  ${fmt(e.data)}`;
        }).join('\n')
      : '(пока ни одного события не пришло)';

    // Enumerate всех методов на window.androidApi. WebView'ы из Android'а часто
    // отдают «магические» свойства через JS-bridge — нужно перебрать вручную.
    if (diagMethodsEl) {
      const aapi = window.androidApi;
      if (!aapi) {
        diagMethodsEl.textContent = '(window.androidApi отсутствует)';
      } else {
        const names = new Set();
        try { Object.keys(aapi).forEach((n) => names.add(n)); } catch {}
        try { Object.getOwnPropertyNames(aapi).forEach((n) => names.add(n)); } catch {}
        // Иногда JS-bridge свойства доступны только через `for...in` или
        // нестандартный proto — добавляем эвристический перебор.
        try { for (const n in aapi) names.add(n); } catch {}
        const sorted = Array.from(names).sort();
        diagMethodsEl.textContent = sorted.length === 0
          ? '(enumerate вернул 0 — bridge с непрозрачным proto)'
          : sorted.map((n) => {
              let t = 'unknown', extra = '';
              try {
                const v = aapi[n];
                t = typeof v;
                if (t === 'function') {
                  // toString иногда даёт сигнатуру; в WebView обычно
                  // "function () { [native code] }" но имя метода видно.
                  extra = ' ' + String(v).replace(/\s+/g, ' ').slice(0, 100);
                } else {
                  extra = ' = ' + fmt(v).slice(0, 60);
                }
              } catch (e) {
                extra = ' (read failed: ' + e.message + ')';
              }
              return `${n.padEnd(24, ' ')} ${t}${extra}`;
            }).join('\n');
      }
    }

    // Пробуем дёрнуть новые методы с разными аргументами — увидим что возвращают.
    // Каждый вызов в try/catch чтобы один кривой метод не убил весь дамп.
    if (diagProbeEl) {
      const aapi = window.androidApi;
      const TOKEN = api.TOKEN;
      const tries = [
        ['playerInfo()',                      () => aapi?.playerInfo?.()],
        ['playerInfo(TOKEN)',                 () => aapi?.playerInfo?.(TOKEN)],
        ['playerInfo(TOKEN, "")',             () => aapi?.playerInfo?.(TOKEN, '')],
        ['getAppInfo()',                      () => aapi?.getAppInfo?.()],
        ['getAppInfo(TOKEN)',                 () => aapi?.getAppInfo?.(TOKEN)],
        ['getAppInfo(TOKEN, "ru.yandex.music")', () => aapi?.getAppInfo?.(TOKEN, 'ru.yandex.music')],
        ['getAppInfo(TOKEN, "com.mylauncher.app")', () => aapi?.getAppInfo?.(TOKEN, 'com.mylauncher.app')],
        ['getFileList(TOKEN)',                () => aapi?.getFileList?.(TOKEN)],
      ];
      const lines = tries.map(([label, fn]) => {
        let result;
        try {
          const raw = fn();
          if (raw == null) result = String(raw);
          else if (typeof raw === 'string') {
            try { result = fmt(JSON.parse(raw)); }
            catch { result = JSON.stringify(raw); }
          } else result = fmt(raw);
        } catch (e) {
          result = `THREW: ${e.message}`;
        }
        // Обрезаем длинные base64-блобы чтобы не разорвать UI
        if (result.length > 300) result = result.slice(0, 300) + `… (+${result.length - 300} chars)`;
        return `${label}:\n  ${result}`;
      });
      diagProbeEl.textContent = lines.join('\n\n');
    }

    diagMetaEl.textContent =
      `isHost: ${api.isHost}\n` +
      `TOKEN:  ${api.TOKEN}\n` +
      `UA:     ${navigator.userAgent}\n` +
      `screen: ${window.innerWidth}×${window.innerHeight}`;
  }

  diagRefreshBtn?.addEventListener('click', refreshDiagnostics);
  diagCopyBtn?.addEventListener('click', () => {
    const dump =
      '=== isHost / TOKEN / UA ===\n'        + (diagMetaEl?.textContent || '') +
      '\n\n=== androidApi methods ===\n'     + (diagMethodsEl?.textContent || '') +
      '\n\n=== method probes ===\n'          + (diagProbeEl?.textContent || '') +
      '\n\n=== getRunEnum ===\n'             + (diagEnumsEl?.textContent || '') +
      '\n\n=== getCarData(all) ===\n'        + (diagCarEl?.textContent || '') +
      '\n\n=== getUserApps ===\n'            + (diagAppsEl?.textContent || '') +
      '\n\n=== events ===\n'                 + (diagEventsEl?.textContent || '');
    // 1) Попытаться в буфер обмена (может не сработать в WebView без gesture).
    try { navigator.clipboard?.writeText(dump); } catch (e) { console.warn('[diag] clipboard failed', e); }
    // 2) Скачать как файл — этот путь надёжно работает в WebView. Файл
    //    приземлится в /sdcard/Download/drive-j7-diag.txt и его можно
    //    забрать через `adb pull /sdcard/Download/drive-j7-diag.txt`.
    try {
      const blob = new Blob([dump], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drive-j7-diag.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.warn('[diag] download failed', e);
    }
    diagCopyBtn.textContent = 'Сохранено в Download/';
    setTimeout(() => { diagCopyBtn.textContent = 'Скопировать всё'; }, 2000);
  });

  // Обновляем при каждом открытии настроек + раз в секунду пока overlay открыт.
  const settingsCloseBtn = document.getElementById('settings-close');
  let diagTimer = null;
  function startDiagPolling() {
    refreshDiagnostics();
    if (diagTimer) clearInterval(diagTimer);
    diagTimer = setInterval(refreshDiagnostics, 1000);
  }
  function stopDiagPolling() {
    if (diagTimer) { clearInterval(diagTimer); diagTimer = null; }
  }
  // Settings открывается через btn-config из climate.js: ловим клики на нём
  // глобально (climate.js просто снимает .hidden, своего event'а не шлёт).
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    new MutationObserver(() => {
      if (settingsOverlay.classList.contains('hidden')) stopDiagPolling();
      else startDiagPolling();
    }).observe(settingsOverlay, { attributes: true, attributeFilter: ['class'] });
    // Если уже открыт на момент инициализации.
    if (!settingsOverlay.classList.contains('hidden')) startDiagPolling();
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
