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

    const stubEnums = ['MEDIA_PREV', 'MEDIA_NEXT', 'MEDIA_PLAY_PAUSE'];

    window.androidApi = {
      onJsReady: (t) => console.debug('[stub] onJsReady', t),
      onClose: (t) => console.debug('[stub] onClose', t),
      onSettings: (t) => console.debug('[stub] onSettings', t),
      setBright: (t, v) => console.debug('[stub] setBright', v),
      setLogFilter: (t, f) => console.debug('[stub] setLogFilter', f),
      getvol: () => 50,
      setvol: (t, v) => console.debug('[stub] setvol', v),
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
        return JSON.stringify({ ok: true });
      },
      getFileList: () => JSON.stringify([]),
      getFile: (t, name) => '',
    };

    // Эмуляция событий для отладки UI.
    setTimeout(() => {
      window.onAndroidEvent?.('theme', { mode: 'dark' });
      window.onAndroidEvent?.('musicInfo', {
        PlayStat: 'play',
        SongName: 'Demo Track',
        SongArtist: 'Stub Artist',
        SongAlbum: 'Demo Album',
        SongAlbumPicture: '',
        Trpos: 42,
        Trdur: 180,
      });
      window.onAndroidEvent?.('weather', { temp: 22, icon: 'sun' });
      window.onAndroidEvent?.('gps', { lat: 55.75, lon: 37.61, speed: 0, heading: 0 });
    }, 100);

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

  window.onAndroidEvent = function(type, data) {
    if (!type) return;
    bus.dispatchEvent(new CustomEvent(type, { detail: data }));
  };

  function on(type, callback) {
    const handler = (ev) => callback(ev.detail);
    bus.addEventListener(type, handler);
    return () => bus.removeEventListener(type, handler);
  }

  // ============================== Export ==============================

  window.api = {
    isHost,
    TOKEN,
    onJsReady, onClose, onSettings,
    getCarData, getUserApps, runApp,
    getRunEnum, runEnum,
    getVolume, setVolume, setBrightness,
    on,
  };
})();
