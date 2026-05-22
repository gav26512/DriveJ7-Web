// App grid: 6 фиксированных слотов (2 ряда × 3). Юзер настраивает каждый слот
// через long-press → app picker dialog. Конфиг сохраняется в localStorage.
//
// На реальном JCarTools-хосте `getUserApps()` возвращает все установленные user-apps.
// Юзер выбирает 6 для своих слотов, остальные доступны через дополнительный экран
// (пока не реализован).

(() => {
  const SLOTS = 6;
  const STORAGE_KEY = 'app-slots';
  const gridEl = document.getElementById('app-grid');
  const pickerEl = document.getElementById('app-picker');
  const pickerListEl = document.getElementById('app-picker-list');
  const pickerCloseEl = document.getElementById('picker-close');

  /** @type {Array<{package: string, label: string, icon?: string} | null>} */
  let slots = loadSlots();
  let activeSlotIdx = -1;

  /**
   * Иконка приложения в JCT может приходить под разными именами и в разных
   * форматах: url, data: URL или голый base64. Перебираем кандидатов и
   * нормализуем в CSS-валидный URL.
   */
  function normalizeAppIcon(app) {
    const raw = app?.icon || app?.iconBase64 || app?.image || app?.pic || app?.appIcon || '';
    if (!raw || typeof raw !== 'string') return '';
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    if (/^[A-Za-z0-9+/=]+$/.test(raw.slice(0, 64))) {
      return `data:image/png;base64,${raw}`;
    }
    return raw;
  }

  /** Label приложения: проверяем разные имена полей, fallback — короткое имя пакета. */
  function appLabel(app) {
    return app?.label || app?.name || app?.appName || app?.title ||
           (app?.package ? app.package.split('.').pop() : '?');
  }

  function loadSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const out = [];
      for (let i = 0; i < SLOTS; i++) out.push(arr[i] || null);
      return out;
    } catch (e) {
      return new Array(SLOTS).fill(null);
    }
  }

  function saveSlots() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    for (let i = 0; i < SLOTS; i++) {
      const slot = slots[i];
      const div = document.createElement('div');
      div.className = 'app-slot' + (slot ? '' : ' empty');
      div.dataset.idx = String(i);

      const icon = document.createElement('div');
      icon.className = 'app-slot-icon';
      const slotIconUrl = slot ? normalizeAppIcon(slot) : '';
      if (slotIconUrl) {
        icon.style.backgroundImage = `url("${slotIconUrl}")`;
      } else if (slot) {
        icon.textContent = appLabel(slot).charAt(0).toUpperCase();
      } else {
        icon.textContent = '+';
      }

      const label = document.createElement('div');
      label.className = 'app-slot-label';
      label.textContent = slot ? appLabel(slot) : i18n.t('apps.add');

      div.appendChild(icon);
      div.appendChild(label);

      // Click — launch если slot заполнен, иначе открыть picker.
      div.addEventListener('click', () => {
        if (slot) {
          api.runApp(slot.package);
        } else {
          openPicker(i);
        }
      });
      // Long-press — открыть picker для смены.
      let pressTimer;
      div.addEventListener('pointerdown', () => {
        pressTimer = setTimeout(() => openPicker(i), 600);
      });
      div.addEventListener('pointerup', () => clearTimeout(pressTimer));
      div.addEventListener('pointerleave', () => clearTimeout(pressTimer));

      gridEl.appendChild(div);
    }
  }

  function openPicker(slotIdx) {
    activeSlotIdx = slotIdx;
    const installed = api.getUserApps();
    pickerListEl.innerHTML = '';
    if (!installed || installed.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = i18n.t('apps.empty');
      empty.style.cssText = 'grid-column: 1 / -1; padding: 16px; text-align: center; color: var(--text-dim);';
      pickerListEl.appendChild(empty);
    } else {
      for (const app of installed) {
        const item = document.createElement('div');
        item.className = 'app-picker-item';
        const icon = document.createElement('div');
        icon.className = 'picker-icon';
        const iconUrl = normalizeAppIcon(app);
        const niceLabel = appLabel(app);
        if (iconUrl) {
          icon.style.backgroundImage = `url("${iconUrl}")`;
        } else {
          icon.textContent = niceLabel.charAt(0).toUpperCase();
        }
        const label = document.createElement('div');
        label.className = 'picker-label';
        label.textContent = niceLabel;
        item.appendChild(icon);
        item.appendChild(label);
        item.addEventListener('click', () => {
          // В slot кладём весь объект — нормализация будет при ренденре.
          slots[activeSlotIdx] = { ...app, label: niceLabel };
          saveSlots();
          renderGrid();
          closePicker();
        });
        pickerListEl.appendChild(item);
      }
    }
    pickerEl.classList.remove('hidden');
  }

  function closePicker() {
    pickerEl.classList.add('hidden');
    activeSlotIdx = -1;
  }

  pickerCloseEl?.addEventListener('click', closePicker);
  pickerEl?.addEventListener('click', (e) => { if (e.target === pickerEl) closePicker(); });

  renderGrid();
  window.addEventListener('langChanged', renderGrid);
})();
