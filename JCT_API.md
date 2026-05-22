# JCarTools API — справочник имён (актуализирован по дампу DesaySV J7)

Источники:
- Манифест: https://github.com/JCarTools/core_manifest
- Реальный дамп через `api.getRunEnum()` на ГУ DesaySV J7 (2026-05-21)

**Реальность отличается от манифеста** — поэтому дамп с конкретного ГУ важнее
теоретической документации. Этот файл — синтез: что точно поддерживается на
DesaySV J7-сборке.

`api.getRunEnum()` возвращает массив **объектов**, не строк:
`{ "RunEnum": "MEDIA_PLAY", "RunEnumText": "Медиа плей" }`

---

## runEnum — реально доступные команды на DesaySV J7

### Media (4 команды)
- `MEDIA_PLAY`  — «Медиа плей»
- `MEDIA_PAUSE` — «Медиа пауза»
- `MEDIA_NEXT`  — «Медиа следующий трек»
- **`MEDIA_BLACK` — «Медиа предыдущий трек»** ← НЕ «чёрный экран» вопреки манифесту

### Климат — toggle
- `heat_wheel_on` / `heat_wheel_off`              — подогрев руля
- `heat_windshield_on` / `heat_windshield_off`    — обогрев лоб. стекла
- `heat_rearwindow_on` / `heat_rearwindow_off`    — обогрев зад. стекла
- `Recirculation_On` / `Recirculation_Off`        — рециркуляция

### Сиденья передние (level 0..3)
- Подогрев: `heat_seat_l_0..3` (водитель), `heat_seat_r_0..3` (пассажир)
- Вентиляция: `vent_seat_l_0..3` (водитель), `vent_seat_r_0..3` (пассажир)

### Сиденья задние (level _off, _1, _2, _3) — ВАЖНО: off через `_off`, не `_0`
- `heat_zad_seat_l_off`, `heat_zad_seat_l_1`, `heat_zad_seat_l_2`, `heat_zad_seat_l_3`
- `heat_zad_seat_r_off`, `heat_zad_seat_r_1`, `heat_zad_seat_r_2`, `heat_zad_seat_r_3`

### Память сидений водителя
- `voditel_seat_1`, `voditel_seat_2`, `voditel_seat_3` — позиции 1/2/3
- `voditel_seat_NA` — сохранить текущую посадку (bonus)

### Системные / навигация (не используем)
- `GO_TO_FP`, `GO_TO_DD`, `TOGGLE_GO_FP`, `TOGGLE_GO_FP_CPP`, `GO_CPP_TO_FP`, `TOGGLE_CPP_FP`
- `RUN_BLACK`, `OPEN_GHTORKA`, `CLOSE_GHTORKA`, `VIDEO_VIDITEL`
- `GLOBAL_BACK`, `GLOBAL_HOME`, `RUN_FUN_CAR`, `RUN_APP_BURO`, `RUN_SPECS_FOCUS`
- `DEV_START_APP_NPDV`, `VIEW_ALL_MESSAGE`, `GO_fSiknik_or`, `h_fishik_off`

---

## ОТСУТСТВУЕТ на DesaySV J7 (не пытаться слать)

- **Температура салона:** `Driver_Temp_Up/Down`, `Passenger_Temp_Up/Down` — нет
- **Громкость через runEnum:** `Volume_Up`, `Volume_Down` — нет
  - Использовать прямые методы `api.setVolume(v)` / `api.getVolume()` (нативный `setvol`/`getvol`)
- **AUTO / A/C:** `AUTO_On/Off`, `AC_On/Off` — нет
- **Вентилятор:** `fan_*`, `fan_up/down` — нет
- **MEDIA_PLAY_PAUSE** — нет (toggle собираем из PLAY/PAUSE по `lastPlayStat`)

---

## getCarData — НЕ РАБОТАЕТ на DesaySV J7

Все имена (`all`, `state`, `car`, `vehicle`, `heat`, `seats`, `fuel`, `speed`,
`rpm`, `engine`, `outTemp`, `driverTemp`, `passengerTemp`, `battery`, `rulHeat`,
`lobHeat`, `zadHeat`) возвращают `{"error":"unknown_data"}`.

**Импликация:** мы НЕ можем читать состояние машины через JCT. UI остаётся
полностью optimistic — реальное положение HVAC-кнопок (подогревы, рециркуляция)
не синхронизируется со штатной шторкой. Polling в `syncFromCarData` тратит
ресурсы впустую — можно отключить, но не критично.

---

## События `onAndroidEvent` — реально приходят на DesaySV J7

Реально видели:
- `gps` — `{ lat, lon, speed, heading }` приходит каждую секунду
- `musicInfo` — должен приходить (поля по манифесту: PlayStat, SongName, SongArtist,
  SongAlbum, SongAlbumPicture, Trpos, Trdur). **Trpos/Trdur приходят в миллисекундах**
  (на типичные значения >10000), не в секундах как заявлено в манифесте.

Из манифеста ещё перечисляется (но фактически на ГУ не наблюдалось):
`weather`, `theme`, `LogData`, `ping`, `hud`, `GPSSignalQuality`, `rpm`, `speed`.

---

## Прочее API

- `onJsReady(token)` — обязательный вызов после загрузки страницы (без таймаута)
- `onClose(token)`, `onSettings(token)`
- `setBright(token, v)` — яркость
- `getvol(token)`, `setvol(token, v)` — громкость (рабочий путь вместо Volume_*)
- `runApp(token, pkg)`, `getUserApps(token)` — приложения. Возвращают объекты с
  полями `name`, `package`, `icon` (icon как base64 без data-префикса)
- `getRunEnum(token)` — массив **объектов** `{RunEnum, RunEnumText}`, не строк!
- `runEnum(token, name)`
- `getFileList(token)`, `getFile(token, name)`

Токен: `SECURE_TOKEN_2025`.
