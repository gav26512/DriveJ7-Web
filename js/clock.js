// Часы: HH:MM + дата. Обновляется каждые 30 секунд (точность до минуты достаточна).

(() => {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');

  function render() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
    // Дата локализованная: "пн, 19 мая" / "Mon, May 19"
    const fmt = new Intl.DateTimeFormat(i18n.getLang(), {
      weekday: 'short', day: 'numeric', month: 'long',
    });
    dateEl.textContent = fmt.format(now);
  }

  render();
  setInterval(render, 30 * 1000);
  window.addEventListener('langChanged', render);
})();
