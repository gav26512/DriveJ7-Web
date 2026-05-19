// Drag-n-drop для HVAC кнопок в климат-стрипе.
//
// Триггер: long-press (450 мс) на любой кнопке внутри `.hvac-grid`. После триггера
// кнопка становится "плавающей" — следует за пальцем, остальные кнопки разъезжаются
// показывая drop-зону. Отпускание ставит на ближайшую позицию, порядок сохраняется
// в localStorage 'hvac-order'.
//
// Использование: вызвать `dnd.enable(containerEl, { onReorder })` после рендера
// кнопок. Каждая дочерняя кнопка должна иметь `data-dnd-id` атрибут.
//
// На touch-устройствах используются pointer events — работает и в обычном мыше,
// и в touch-WebView (JCarTools).

(() => {
  const LONGPRESS_MS = 450;
  const MOVE_THRESHOLD_PX = 8;

  /**
   * @param {HTMLElement} container — родитель кнопок (например `.hvac-grid`)
   * @param {object} opts
   * @param {(orderIds: string[]) => void} opts.onReorder — вызывается при изменении порядка
   * @returns {() => void} disable-функция для отписки
   */
  function enable(container, opts = {}) {
    const onReorder = opts.onReorder || (() => {});

    let pressedEl = null;
    let pressTimer = 0;
    let dragging = null;       // элемент в режиме drag
    let dragGhost = null;      // визуальный клон, следующий за пальцем
    let startX = 0, startY = 0;
    let lastX = 0, lastY = 0;
    let placeholder = null;

    function onPointerDown(ev) {
      // только основной палец/кнопка
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      const target = ev.target.closest('[data-dnd-id]');
      if (!target || !container.contains(target)) return;

      pressedEl = target;
      startX = ev.clientX;
      startY = ev.clientY;
      lastX = startX;
      lastY = startY;

      pressTimer = setTimeout(() => startDrag(ev), LONGPRESS_MS);

      // tracking движения чтобы отменить long-press если палец дёрнулся
      pressedEl.setPointerCapture?.(ev.pointerId);
    }

    function onPointerMove(ev) {
      lastX = ev.clientX;
      lastY = ev.clientY;

      if (!dragging) {
        // ещё не начали drag — отменяем если уехали слишком сильно
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
          clearTimeout(pressTimer);
          pressedEl = null;
        }
        return;
      }

      // Двигаем ghost.
      if (dragGhost) {
        dragGhost.style.left = `${ev.clientX}px`;
        dragGhost.style.top = `${ev.clientY}px`;
      }

      // Ищем над какой кнопкой находимся.
      const over = elementAtIgnoring(ev.clientX, ev.clientY, dragGhost);
      const overBtn = over?.closest('[data-dnd-id]');
      if (overBtn && overBtn !== dragging && container.contains(overBtn)) {
        swapPositions(dragging, overBtn);
      }
    }

    function onPointerUp() {
      clearTimeout(pressTimer);
      pressedEl = null;
      if (dragging) endDrag();
    }

    function startDrag(ev) {
      if (!pressedEl) return;
      dragging = pressedEl;
      dragging.classList.add('dnd-dragging');

      // Создаём ghost.
      const rect = dragging.getBoundingClientRect();
      dragGhost = dragging.cloneNode(true);
      dragGhost.classList.add('dnd-ghost');
      dragGhost.style.position = 'fixed';
      dragGhost.style.left = `${lastX}px`;
      dragGhost.style.top = `${lastY}px`;
      dragGhost.style.width = `${rect.width}px`;
      dragGhost.style.height = `${rect.height}px`;
      dragGhost.style.transform = 'translate(-50%, -50%) scale(1.08)';
      dragGhost.style.pointerEvents = 'none';
      dragGhost.style.opacity = '0.85';
      dragGhost.style.zIndex = '9999';
      dragGhost.style.transition = 'transform .12s';
      document.body.appendChild(dragGhost);

      // Лёгкая тактильная отдача если поддерживается.
      navigator.vibrate?.(20);
    }

    function endDrag() {
      if (!dragging) return;
      dragging.classList.remove('dnd-dragging');
      dragging = null;
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }
      // Сообщить новый порядок.
      const ids = Array.from(container.querySelectorAll('[data-dnd-id]'))
        .map((el) => el.dataset.dndId);
      onReorder(ids);
    }

    function elementAtIgnoring(x, y, ignored) {
      if (!ignored) return document.elementFromPoint(x, y);
      const prev = ignored.style.display;
      ignored.style.display = 'none';
      const el = document.elementFromPoint(x, y);
      ignored.style.display = prev;
      return el;
    }

    function swapPositions(a, b) {
      // a — currently dragging, b — target. Меняем местами в DOM.
      const parent = a.parentNode;
      const aIdx = Array.from(parent.children).indexOf(a);
      const bIdx = Array.from(parent.children).indexOf(b);
      if (aIdx < bIdx) {
        parent.insertBefore(a, b.nextSibling);
      } else {
        parent.insertBefore(a, b);
      }
    }

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }

  window.dnd = { enable };
})();
