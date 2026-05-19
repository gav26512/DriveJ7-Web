// Погода: подписка на event 'weather' от хоста. Поля {temp, icon}.

(() => {
  const root = document.getElementById('weather');
  const iconEl = root.querySelector('.weather-icon');
  const tempEl = root.querySelector('.weather-temp');

  // Эмодзи-маппинг для иконок погоды (грубая аппроксимация).
  const ICONS = {
    sun: '☀',
    clear: '☀',
    cloud: '☁',
    cloudy: '☁',
    rain: '🌧',
    snow: '❄',
    storm: '⛈',
    fog: '🌫',
  };

  function render(data) {
    if (!data || typeof data.temp !== 'number') {
      iconEl.textContent = '';
      tempEl.textContent = i18n.t('weather.unavailable');
      return;
    }
    iconEl.textContent = ICONS[(data.icon || '').toLowerCase()] || '';
    const sign = data.temp > 0 ? '+' : '';
    tempEl.textContent = `${sign}${Math.round(data.temp)}°`;
  }

  // Начальное состояние — недоступно.
  render(null);

  api.on('weather', render);
})();
