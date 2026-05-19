// Overlay info: floating widgets в углу экрана — клон OverlayService из нативного.
// Часы + дата, забортная температура, RPM. Fuel/coolant умышленно опущены —
// по решению юзера (T coolant и бак не делаем).

(() => {
  const timeEl = document.getElementById('ov-time');
  const dateEl = document.getElementById('ov-date');
  const outdoorEl = document.getElementById('ov-outdoor');
  const rpmEl = document.getElementById('ov-rpm');

  // ============================== Clock
  function renderClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    timeEl.textContent = `${hh}:${mm}`;
    dateEl.textContent = new Intl.DateTimeFormat(i18n.getLang(), {
      weekday: 'short', day: 'numeric', month: 'long',
    }).format(now);
  }
  renderClock();
  setInterval(renderClock, 30 * 1000);
  window.addEventListener('langChanged', renderClock);

  // ============================== Outdoor temp + RPM
  function renderOutdoor(v) {
    if (typeof v !== 'number' || !isFinite(v)) { outdoorEl.firstChild.nodeValue = '--°'; return; }
    const sign = v > 0 ? '+' : '';
    outdoorEl.firstChild.nodeValue = `${sign}${Math.round(v)}°`;
  }

  function renderRpm(v) {
    if (!rpmEl) return;  // pill спрятан — пропускаем
    if (typeof v !== 'number' || !isFinite(v)) {
      rpmEl.firstChild.nodeValue = '---- ';
      return;
    }
    rpmEl.firstChild.nodeValue = `${Math.round(v)} `;
  }

  // RPM event-driven.
  api.on('rpm', (data) => {
    const v = typeof data === 'object' ? Number(data?.value) : Number(data);
    renderRpm(v);
  });

  // Outdoor T — нет события, читаем периодически.
  function pollSlow() {
    const veh = api.getCarData('vehicle');
    if (veh) {
      if (typeof veh.outTemp === 'number') renderOutdoor(veh.outTemp);
      if (typeof veh.rpm === 'number') renderRpm(veh.rpm);
    }
  }
  pollSlow();
  setInterval(pollSlow, 2000);
})();
