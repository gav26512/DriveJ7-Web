// Drag-n-drop для HVAC кнопок в климат-стрипе.
//
// Триггер: long-press (350 мс без движения > 6 px) на любой кнопке внутри
// `.hvac-grid`. После триггера кнопка становится "плавающей" — следует за пальцем,
// другие кнопки разъезжаются swap'ом. Отпускание сохраняет порядок в localStorage
// 'hvac-order'. Click после drag подавляется чтобы не сработал toggle/cycle.
//
// Использование:
//   const off = dnd.enable(containerEl, { onReorder })
//   // off() для отписки
// Каждая дочерняя кнопка должна иметь `data-dnd-id` атрибут.

(() => {
  const LONGPRESS_MS = 350;
  const MOVE_THRESHOLD_PX = 6;

  /**
   * @param {HTMLElement} container
   * @param {object} opts
   * @param {(orderIds: string[]) => void} opts.onReorder
   */
  function enable(container, opts = {}) {
    const onReorder = opts.onReorder || (() => {});

    let pressedEl = null;
    let pressTimer = 0;
    let dragging = null;
    let dragGhost = null;
    let didDrag = false;
    let startX = 0, startY = 0;
    let lastX = 0, lastY = 0;

    function onPointerDown(ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      const target = ev.target.closest('[data-dnd-id]');
      if (!target || !container.contains(target)) return;

      pressedEl = target;
      didDrag = false;
      startX = ev.clientX;
      startY = ev.clientY;
      lastX = startX;
      lastY = startY;
      console.log('[dnd] pointerdown on', target.dataset.dndId, 'waiting', LONGPRESS_MS, 'ms');
      pressTimer = setTimeout(() => startDrag(), LONGPRESS_MS);
    }

    function onPointerMove(ev) {
      lastX = ev.clientX;
      lastY = ev.clientY;

      if (!dragging) {
        if (pressedEl) {
          const dx = Math.abs(ev.clientX - startX);
          const dy = Math.abs(ev.clientY - startY);
          if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
            console.log('[dnd] cancelled by move dx=', dx, 'dy=', dy);
            clearTimeout(pressTimer);
            pressedEl = null;
          }
        }
        return;
      }

      // Двигаем ghost.
      if (dragGhost) {
        dragGhost.style.left = `${ev.clientX}px`;
        dragGhost.style.top = `${ev.clientY}px`;
      }

      // Ищем над какой кнопкой палец.
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

    function onClickCapture(ev) {
      // Подавляем click если только что был drag — иначе HVAC-кнопка зактоглит
      // на нашем drop'е.
      if (didDrag) {
        ev.stopPropagation();
        ev.preventDefault();
        didDrag = false;
      }
    }

    function startDrag() {
      if (!pressedEl) return;
      dragging = pressedEl;
      didDrag = true;
      dragging.classList.add('dnd-dragging');

      const rect = dragging.getBoundingClientRect();
      dragGhost = dragging.cloneNode(true);
      dragGhost.classList.add('dnd-ghost');
      dragGhost.classList.remove('dnd-dragging');
      Object.assign(dragGhost.style, {
        position: 'fixed',
        left: `${lastX}px`,
        top: `${lastY}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: 'translate(-50%, -50%) scale(1.08)',
        pointerEvents: 'none',
        opacity: '0.9',
        zIndex: '9999',
        transition: 'transform .12s',
      });
      document.body.appendChild(dragGhost);
      navigator.vibrate?.(20);
      console.log('[dnd] ▶ START DRAG', dragging.dataset.dndId);
    }

    function endDrag() {
      if (!dragging) return;
      console.log('[dnd] ◀ END DRAG');
      dragging.classList.remove('dnd-dragging');
      dragging = null;
      if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
      }
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
      const parent = a.parentNode;
      const aIdx = Array.from(parent.children).indexOf(a);
      const bIdx = Array.from(parent.children).indexOf(b);
      if (aIdx < bIdx) {
        parent.insertBefore(a, b.nextSibling);
      } else {
        parent.insertBefore(a, b);
      }
    }

    // Listen on document (а не container) — pointerdown надёжнее ловится в
    // capture phase на самом верху иерархии. Внутри onPointerDown проверяем
    // что target внутри container.
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClickCapture, true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Диагностика — ловим вообще все pointerdown'ы.
    const diagHandler = (ev) => {
      const isHvacBtn = ev.target.closest('[data-dnd-id]');
      const isInGrid = isHvacBtn && container.contains(isHvacBtn);
      console.log('[dnd-diag] pointerdown target=', ev.target.tagName + '.' + (ev.target.className || ''),
        ' hvacBtn=', !!isHvacBtn, ' inGrid=', !!isInGrid);
    };
    window.addEventListener('pointerdown', diagHandler, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointerdown', diagHandler, true);
    };
  }

  window.dnd = { enable };
})();
