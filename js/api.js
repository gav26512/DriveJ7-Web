// JCarTools androidApi wrapper.
//
// На ГУ JCarTools предоставляет window.androidApi + window.onAndroidEvent.
// В обычном браузере этих хуков нет — мы подставляем stub с фейковыми данными
// чтобы UI можно было отлаживать на ноутбуке.
//
// API-документация: https://github.com/JCarTools/core_manifest
//
// Токен авторизации `SECURE_TOKEN_2025` — единый для всех web-расширений JCarTools
// (подтверждено в JCarTools/StreletS27/js/core.js). Конвенция: хост может
// переопределить через `window.ANDROID_TOKEN`, иначе используется fallback.

(() => {
  const TOKEN_FALLBACK = 'SECURE_TOKEN_2025';

  /** true если мы внутри JCarTools, false если в обычном Chrome. */
  const isHost = typeof window.androidApi === 'object' && window.androidApi !== null;

  /** Токен: window.ANDROID_TOKEN (если хост положил) → fallback. */
  const TOKEN = (typeof window.ANDROID_TOKEN === 'string' && window.ANDROID_TOKEN) || TOKEN_FALLBACK;

  // ============================== Browser stub ==============================
  // Все методы возвращают такие же типы что и реальный androidApi: JSON-строки
  // для составных значений (getCarData/getUserApps/getRunEnum/getFileList) и
  // примитивы для остальных. Stub-данные похожи на правду — машина "стоит на
  // парковке", двигатель работает, музыка играет.

  if (!isHost) {
    console.warn('[api] Running in browser stub mode (no JCarTools host detected)');

    const stubCar = {
      vehicle: {
        speed: 0,
        rpm: 850,
        engine: 'on',
        outTemp: 22,
        batteryVoltage: 12.6,
        vod: 'drive',
        sun: 'closed',
        park: true,
      },
      heat: {
        rulHeat: 0,
        lobHeat: 0,
        zadHeat: 0,
        driverTemp: 22,
        passengerTemp: 22,
      },
      seats: {
        front: { driverHeat: 0, passengerHeat: 0, driverVent: 0, passengerVent: 0 },
        rear: { leftHeat: 0, rightHeat: 0 },
      },
    };

    const stubApps = [
      { package: 'com.spotify.music', label: 'Spotify' },
      { package: 'com.yandex.mobile.realty', label: 'Карты' },
      { package: 'com.example.radio', label: 'Радио' },
      { package: 'com.example.podcasts', label: 'Подкасты' },
    ];

    const stubEnums = [
      'MEDIA_PREV', 'MEDIA_NEXT', 'MEDIA_PLAY_PAUSE',
      // HVAC toggle (binary)
      'AUTO_On', 'AUTO_Off', 'AC_On', 'AC_Off',
      'Recirculation_On', 'Recirculation_Off',
      'heat_windshield_on', 'heat_windshield_off',
      'heat_rearwindow_on', 'heat_rearwindow_off',
      'heat_wheel_on', 'heat_wheel_off',
      // HVAC level (0/1/2/3) — сидения подогрев + вентиляция
      'heat_seat_l_0', 'heat_seat_l_1', 'heat_seat_l_2', 'heat_seat_l_3',
      'heat_seat_r_0', 'heat_seat_r_1', 'heat_seat_r_2', 'heat_seat_r_3',
      'heat_zad_seat_l_0', 'heat_zad_seat_l_1', 'heat_zad_seat_l_2', 'heat_zad_seat_l_3',
      'heat_zad_seat_r_off', 'heat_zad_seat_r_1', 'heat_zad_seat_r_2', 'heat_zad_seat_r_3',
      'vent_seat_l_0', 'vent_seat_l_1', 'vent_seat_l_2', 'vent_seat_l_3',
      'vent_seat_r_0', 'vent_seat_r_1', 'vent_seat_r_2', 'vent_seat_r_3',
      // Fan (placeholder — в манифесте JCarTools отсутствует, имя выясняется)
      'fan_1', 'fan_2', 'fan_3', 'fan_4', 'fan_5',
      'fan_6', 'fan_7', 'fan_8', 'fan_9', 'fan_10',
      'fan_up', 'fan_down',
      // T-степперы — точные имена из JCarTools/core_manifest
      'Driver_Temp_Up', 'Driver_Temp_Down',
      'Passenger_Temp_Up', 'Passenger_Temp_Down',
      // Громкость — из манифеста
      'Volume_Up', 'Volume_Down',
      // Память сидений — из манифеста
      'voditel_seat_1', 'voditel_seat_2', 'voditel_seat_3',
    ];

    /**
     * Применяет runEnum-команду к stubCar чтоб следующий getCarData отдавал
     * актуальное состояние (иначе syncFromCarData в climate.js затрёт наш
     * optimistic state обратно в нули).
     */
    function applyStubEnum(name) {
      // Fan: 0..10 (отдельно — иначе пересекается с seat 0..3 regex).
      const fanMatch = name.match(/^fan_(\d+|off|up|down)$/);
      if (fanMatch) {
        const v = fanMatch[1];
        if (v === 'off') {
          stubCar.vehicle.fan = 0;
        } else if (v === 'up') {
          stubCar.vehicle.fan = Math.min(10, (stubCar.vehicle.fan || 0) + 1);
        } else if (v === 'down') {
          stubCar.vehicle.fan = Math.max(0, (stubCar.vehicle.fan || 0) - 1);
        } else {
          const n = Number(v);
          if (n >= 0 && n <= 10) stubCar.vehicle.fan = n;
        }
        return;
      }
      // Level commands для сидений: name_L (1/2/3) или name_0/name_off (off).
      const lvlMatch = name.match(/^(.+?)_(0|1|2|3|off)$/);
      if (lvlMatch) {
        const base = lvlMatch[1];
        const v = lvlMatch[2] === 'off' ? 0 : Number(lvlMatch[2]);
        const map = {
          heat_seat_l:      ['seats', 'front', 'driverHeat'],
          heat_seat_r:      ['seats', 'front', 'passengerHeat'],
          heat_zad_seat_l:  ['seats', 'rear', 'leftHeat'],
          heat_zad_seat_r:  ['seats', 'rear', 'rightHeat'],
          vent_seat_l:      ['seats', 'front', 'driverVent'],
          vent_seat_r:      ['seats', 'front', 'passengerVent'],
        };
        const path = map[base];
        if (path) {
          let obj = stubCar;
          for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
          obj[path[path.length - 1]] = v;
        }
      }
      // Громкость — Volume_Up/Volume_Down (из манифеста).
      if (name === 'Volume_Up')   { stubState.volume = Math.min(100, stubState.volume + 5); return; }
      if (name === 'Volume_Down') { stubState.volume = Math.max(0,   stubState.volume - 5); return; }
      // T-stepper из JCarTools/core_manifest: Driver_Temp_Up/Down, Passenger_Temp_Up/Down.
      const tempMatch = name.match(/^(Driver|Passenger)_Temp_(Up|Down)$/);
      if (tempMatch) {
        const field = tempMatch[1] === 'Driver' ? 'driverTemp' : 'passengerTemp';
        const dir = tempMatch[2] === 'Up' ? 1 : -1;
        stubCar.heat[field] = Math.max(16, Math.min(31, (stubCar.heat[field] || 22) + dir));
        return;
      }
      // Toggle (binary): *_on / *_off / *_On / *_Off
      const togMatch = name.match(/^(.+)_(on|off|On|Off)$/);
      if (togMatch && !lvlMatch) {
        const base = togMatch[1];
        const v = /on/i.test(togMatch[2]);
        const map = {
          heat_windshield: ['heat', 'lobHeat'],
          heat_rearwindow: ['heat', 'zadHeat'],
          heat_wheel:      ['heat', 'rulHeat'],
          Recirculation:   ['vehicle', 'recirc'],
          AUTO:            ['vehicle', 'auto'],
          AC:              ['vehicle', 'ac'],
        };
        const path = map[base];
        if (path) {
          let obj = stubCar;
          for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
          obj[path[path.length - 1]] = v ? 1 : 0;
        }
      }
    }

    window.androidApi = {
      onJsReady: (t) => console.debug('[stub] onJsReady', t),
      onClose: (t) => console.debug('[stub] onClose', t),
      onSettings: (t) => console.debug('[stub] onSettings', t),
      setBright: (t, v) => console.debug('[stub] setBright', v),
      setLogFilter: (t, f) => console.debug('[stub] setLogFilter', f),
      getvol: () => stubState.volume,
      setvol: (t, v) => { stubState.volume = Math.max(0, Math.min(100, v|0)); console.debug('[stub] setvol', stubState.volume); },
      getCarData: (t, name) => {
        if (!name || name === 'all' || name === 'car' || name === 'state') {
          return JSON.stringify(stubCar);
        }
        if (name === 'vehicle' || name === 'heat' || name === 'seats') {
          return JSON.stringify(stubCar[name]);
        }
        // Одиночный параметр: ищем в vehicle (наиболее частый случай)
        if (name in stubCar.vehicle) {
          return JSON.stringify({ name, value: stubCar.vehicle[name] });
        }
        return JSON.stringify({ name, value: null });
      },
      getUserApps: () => JSON.stringify(stubApps),
      runApp: (t, pkg) => console.debug('[stub] runApp', pkg),
      getRunEnum: () => JSON.stringify(stubEnums),
      getRunEnumPic: (t, name) => '',
      runEnum: (t, name) => {
        console.debug('[stub] runEnum', name);
        applyStubEnum(name);
        return JSON.stringify({ ok: true });
      },
      getFileList: () => JSON.stringify([]),
      getFile: (t, name) => '',
    };

    // ============================== Stub player (browser dev only)
    // Эмуляция реального ГУ: список треков, текущая позиция и громкость живут
    // в браузере. Кнопки plr/prev/next/play/pause/volume в music.js при
    // !api.isHost дёргают stubPlayer.* напрямую — это даёт работоспособный
    // плеер в dev-режиме без зависимости от runEnum.
    const stubTracks = [
      { SongName: 'Demo Track #1', SongArtist: 'Stub Artist', SongAlbum: 'Demo Album', SongAlbumPicture: '', Trdur: 180 },
      { SongName: 'Demo Track #2', SongArtist: 'Stub Artist', SongAlbum: 'Demo Album', SongAlbumPicture: '', Trdur: 210 },
      { SongName: 'Demo Track #3', SongArtist: 'Another Artist', SongAlbum: 'Best Of', SongAlbumPicture: '', Trdur: 165 },
      { SongName: 'Demo Track #4', SongArtist: 'Another Artist', SongAlbum: 'Best Of', SongAlbumPicture: '', Trdur: 240 },
    ];
    const stubState = { idx: 0, pos: 0, playing: true, volume: 50 };

    function emitMusicInfo() {
      const t = stubTracks[stubState.idx];
      window.onAndroidEvent?.('musicInfo', {
        PlayStat: stubState.playing ? 'play' : 'pause',
        SongName: t.SongName,
        SongArtist: t.SongArtist,
        SongAlbum: t.SongAlbum,
        SongAlbumPicture: t.SongAlbumPicture,
        Trpos: stubState.pos,
        Trdur: t.Trdur,
      });
    }

    window.stubPlayer = {
      prev() {
        stubState.idx = (stubState.idx - 1 + stubTracks.length) % stubTracks.length;
        stubState.pos = 0;
        stubState.playing = true;
        emitMusicInfo();
      },
      next() {
        stubState.idx = (stubState.idx + 1) % stubTracks.length;
        stubState.pos = 0;
        stubState.playing = true;
        emitMusicInfo();
      },
      toggle() {
        stubState.playing = !stubState.playing;
        emitMusicInfo();
      },
      volUp() { stubState.volume = Math.min(100, stubState.volume + 5); console.debug('[stub] volume', stubState.volume); },
      volDown(){ stubState.volume = Math.max(0,   stubState.volume - 5); console.debug('[stub] volume', stubState.volume); },
      getVolume() { return stubState.volume; },
    };

    // Эмуляция начального снапшота состояний.
    setTimeout(() => {
      window.onAndroidEvent?.('theme', { mode: 'dark' });
      emitMusicInfo();
      window.onAndroidEvent?.('weather', { temp: 22, icon: 'sun' });
      window.onAndroidEvent?.('gps', { lat: 55.75, lon: 37.61, speed: 0, heading: 0 });
    }, 100);

    // Тикалка прогресса трека. Каждую секунду inc'аем pos, на конце трека —
    // авто-переключение на следующий (как делает любой плеер). Только когда
    // PlayStat=play, чтобы пауза реально останавливала прогресс.
    setInterval(() => {
      if (!stubState.playing) return;
      const t = stubTracks[stubState.idx];
      stubState.pos++;
      if (stubState.pos >= t.Trdur) {
        stubState.idx = (stubState.idx + 1) % stubTracks.length;
        stubState.pos = 0;
      }
      emitMusicInfo();
    }, 1000);

    /**
     * Хелпер для теста push-event'ов из DevTools console:
     *   stubEmit('climateState')    — стрельнуть обновлением после ручной правки stubCar
     *   stubSet('seats.front.driverHeat', 2)  — изменить значение и автоматически стрельнуть event
     * Используется для имитации "физ.кнопка нажата" в браузере.
     */
    window.stubEmit = (type, data) => {
      window.onAndroidEvent?.(type, data || {});
      console.log('[stub] emitted', type, data || '');
    };
    window.stubSet = (path, value) => {
      const parts = path.split('.');
      let obj = stubCar;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      window.onAndroidEvent?.('climateState', {});
      console.log('[stub] set', path, '=', value, '→ fired climateState');
    };

    // Периодически "обновляем" RPM/speed чтобы было видно живые виджеты
    let demoRpm = 850;
    setInterval(() => {
      demoRpm = 750 + Math.floor(Math.random() * 200);
      stubCar.vehicle.rpm = demoRpm;
      window.onAndroidEvent?.('rpm', { value: demoRpm });
    }, 1500);
  }

  // ============================== Public wrapper ==============================
  // Тонкие, типобезопасные обёртки. Везде проглатываем JSON.parse() ошибки
  // и возвращаем null — UI должен это переживать.

  const safeParse = (s) => {
    if (typeof s !== 'string') return null;
    try { return JSON.parse(s); } catch (e) {
      console.warn('[api] JSON parse failed:', e, s);
      return null;
    }
  };

  /** Сообщить хосту что страница готова принимать события. Вызывать ОДИН раз. */
  function onJsReady() {
    try { window.androidApi.onJsReady(TOKEN); } catch (e) { console.error('[api] onJsReady', e); }
  }

  /** Закрыть "чёрный экран" (вернуться в основной интерфейс JCarTools). */
  function onClose() {
    try { window.androidApi.onClose?.(TOKEN); } catch (e) { console.error('[api] onClose', e); }
  }

  /** Открыть настройки JCarTools. */
  function onSettings() {
    try { window.androidApi.onSettings?.(TOKEN); } catch (e) { console.error('[api] onSettings', e); }
  }

  /**
   * Запросить данные авто. `name` ∈ {"all", "vehicle", "heat", "seats",
   * "speed", "rpm", "engine", "outTemp", "battery", ...}.
   * @returns распарсенный объект или null если запрос провалился.
   */
  function getCarData(name = 'all') {
    try { return safeParse(window.androidApi.getCarData(TOKEN, name)); }
    catch (e) { console.error('[api] getCarData', name, e); return null; }
  }

  /** Список user-приложений: `[{package, label, ...}, ...]`. */
  function getUserApps() {
    try { return safeParse(window.androidApi.getUserApps(TOKEN)) || []; }
    catch (e) { console.error('[api] getUserApps', e); return []; }
  }

  /** Запустить приложение по package name. */
  function runApp(pkg) {
    try { window.androidApi.runApp(TOKEN, pkg); }
    catch (e) { console.error('[api] runApp', pkg, e); }
  }

  /**
   * Список доступных runEnum-команд (динамически, у разных билдов JCarTools может
   * отличаться). Используется при инициализации чтобы понять что мы можем.
   */
  function getRunEnum() {
    try { return safeParse(window.androidApi.getRunEnum(TOKEN)) || []; }
    catch (e) { console.error('[api] getRunEnum', e); return []; }
  }

  /** Выполнить runEnum-команду (MEDIA_PREV, HVAC_AC_TOGGLE — если поддержана). */
  function runEnum(name) {
    try { return safeParse(window.androidApi.runEnum(TOKEN, name)); }
    catch (e) { console.error('[api] runEnum', name, e); return null; }
  }

  /** Громкость media-стрима 0..100. */
  function getVolume() {
    try { return Number(window.androidApi.getvol(TOKEN)) || 0; }
    catch (e) { console.error('[api] getvol', e); return 0; }
  }

  function setVolume(v) {
    try { window.androidApi.setvol(TOKEN, Math.max(0, Math.min(100, v|0))); }
    catch (e) { console.error('[api] setvol', e); }
  }

  function setBrightness(v) {
    try { window.androidApi.setBright?.(TOKEN, Math.max(0, Math.min(100, v|0))); }
    catch (e) { console.error('[api] setBright', e); }
  }

  // ============================== Event bus ==============================
  // window.onAndroidEvent перехватываем и переводим в EventTarget — UI-модули
  // подписываются через api.on('rpm', cb), не дёргая глобальный onAndroidEvent
  // напрямую.

  const bus = new EventTarget();

  // Ring buffer последних событий — для диагностического оверлея в Settings.
  // Не используется в обычной работе, нужен только чтобы юзер на ГУ мог увидеть
  // какие события и под какими именами шлёт его билд JCT.
  const recentEvents = [];
  const RECENT_MAX = 50;

  window.onAndroidEvent = function(type, data) {
    if (!type) return;
    recentEvents.push({ type, data, t: Date.now() });
    if (recentEvents.length > RECENT_MAX) recentEvents.shift();
    bus.dispatchEvent(new CustomEvent(type, { detail: data }));
  };

  function on(type, callback) {
    const handler = (ev) => callback(ev.detail);
    bus.addEventListener(type, handler);
    return () => bus.removeEventListener(type, handler);
  }

  // ============================== Export ==============================

  /** Снимок последних N событий — для диагностики. */
  function getRecentEvents() {
    return recentEvents.slice();
  }

  window.api = {
    isHost,
    TOKEN,
    onJsReady, onClose, onSettings,
    getCarData, getUserApps, runApp,
    getRunEnum, runEnum,
    getVolume, setVolume, setBrightness,
    on, getRecentEvents,
  };
})();
