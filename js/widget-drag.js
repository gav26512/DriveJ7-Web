// Drag для плавающих виджетов (.ov-widget). Long-press 350ms начинает drag,
// палец двигает виджет, отпускание сохраняет позицию в localStorage.
//
// Каждый виджет имеет data-widget-id — это ключ для localStorage:
// `widget-pos.<id>` = {"x": Npx, "y": Npx}.
//
// При загрузке восстанавливаем сохранённую позицию (если есть).

(() => {
  const LONGPRESS_MS = 350;
  const MOVE_THRESHOLD_PX = 6;
  const STORAGE_PREFIX = 'widget-pos.';

  function makeDraggable(el) {
    const id = el.dataset.widgetId;
    if (!id) return;
    const storageKey = STORAGE_PREFIX + id;

    // Restore saved position.
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') {
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          // Сбрасываем right если был задан (для top-right виджетов по умолчанию).
          el.style.right = 'auto';
          el.style.bottom = 'auto';
        }
      }
    } catch (e) {}

    let pressTimer = 0;
    let dragging = false;
    let startX = 0, startY = 0;
    let offsetX = 0, offsetY = 0;

    function onPointerDown(ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      // Не дёргать drag если палец на кнопке внутри виджета.
      if (ev.target.closest('button')) return;
      startX = ev.clientX;
      startY = ev.clientY;
      pressTimer = setTimeout(() => startDrag(ev), LONGPRESS_MS);
    }

    function startDrag(ev) {
      dragging = true;
      const rect = el.getBoundingClientRect();
      // Если используем right/bottom — переключаем на left/top для корректного drag.
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.top}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      offsetX = startX - rect.left;
      offsetY = startY - rect.top;
      el.classList.add('dragging');
      navigator.vibrate?.(20);
      console.log('[widget-drag] start', id);
    }

    function onPointerMove(ev) {
      if (!dragging) {
        if (pressTimer) {
          const dx = Math.abs(ev.clientX - startX);
          const dy = Math.abs(ev.clientY - startY);
          if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
            clearTimeout(pressTimer);
            pressTimer = 0;
          }
        }
        return;
      }
      // Clamp в viewport.
      const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, ev.clientX - offsetX));
      const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, ev.clientY - offsetY));
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }

    function onPointerUp() {
      clearTimeout(pressTimer);
      pressTimer = 0;
      if (dragging) {
        dragging = false;
        el.classList.remove('dragging');
        const rect = el.getBoundingClientRect();
        localStorage.setItem(storageKey, JSON.stringify({ x: rect.left, y: rect.top }));
        console.log('[widget-drag] saved', id, rect.left, rect.top);
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  // Применяем drag ко всем .ov-widget на странице.
  document.querySelectorAll('.ov-widget').forEach(makeDraggable);
  console.log('[widget-drag] enabled for', document.querySelectorAll('.ov-widget').length, 'widgets');
})();
