// Минималистичный i18n. Текущий язык — из localStorage 'lang' или 'ru' по умолчанию.
// Использование: t('hvac.auto') → "Авто" / "Auto".

(() => {
  const STRINGS = {
    ru: {
      'app.title': 'Drive J7',
      'clock.format24': true,
      'weather.unavailable': 'Нет данных',
      'music.no_track': 'Нет трека',
      'music.unknown_artist': 'Неизвестный исполнитель',
      'apps.empty': 'Нет установленных приложений',
      'apps.add': 'Добавить',
      'apps.all': 'Все',
      'hvac.ac': 'AC',
      'hvac.auto': 'Авто',
      'hvac.recirc': 'Цирк',
      'hvac.front_defrost': 'Лоб.',
      'hvac.rear_defrost': 'Зад.',
      'hvac.steering_heat': 'Руль',
      'hvac.fan': 'Обдув',
      'hvac.temp_driver': 'T водителя',
      'hvac.temp_passenger': 'T пассажира',
      'hvac.seat_heat': 'Подогрев сиденья',
      'hvac.seat_vent': 'Обдув сиденья',
      'widget.rpm': 'об/мин',
      'widget.speed_kmh': 'км/ч',
      'widget.outdoor': 'За бортом',
      'widget.battery': 'Бортовая',
      'widget.fuel': 'Топливо',
      'widget.fuel_unit': 'л',
      'widget.coolant': 'Охл.ж.',
      'widget.coolant_unit': '°C',
      'settings.title': 'Настройки',
      'settings.theme': 'Тема',
      'settings.theme_dark': 'Тёмная',
      'settings.theme_light': 'Светлая',
      'settings.brightness': 'Яркость',
      'settings.language': 'Язык',
      'settings.about': 'О приложении',
      'common.on': 'Вкл',
      'common.off': 'Выкл',
      'common.unavailable': 'Недоступно',
    },
    en: {
      'app.title': 'Drive J7',
      'clock.format24': true,
      'weather.unavailable': 'No data',
      'music.no_track': 'No track',
      'music.unknown_artist': 'Unknown artist',
      'apps.empty': 'No installed apps',
      'apps.add': 'Add',
      'apps.all': 'All',
      'hvac.ac': 'AC',
      'hvac.auto': 'Auto',
      'hvac.recirc': 'Recirc',
      'hvac.front_defrost': 'Front',
      'hvac.rear_defrost': 'Rear',
      'hvac.steering_heat': 'Wheel',
      'hvac.fan': 'Fan',
      'hvac.temp_driver': 'T driver',
      'hvac.temp_passenger': 'T pass',
      'hvac.seat_heat': 'Seat heat',
      'hvac.seat_vent': 'Seat vent',
      'widget.rpm': 'RPM',
      'widget.speed_kmh': 'km/h',
      'widget.outdoor': 'Outside',
      'widget.battery': 'Battery',
      'widget.fuel': 'Fuel',
      'widget.fuel_unit': 'L',
      'widget.coolant': 'Coolant',
      'widget.coolant_unit': '°C',
      'settings.title': 'Settings',
      'settings.theme': 'Theme',
      'settings.theme_dark': 'Dark',
      'settings.theme_light': 'Light',
      'settings.brightness': 'Brightness',
      'settings.language': 'Language',
      'settings.about': 'About',
      'common.on': 'On',
      'common.off': 'Off',
      'common.unavailable': 'Unavailable',
    },
  };

  /** Текущий язык. Приоритет: localStorage → navigator.language → 'ru'. */
  function currentLang() {
    const saved = localStorage.getItem('lang');
    if (saved && STRINGS[saved]) return saved;
    const nav = (navigator.language || '').slice(0, 2);
    if (STRINGS[nav]) return nav;
    return 'ru';
  }

  let lang = currentLang();

  /** Получить строку по ключу. Если ключ не найден — вернёт сам ключ (для дебага). */
  function t(key) {
    return STRINGS[lang]?.[key] ?? STRINGS.ru[key] ?? key;
  }

  /** Сменить язык в рантайме. Перезагрузить UI (вызвать перерисовку) — задача caller'а. */
  function setLang(l) {
    if (!STRINGS[l]) return;
    lang = l;
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    window.dispatchEvent(new CustomEvent('langChanged', { detail: l }));
  }

  /** Текущий язык read-only. */
  function getLang() { return lang; }

  /** Список доступных языков. */
  function getLangs() { return Object.keys(STRINGS); }

  // Применить язык к <html lang="..."> сразу.
  document.documentElement.lang = lang;

  window.i18n = { t, setLang, getLang, getLangs };
})();
