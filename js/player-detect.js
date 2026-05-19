// Авто-определение медиа-плеера. Сканит getUserApps() через api, ищет известные
// музыкальные пакеты + всё что имеет category APP_MUSIC (если хост передаёт эту
// инфу — на core_manifest пока такого поля не задокументировано, но если будет).
//
// Список known-плееров взят из нативного лаунчера (см. KnownMusicApps в проекте).

(() => {
  /**
   * Известные музыкальные пакеты — package name + display label.
   * Сгруппировано: RU стриминги, глобальные стриминги, локальные плееры,
   * подкасты, радио, OEM авто-плееры, system Android music apps.
   */
  const KNOWN_PLAYERS = [
    // ============================== RU / СНГ стриминги
    { package: 'ru.yandex.music',                          label: 'Я.Музыка' },
    { package: 'com.vkontakte.android',                    label: 'VK' },
    { package: 'com.vk.music',                             label: 'VK Музыка' },
    { package: 'com.vk.chery.music',                       label: 'VK Музыка (Chery)' },
    { package: 'com.zvuk.mobile',                          label: 'Звук' },
    { package: 'ru.mts.music.android',                     label: 'МТС Музыка' },
    { package: 'com.boom.musicapp',                        label: 'Boom' },
    { package: 'ru.megafon.megafonmusic',                  label: 'МегаФон.Музыка' },

    // ============================== Глобальные стриминги
    { package: 'com.spotify.music',                        label: 'Spotify' },
    { package: 'com.spotify.lite',                         label: 'Spotify Lite' },
    { package: 'com.google.android.apps.youtube.music',    label: 'YT Music' },
    { package: 'com.apple.android.music',                  label: 'Apple Music' },
    { package: 'com.deezer.android.app',                   label: 'Deezer' },
    { package: 'com.amazon.mp3',                           label: 'Amazon Music' },
    { package: 'com.aspiro.tidal',                         label: 'Tidal' },
    { package: 'com.soundcloud.android',                   label: 'SoundCloud' },
    { package: 'com.pandora.android',                      label: 'Pandora' },
    { package: 'net.audiomack',                            label: 'Audiomack' },
    { package: 'com.napster.app.android',                  label: 'Napster' },
    { package: 'com.mixcloud.player',                      label: 'Mixcloud' },
    { package: 'com.iheartradio.controller',               label: 'iHeartRadio' },

    // ============================== Локальные плееры
    { package: 'com.maxmpz.audioplayer',                   label: 'Poweramp' },
    { package: 'com.maxmpz.audioplayer.unlock',            label: 'Poweramp Unlock' },
    { package: 'com.aimp.player',                          label: 'AIMP' },
    { package: 'com.nullsoft.winamp',                      label: 'Winamp' },
    { package: 'com.tbig.playerpro',                       label: 'Player Pro' },
    { package: 'com.tbig.playerprotrial',                  label: 'Player Pro Trial' },
    { package: 'com.muzio.musicplayer',                    label: 'Muzio' },
    { package: 'com.amaze.player',                         label: 'Amaze Music' },
    { package: 'com.simplemobiletools.musicplayer',        label: 'Simple Music Player' },
    { package: 'com.musicplayer.player.mp3player',         label: 'MP3 Player' },
    { package: 'com.ventismedia.android.musicfolderplayer',label: 'Music Folder Player' },
    { package: 'com.jrtstudio.AnotherMusicPlayer',         label: 'Another Music Player' },
    { package: 'org.videolan.vlc',                         label: 'VLC' },
    { package: 'com.foobar2000.foobar2000mobile',          label: 'foobar2000' },
    { package: 'ru.aristov.musicplayer',                   label: 'VKMusic' },

    // ============================== Подкасты + аудиокниги
    { package: 'fm.castbox.audiobook.radio.podcast',       label: 'Castbox' },
    { package: 'au.com.shiftyjelly.pocketcasts',           label: 'Pocket Casts' },
    { package: 'com.podbean.app.podcast',                  label: 'Podbean' },
    { package: 'com.bambuna.podcastaddict',                label: 'Podcast Addict' },
    { package: 'com.audible.application',                  label: 'Audible' },
    { package: 'com.google.android.apps.podcasts',         label: 'Google Podcasts' },

    // ============================== Радио / Shazam
    { package: 'tunein.player',                            label: 'TuneIn Radio' },
    { package: 'com.shazam.android',                       label: 'Shazam' },
    { package: 'com.last.android',                         label: 'Last.fm' },

    // ============================== System / vendor music apps
    { package: 'com.sec.android.app.music',                label: 'Samsung Music' },
    { package: 'com.miui.player',                          label: 'Mi Music' },
    { package: 'com.huawei.music',                         label: 'Huawei Music' },
    { package: 'com.android.music',                        label: 'AOSP Music' },

    // ============================== OEM авто-плееры (наш ГУ)
    { package: 'com.leting.carmusic',                      label: 'Leting Car Music' },
    { package: 'com.liontech.carmusic',                    label: 'Lion Car Music' },
    { package: 'com.liontech.radio',                       label: 'Lion Radio' },
    { package: 'com.desaysv.svaudioapp',                   label: 'Desay Audio' },
    { package: 'com.desaysv.mediadvp',                     label: 'Desay Media DVP' },
    { package: 'com.skyworthauto.dvrchery',                label: 'Skyworth DVR' },
    { package: 'com.leting.member',                        label: 'Leting Member' },
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
