// Верхний ряд виджетов: RPM, speed, outdoor T, battery V.
// Источники:
//   - 'rpm' event + getCarData('rpm') как fallback
//   - 'speed' event + getCarData('speed')
//   - getCarData('vehicle').outTemp — нет специального события, читаем периодически
//   - getCarData('vehicle').batteryVoltage — то же
//
// Если хост не присылает событий по какому-то параметру — крутим poll-цикл
// каждые 2 секунды на getCarData.

(() => {
  const rpmEl = document.getElementById('w-rpm');
  const speedEl = document.getElementById('w-speed');
  const outdoorEl = document.getElementById('w-outdoor');
  const batteryEl = document.getElementById('w-battery');

  function renderRpm(v) {
    if (typeof v !== 'number' || !isFinite(v)) { rpmEl.textContent = '----'; return; }
    rpmEl.textContent = String(Math.round(v));
  }

  function renderSpeed(v) {
    if (typeof v !== 'number' || !isFinite(v)) { speedEl.textContent = '--'; return; }
    speedEl.textContent = String(Math.max(0, Math.round(v)));
  }

  function renderOutdoor(v) {
    if (typeof v !== 'number' || !isFinite(v)) { outdoorEl.textContent = '--°'; return; }
    const sign = v > 0 ? '+' : '';
    outdoorEl.textContent = `${sign}${Math.round(v)}°`;
  }

  function renderBattery(v) {
    if (typeof v !== 'number' || !isFinite(v)) { batteryEl.textContent = '--.- V'; return; }
    batteryEl.textContent = `${v.toFixed(1)} V`;
  }

  // Event-driven: RPM и Speed обновляются мгновенно при изменении.
  api.on('rpm', (data) => {
    const v = typeof data === 'object' ? Number(data?.value) : Number(data);
    renderRpm(v);
  });
  api.on('speed', (data) => {
    const v = typeof data === 'object' ? Number(data?.value) : Number(data);
    renderSpeed(v);
  });

  // Poll-цикл для outdoor T и battery (нет событий на них в core_manifest).
  function pollSlow() {
    const veh = api.getCarData('vehicle');
    if (veh) {
      renderOutdoor(Number(veh.outTemp));
      renderBattery(Number(veh.batteryVoltage));
      // Также подхватываем rpm/speed если событие не пришло
      if (typeof veh.rpm === 'number') renderRpm(veh.rpm);
      if (typeof veh.speed === 'number') renderSpeed(veh.speed);
    }
  }

  pollSlow();
  setInterval(pollSlow, 2000);
})();
