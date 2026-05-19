# Drive J7 — Web edition

Лаунчер для головных устройств Jaecoo J7 (и потенциально других моделей), реализованный
как HTML/JS-расширение для [JCarTools](https://github.com/JCarTools). Использует
официальное `androidApi` для доступа к данным авто (RPM, скорость, HVAC, GPS, медиа),
вместо прямого бинда к VDS-шине.

## Статус

`v0.1.0` — каркас. Базовая структура: manifest, scaffolding UI, обёртка `androidApi`
с browser-stub'ом для разработки в Chrome без головы.

## Структура

```
DriveJ7-Web/
├── manifest.json              {id, name, version, entry}
├── index.html                 — корневая разметка
├── css/style.css              — тёмная тема + responsive layout
├── js/
│   ├── api.js                 — обёртка над window.androidApi + browser stub
│   ├── i18n.js                — RU/EN строки
│   ├── profile-loader.js      — выбирает активный профиль (J7/J8/generic)
│   ├── profiles/
│   │   ├── generic.js         — fallback-конфиг
│   │   ├── j7.js              — Jaecoo J7 (portrait, бак 51/57л)
│   │   ├── j8.js              — Jaecoo J8 (landscape, бак ~70л)
│   │   └── tiggo9.js          — Chery Tiggo 9 (landscape QHD 2560×1440, бак 70л)
│   ├── clock.js               — часы
│   ├── weather.js             — погода (event weather)
│   ├── music.js               — медиа (event musicInfo + runEnum)
│   ├── apps.js                — лаунчер приложений (getUserApps + runApp)
│   ├── climate.js             — HVAC контролы (getCarData + runEnum для write)
│   ├── widgets.js             — RPM/speed/outTemp/battery (event + getCarData)
│   ├── settings.js            — окно настроек
│   └── core.js                — bootstrap (последний — onJsReady)
└── img/, icons/               — ассеты
```

## Профильная система

Чтобы поддерживать разные машины (J7 portrait, J8 landscape) и разрешения — используется
профильная архитектура. Каждый профиль это JS-объект с:
- `bodyClass` — CSS-класс на `<body>` для тюнинга стилей
- `fuelTankLiters` — объём бака для конверсии fuel% → литры
- `hvac.{auto,ac,recirc,...}` — какие HVAC-кнопки показывать
- `widgets.{rpm,speed,fuel,coolant,...}` — какие виджеты включить
- `layout` — `portrait` / `landscape` / `auto`
- `enumOverrides` — кастомные имена runEnum-команд (если у машины своя номенклатура)
- `cssVars` — переопределения CSS-переменных (для high-DPI / больших экранов)

**Выбор профиля** (`js/profile-loader.js`) по приоритету:
1. URL hash `#profile=j7` — dev/тестинг
2. localStorage `'profile'` — user manual override
3. `getCarData()` — определение по модели/VIN от хоста
4. Ориентация экрана — fallback heuristic (portrait → j7, landscape → j8)

**Добавить новую машину:** создать `js/profiles/<id>.js`, зарегистрировать в `window.PROFILES.<id>`,
подключить в `index.html`. Loader подберёт автоматически если совпадёт по модели/VIN.

## Разработка

В Chrome открой `index.html` через локальный сервер (`python3 -m http.server 8080`,
затем http://localhost:8080) — `api.js` подставит фейковые данные если `window.androidApi`
отсутствует. Это позволяет верстать и логику отлаживать без головы.

## Установка на ГУ

1. Скачать актуальный `drive-j7-web-v*.zip` из корня репо (или из Releases).
2. В JCarTools интерфейсе → выбор web-расширения → указать этот zip.
3. JCarTools распакует и установит как extension с id `drive_j7_web`.

См. репо [`JCarTools/core_manifest`](https://github.com/JCarTools/core_manifest)
для документации API.

### Сборка zip из исходников

```bash
cd DriveJ7-Web
zip -r drive-j7-web-v$(node -p "require('./manifest.json').version").zip \
  manifest.json index.html css js icons img \
  -x "*.DS_Store" "*/.idea/*"
```

## Лицензия

MIT
