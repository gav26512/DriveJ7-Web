// Музыкальный виджет: подписка на event 'musicInfo' + runEnum для управления.
// Поля события: PlayStat, SongName, SongArtist, SongAlbum, SongAlbumPicture,
// Trpos (секунды), Trdur (секунды).

(() => {
  const titleEl = document.getElementById('player-title');
  const artistEl = document.getElementById('player-artist');
  const artEl = document.getElementById('player-art');
  const posEl = document.getElementById('player-pos');
  const durEl = document.getElementById('player-dur');
  const barEl = document.getElementById('player-bar');

  function fmtTime(sec) {
    sec = Math.max(0, sec | 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * DesaySV-сборка JCT отдаёт Trpos/Trdur в миллисекундах вопреки манифесту
   * («в секундах»). Эвристика: если значение > 10000 — это явно не секунды
   * (трек длиннее 2.7 часов крайне маловероятен), делим на 1000.
   */
  function parseTime(v) {
    const n = Number(v) || 0;
    return n > 10000 ? n / 1000 : n;
  }

  /**
   * SongAlbumPicture может приходить как (a) полный URL, (b) data: URL,
   * (c) сырой base64 без префикса. Нормализуем в формат, который ест CSS.
   */
  function normalizeArt(v) {
    if (!v || typeof v !== 'string') return '';
    if (v.startsWith('http') || v.startsWith('data:')) return v;
    // Похоже на base64 (только b64-символы) — оборачиваем в data URL.
    if (/^[A-Za-z0-9+/=]+$/.test(v.slice(0, 64))) {
      return `data:image/jpeg;base64,${v}`;
    }
    return v;
  }

  // PlayStat нужен для логики кнопки play/pause: в JCT_API нет единого toggle-enum'а
  // (MEDIA_PLAY_PAUSE отсутствует), есть только раздельные MEDIA_PLAY и MEDIA_PAUSE.
  let lastPlayStat = 'pause';

  function render(info) {
    if (!info) {
      titleEl.textContent = i18n.t('music.no_track');
      artistEl.textContent = i18n.t('music.unknown_artist');
      artEl.style.backgroundImage = '';
      posEl.textContent = '0:00';
      durEl.textContent = '0:00';
      barEl.style.width = '0%';
      return;
    }
    titleEl.textContent = info.SongName || i18n.t('music.no_track');
    artistEl.textContent = info.SongArtist || i18n.t('music.unknown_artist');

    const art = normalizeArt(info.SongAlbumPicture || info.SongPic || info.AlbumArt || '');
    if (art) {
      artEl.style.backgroundImage = `url("${art}")`;
      artEl.classList.add('has-art');
    } else {
      artEl.style.backgroundImage = '';
      artEl.classList.remove('has-art');
    }

    const pos = parseTime(info.Trpos);
    const dur = parseTime(info.Trdur);
    posEl.textContent = fmtTime(pos);
    durEl.textContent = fmtTime(dur);
    barEl.style.width = dur > 0 ? `${Math.min(100, (pos / dur) * 100)}%` : '0%';
    if (info.PlayStat) lastPlayStat = String(info.PlayStat).toLowerCase();
    // Перерисовать значок play/pause кнопки.
    const playBtn = document.querySelector('.btn-media-play');
    if (playBtn) playBtn.textContent = lastPlayStat === 'play' ? '⏸' : '▶';
  }

  // Кнопки plr-управления. На ГУ — прямой api.runEnum с именами из JCT_API.md.
  // В browser-stub режиме (!api.isHost) — переключаем stubPlayer локально, чтобы
  // UI работал без JCT-хоста.
  function clickMedia(cmd) {
    if (!api.isHost && window.stubPlayer) {
      if (cmd === 'MEDIA_BLACK')       return window.stubPlayer.prev();
      if (cmd === 'MEDIA_NEXT')        return window.stubPlayer.next();
      if (cmd === 'MEDIA_PLAY_PAUSE')  return window.stubPlayer.toggle();
    }
    // PLAY_PAUSE собираем сами — единого toggle-enum'а в JCT нет.
    if (cmd === 'MEDIA_PLAY_PAUSE') {
      api.runEnum(lastPlayStat === 'play' ? 'MEDIA_PAUSE' : 'MEDIA_PLAY');
      return;
    }
    api.runEnum(cmd);
  }

  document.querySelectorAll('.btn-media').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      if (cmd) clickMedia(cmd);
    });
  });

  // Громкость — через прямые setvol/getvol (нативные методы JCT, не runEnum).
  // Volume_Up/Volume_Down через runEnum на DesaySV не отрабатывают, а setvol —
  // обычный JCT-метод и должен работать на всех билдах.
  const VOL_STEP = 5;
  document.querySelectorAll('.btn-vol').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = api.getVolume();
      const next = btn.dataset.vol === 'up'
        ? Math.min(100, cur + VOL_STEP)
        : Math.max(0,   cur - VOL_STEP);
      api.setVolume(next);
    });
  });

  render(null);
  api.on('musicInfo', render);
})();
