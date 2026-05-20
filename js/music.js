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

  // Запоминаем последний PlayStat — нужен для кнопки play/pause: в JCT нет enum'а
  // MEDIA_PLAY_PAUSE (одной кнопкой), есть отдельные MEDIA_PLAY и MEDIA_PAUSE.
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
    if (info.SongAlbumPicture) {
      artEl.style.backgroundImage = `url(${info.SongAlbumPicture})`;
    } else {
      artEl.style.backgroundImage = '';
    }
    const pos = Number(info.Trpos) || 0;
    const dur = Number(info.Trdur) || 0;
    posEl.textContent = fmtTime(pos);
    durEl.textContent = fmtTime(dur);
    barEl.style.width = dur > 0 ? `${Math.min(100, (pos / dur) * 100)}%` : '0%';
    if (info.PlayStat) lastPlayStat = String(info.PlayStat).toLowerCase();
    // Перерисовать значок play/pause кнопки.
    const playBtn = document.querySelector('.btn-media-play');
    if (playBtn) playBtn.textContent = lastPlayStat === 'play' ? '⏸' : '▶';
  }

  // Кнопки plr-управления: в browser-stub режиме (!api.isHost) — переключаем
  // stubPlayer локально, чтобы UI работал без JCT. На ГУ — runEnum (JCT enum'ы:
  // MEDIA_PREV — нет в манифесте, MEDIA_PLAY/MEDIA_PAUSE — отдельные, MEDIA_NEXT).
  function clickMedia(cmd) {
    if (!api.isHost && window.stubPlayer) {
      if (cmd === 'MEDIA_PREV')        return window.stubPlayer.prev();
      if (cmd === 'MEDIA_NEXT')        return window.stubPlayer.next();
      if (cmd === 'MEDIA_PLAY_PAUSE')  return window.stubPlayer.toggle();
    }
    // ГУ: PLAY_PAUSE собирается из PlayStat, остальные шлём как есть.
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

  // Громкость — всегда через JCT (Volume_Up/Volume_Down из манифеста). ГУ сам
  // знает свой шаг и текущий уровень. В stub-режиме runEnum пишет в console и
  // обновляет stubState.volume через applyStubEnum.
  document.querySelectorAll('.btn-vol').forEach((btn) => {
    btn.addEventListener('click', () => {
      api.runEnum(btn.dataset.vol === 'up' ? 'Volume_Up' : 'Volume_Down');
    });
  });

  render(null);
  api.on('musicInfo', render);
})();
