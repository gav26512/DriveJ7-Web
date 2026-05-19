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
  }

  // Кнопки управления — каждая шлёт runEnum.
  document.querySelectorAll('.btn-media').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      if (cmd) api.runEnum(cmd);
    });
  });

  render(null);
  api.on('musicInfo', render);
})();
