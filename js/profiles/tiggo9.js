// Chery Tiggo 9 профиль. Горизонтальный 2560×1440 QHD (Ultra HD).
// Большой широкий экран, физически крупнее → увеличенные размеры шрифта/паддингов
// чтобы кликаемые элементы попадали под палец без увеличения через css zoom.
//
// Топливо: Tiggo 9 ICE — 70л, PHEV-вариант — меньше. По умолчанию 70л, юзер
// сможет переопределить в настройках после добавления fuel tank selector.

(() => {
  window.PROFILES = window.PROFILES || {};

  window.PROFILES.tiggo9 = {
    id: 'tiggo9',
    name: 'Chery Tiggo 9',
    bodyClass: 'profile-tiggo9',
    // Разрешение экрана ГУ Tiggo 9: 2560×1440 QHD landscape.
    screenSize: { width: 2560, height: 1440 },
    fuelTankLiters: 70,  // ICE; для PHEV-варианта переопределить вручную
    hvac: {
      auto: true,
      ac: true,
      recirc: true,
      front_defrost: true,
      rear_defrost: true,
      steering_heat: true,
      driver_temp: true,
      passenger_temp: true,
      fan: true,
    },
    widgets: {
      rpm: true,
      speed: true,
      outdoor_temp: true,
      battery: true,
      fuel: true,
      coolant: true,
    },
    layout: 'landscape',
    enumOverrides: {},
    // Tiggo 9 экран существенно крупнее — масштабируем UI через CSS-переменные.
    cssVars: {
      '--base-font-size': '20px',
      '--widget-value-font': '48px',
      '--gap': '20px',
      '--radius': '20px',
    },
  };
})();
