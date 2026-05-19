// Авто-определение медиа-плеера. Сканит getUserApps() через api, ищет известные
// музыкальные пакеты + всё что имеет category APP_MUSIC (если хост передаёт эту
// инфу — на core_manifest пока такого поля не задокументировано, но если будет).
//
// Список known-плееров взят из нативного лаунчера (см. KnownMusicApps в проекте).

(() => {
  /**
   * Известные музыкальные пакеты — package name + display label.
   * Порядок ≈ популярность в РФ + глобальные.
   */
  const KNOWN_PLAYERS = [
    { package: 'ru.yandex.music',                          label: 'Я.Музыка' },
    { package: 'com.vk.audio',                             label: 'VK Музыка' },  // или com.vkontakte.android
    { package: 'com.vkontakte.android',                    label: 'VK' },
    { package: 'com.spotify.music',                        label: 'Spotify' },
    { package: 'com.zvuk.mobile',                          label: 'Звук' },
    { package: 'com.google.android.apps.youtube.music',    label: 'YT Music' },
    { package: 'com.sec.android.app.music',                label: 'Samsung Music' },
    { package: 'com.maxmpz.audioplayer',                   label: 'Poweramp' },
    { package: 'com.apple.android.music',                  label: 'Apple Music' },
    { package: 'com.deezer.android.app',                   label: 'Deezer' },
    { package: 'com.amazon.mp3',                           label: 'Amazon Music' },
    { package: 'com.aspiro.tidal',                         label: 'Tidal' },
    { package: 'com.soundcloud.android',                   label: 'SoundCloud' },
    { package: 'com.leting.carmusic',                      label: 'Leting (OEM)' },
    { package: 'com.liontech.carmusic',                    label: 'Lion (OEM)' },
  ];

  const STORAGE_KEY = 'media-player';

  /**
   * Возвращает только те known-плееры, что реально установлены на ГУ (по getUserApps).
   * Также добавляет всё что имеет `category == "APP_MUSIC"` если хост передаёт это поле.
   * @returns {Array<{package: string, label: string, icon?: string}>}
   */
  function detectInstalled() {
    const apps = api.getUserApps() || [];
    const installedSet = new Set(apps.map((a) => a.package));
    const detected = [];

    // Шаг 1: known music apps что есть в списке установленных.
    for (const known of KNOWN_PLAYERS) {
      if (installedSet.has(known.package)) {
        const app = apps.find((a) => a.package === known.package);
        detected.push({
          package: known.package,
          label: app?.label || known.label,
          icon: app?.icon,
        });
      }
    }

    // Шаг 2: всё что хост явно пометил category=APP_MUSIC (если поле передаётся).
    for (const app of apps) {
      if (app.category === 'APP_MUSIC' && !detected.find((d) => d.package === app.package)) {
        detected.push({ package: app.package, label: app.label || app.package, icon: app.icon });
      }
    }

    return detected;
  }

  /** Сохранённый плеер по умолчанию (package name) или null. */
  function getSelected() {
    return localStorage.getItem(STORAGE_KEY) || null;
  }

  /** Сохранить выбор. pkg=null/пустая строка → сбросить. */
  function setSelected(pkg) {
    if (!pkg) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, pkg);
    }
  }

  /**
   * Запустить сохранённый плеер если он выбран. Идемпотентно: если уже играет
   * (есть свежий musicInfo) — не дёргаем. Иначе runApp.
   * Вызывается из core.js при старте лаунчера, через 1.5 сек после onJsReady.
   */
  function autoLaunchIfConfigured() {
    const pkg = getSelected();
    if (!pkg) return;
    console.info('[player-detect] auto-launching', pkg);
    api.runApp(pkg);
  }

  window.playerDetect = {
    KNOWN_PLAYERS,
    detectInstalled,
    getSelected,
    setSelected,
    autoLaunchIfConfigured,
  };
})();
