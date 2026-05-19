// Core bootstrap. Загружается ПОСЛЕДНИМ скриптом — все модули уже инициализированы.
// Делает финальные шаги: уведомить JCarTools-хост что страница готова.

(() => {
  // Применить data-i18n атрибуты для всех элементов с этим атрибутом.
  // (settings.js делает это для своих, но static-разметка в index.html тоже имеет)
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = i18n.t(key);
  });

  // Закрытие через топ-баровую кнопку × — выход в основной интерфейс JCarTools.
  document.getElementById('btn-close')?.addEventListener('click', () => {
    api.onClose();
  });

  // Уведомить хост о готовности — после этого начнут приходить события.
  // Делаем небольшую задержку чтобы все модули успели подписаться.
  setTimeout(() => {
    api.onJsReady();
    console.info('[core] onJsReady fired, profile:', window.profile?.id);
  }, 50);

  // Auto-launch выбранного плеера через 1.5 сек после старта — даёт хосту время
  // прислать musicInfo с уже играющим треком (если что-то уже играет).
  setTimeout(() => {
    window.playerDetect?.autoLaunchIfConfigured();
  }, 1500);
})();
