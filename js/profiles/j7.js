// Jaecoo J7 профиль. Вертикальный планшет (portrait). FWD 51л, AWD 57л.
//
// Layout: top-bar → widgets (2×2 сетка) → music card → climate strip → apps row.
// На portrait экране удобнее всё стопкой, не side-by-side.

(() => {
  window.PROFILES = window.PROFILES || {};

  window.PROFILES.j7 = {
    id: 'j7',
    name: 'Jaecoo J7',
    bodyClass: 'profile-j7',
    fuelTankLiters: 51,  // FWD по умолчанию; AWD 57 — задаётся в settings вручную
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
      fuel: true,         // J7 — fuel-виджет в литрах
      coolant: true,      // J7 — T coolant если хост даёт (по запросу к автору JCarTools)
    },
    layout: 'portrait',
    enumOverrides: {
      // Если у JCarTools на J7 кастомные имена команд — переопределяем здесь.
      // Пока пусто, обновим после уточнения у автора.
    },
  };
})();
