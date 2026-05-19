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
      'settings.language': 'Язык',
      'settings.brightness': 'Яркость',
      'settings.profile': 'Профиль машины',
      'settings.profile_auto': 'Автоопределение',
      'settings.profile_generic': 'Generic',
      'settings.player': 'Плеер по умолчанию',
      'settings.player_none': 'Не выбран',
      'settings.accent': 'Подсветка',
      'settings.about': 'О приложении',
      'settings.sec_widgets': 'Плавающие виджеты',
      'settings.sec_climate': 'Кнопки климата',
      'settings.sec_memory': 'Память сидений водителя',
      'settings.w_wifi': 'WiFi',
      'settings.w_dt': 'Дата и время',
      'settings.w_temp': 'T за бортом',
      'settings.two_zone': 'Двухзонный климат (T пасс.)',
      'settings.auto_btn': 'AUTO',
      'settings.recirc_btn': 'Рециркуляция',
      'settings.front_glass': 'Обогрев лоб. стекла',
      'settings.rear_glass': 'Обогрев задн. стекла',
      'settings.steer_heat': 'Подогрев руля',
      'settings.rear_seat': 'Подогрев задних сидений',
      'settings.vent_drv': 'Обдув сиденья (водитель)',
      'settings.vent_pass': 'Обдув сиденья (пассажир)',
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
      'settings.language': 'Language',
      'settings.brightness': 'Brightness',
      'settings.profile': 'Car profile',
      'settings.profile_auto': 'Auto-detect',
      'settings.profile_generic': 'Generic',
      'settings.player': 'Default player',
      'settings.player_none': 'Not selected',
      'settings.accent': 'Accent color',
      'settings.about': 'About',
      'settings.sec_widgets': 'Floating widgets',
      'settings.sec_climate': 'Climate buttons',
      'settings.sec_memory': 'Driver seat memory',
      'settings.w_wifi': 'WiFi',
      'settings.w_dt': 'Date and time',
      'settings.w_temp': 'Outdoor T',
      'settings.two_zone': 'Dual-zone climate (passenger T)',
      'settings.auto_btn': 'AUTO',
      'settings.recirc_btn': 'Recirculation',
      'settings.front_glass': 'Windshield heat',
      'settings.rear_glass': 'Rear window heat',
      'settings.steer_heat': 'Steering wheel heat',
      'settings.rear_seat': 'Rear seat heating',
      'settings.vent_drv': 'Seat ventilation (driver)',
      'settings.vent_pass': 'Seat ventilation (passenger)',
      'common.on': 'On',
      'common.off': 'Off',
      'common.unavailable': 'Unavailable',
    },
  };

  /** Текущий язык. Приоритет: localStorage → 'ru' по умолчанию.
   *  navigator.language НЕ используется — target user в РФ, дефолт всегда RU. */
  function currentLang() {
    const saved = localStorage.getItem('lang');
    if (saved && STRINGS[saved]) return saved;
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
