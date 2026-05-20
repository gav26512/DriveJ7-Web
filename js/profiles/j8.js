// Jaecoo J8 профиль. Горизонтальный планшет (landscape). Объём бака уточнить.
//
// Layout: 2-колоночная сетка — слева music+climate, справа widgets+apps. Подгоняется
// под широкий экран.

(() => {
  window.PROFILES = window.PROFILES || {};

  window.PROFILES.j8 = {
    id: 'j8',
    name: 'Jaecoo J8',
    bodyClass: 'profile-j8',
    // Разрешение экрана ГУ Jaecoo J8: 1920×1200 dp (landscape).
    screenSize: { width: 1920, height: 1200 },
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
      fuel: true,
      coolant: true,
    },
    layout: 'landscape',
    enumOverrides: {},
  };
})();
