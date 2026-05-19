// Generic-профиль: используется как фолбэк когда модель машины не распознана.
// Не делает car-specific предположений, layout определяется только ориентацией экрана.
//
// Каждый профиль регистрируется в window.PROFILES под своим id. profile-loader.js
// выбирает один и применяет.

(() => {
  window.PROFILES = window.PROFILES || {};

  window.PROFILES.generic = {
    id: 'generic',
    name: 'Generic',
    // CSS-класс, накладываемый на body: для тонкой настройки в style.css.
    bodyClass: 'profile-generic',
    // Объём бака (литры) для виджета топлива — если getCarData отдаёт raw %.
    // Generic — без бака, виджет топлива тогда показывает %.
    fuelTankLiters: null,
    // Какие HVAC-кнопки показывать. true/false.
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
    // Дополнительные виджеты, специфичные для модели.
    widgets: {
      rpm: true,
      speed: true,
      outdoor_temp: true,
      battery: true,
      fuel: false,        // Generic — без топлива (нет объёма бака для конверсии)
      coolant: false,     // Generic — без T coolant (нет в core API)
    },
    // Layout-режим: 'auto' = по ориентации экрана, 'portrait', 'landscape'.
    layout: 'auto',
    // Кастомные имена runEnum-команд (если у машины своя номенклатура).
    enumOverrides: {},
  };
})();
