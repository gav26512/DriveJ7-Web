// App launcher: загружает список приложений через getUserApps() и рендерит карточки.
// Клик → runApp(packageName).
//
// Иконки приложений в JCarTools пока приходят как пакетные строки (нет API для
// получения PNG из getAppInfo пока — мы используем плейсхолдер).

(() => {
  const container = document.getElementById('apps');

  function render(apps) {
    container.innerHTML = '';
    if (!apps || apps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'apps-empty';
      empty.textContent = i18n.t('apps.empty');
      empty.style.cssText = 'color: var(--text-dim); padding: 16px; font-size: 13px;';
      container.appendChild(empty);
      return;
    }
    for (const app of apps) {
      const card = document.createElement('div');
      card.className = 'app-card';
      card.dataset.pkg = app.package || '';

      const icon = document.createElement('div');
      icon.className = 'app-icon';
      // Иконка: если хост даёт base64/url в app.icon — используем.
      if (app.icon) {
        icon.style.backgroundImage = `url(${app.icon})`;
      } else {
        // Плейсхолдер: первая буква label на цветном фоне.
        icon.textContent = (app.label || '?').charAt(0).toUpperCase();
        icon.style.cssText += 'display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:var(--text-dim);';
      }

      const label = document.createElement('div');
      label.className = 'app-label';
      label.textContent = app.label || app.package || '?';

      card.appendChild(icon);
      card.appendChild(label);
      card.addEventListener('click', () => {
        if (app.package) api.runApp(app.package);
      });

      container.appendChild(card);
    }
  }

  // Загрузка при старте.
  function reload() {
    const apps = api.getUserApps();
    render(apps);
  }

  reload();
  window.addEventListener('langChanged', reload);
})();
