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
    fuelTankLiters: 70,  // TODO: уточнить точный объём бака J8
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
