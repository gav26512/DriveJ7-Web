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
    // Разрешение экрана ГУ Jaecoo J7: 1440×1670 dp (portrait).
    // Источник: MainActivity.kt:3864-3865 @Preview из нативного DriveJ7.
    screenSize: { width: 1440, height: 1670 },
    // По решению юзера: fuel/coolant виджеты не делаем.
    fuelTankLiters: null,
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
      fuel: false,
      coolant: false,
    },
    layout: 'portrait',
    enumOverrides: {
      // Если у JCarTools на J7 кастомные имена команд — переопределяем здесь.
      // Пока пусто, обновим после уточнения у автора.
    },
  };
})();
