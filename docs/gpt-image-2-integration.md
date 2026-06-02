# GPT Image 2 — как это устроено (документация)

Документ описывает, как в проекте подключена модель **gpt-image-2** (генерация
и редактирование изображений через memefast), как картинки сохраняются в TOS и
как добавлять новые модели/настройки. Сохрани его — по нему проще дорабатывать.

---

## 1. Общая схема

```
Браузер (Studio)                Vercel (/api/*)               Внешние сервисы
─────────────────               ───────────────               ───────────────
ImageStudio.jsx
  │  собирает параметры
  ▼
muapi.js
  │  POST /v1/images/generations   ──────────────────────────►  memefast.top
  │  POST /v1/images/edits  (FormData)                          (gpt-image-2)
  │◄─ url или base64 ─────────────────────────────────────────
  │
  │  показывает картинку СРАЗУ (оптимистично)
  │
  └─ в фоне: persistImageToTOS()
         POST /api/upload-file ──► TOS (images/…)  ► постоянный URL
         POST /api/gallery     ──► TOS (gallery/{userId}/entries.json)
```

Главный принцип проекта: **всё хранится в TOS** (Volcano Object Storage).
Картинки/видео/аудио заливаются в бакет, а ссылки на CDN от поставщиков (которые
протухают) не сохраняются как постоянные.

---

## 2. Файлы, которые участвуют

| Файл | За что отвечает |
|------|-----------------|
| `packages/studio/src/models.js` | Каталог моделей и их параметры (enum-ы), хелперы, опции маршрутизации |
| `packages/studio/src/muapi.js` | Вызовы API memefast: генерация, редактирование, заливка в TOS |
| `packages/studio/src/components/ImageStudio.jsx` | UI Студии фото: тулбар, дропдауны, запуск генерации |
| `app/api/upload-file/route.js` | Заливка файла в TOS (через сервер) + presigned PUT URL |
| `app/api/gallery/route.js` | Сохранение записи в галерею + зеркалирование медиа в TOS |

---

## 3. Каталог моделей — `models.js`

Модель описывается объектом. Поля `inputs` — это список настроек: ключ = имя
поля API, `enum` = варианты для выпадающего списка, `default` = значение по
умолчанию.

```js
// Генерация (text → image)  →  POST /v1/images/generations
export const t2iModels = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    apiId: "gpt-image-2",          // имя модели, которое уходит в API
    inputs: {
      prompt:  { type: "string" },
      size:    { enum: ["1024x1024","1536x1024","1024x1536","2048x2048",
                        "2048x1152","3840x2160","2160x3840"], default: "1024x1024" },
      quality: { enum: ["auto","high","medium","low"], default: "auto" },
      format:  { enum: ["jpeg","png","webp"], default: "jpeg" },
    },
  },
];

// Редактирование (image → image)  →  POST /v1/images/edits (multipart/form-data)
export const i2iModels = [
  {
    id: "gpt-image-2-edit",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    editEndpoint: true,            // ← флаг: использовать /v1/images/edits
    inputs: {
      prompt:     { type: "string" },
      size:       { enum: [...], default: "1024x1024" },
      quality:    { enum: ["auto","high","medium","low"], default: "auto" },
      format:     { enum: ["jpeg","png","webp"], default: "jpeg" },
      background: { enum: ["auto","transparent","opaque"], default: "auto" },
      moderation: { enum: ["auto","low"], default: "auto" },
    },
  },
];
```

### Важные детали
- **`size`, а не `aspect_ratio`.** gpt-image-2 принимает точные размеры. Поэтому
  хелпер `getQualityFieldForModel` возвращает `'size'`, если у модели есть
  `inputs.size.enum`, и выбранное значение уходит в API как `params.size`.
- Кнопка «Соотношение сторон» **скрыта**, если у модели нет `aspect_ratio`.
- `'auto'` убран из списка размеров — API его не принимает.

### Хелперы для UI
```js
getImageInputOptions(id, "quality")   // → массив вариантов из inputs.quality.enum
getImageInputDefault(id, "format")    // → default из inputs.format.default
```
Работают и для t2i, и для i2i. Благодаря им любой новый параметр (если добавить
его в `inputs`) автоматически появится в тулбаре — отдельный код писать не нужно.

---

## 4. Вызовы API — `muapi.js`

### Генерация — `generateImage()`
```js
POST {BASE_URL}/v1/images/generations
Headers: Authorization: Bearer <apiKey>, Content-Type: application/json
Body: {
  model: "gpt-image-2",   // + суффикс маршрутизации, см. §6
  prompt, n: 1,
  size, quality,
  format: "jpeg"          // по умолчанию jpeg
}
```

### Редактирование — `generateImageEdit()`
Используется, если у модели `editEndpoint: true`. Отправляется **FormData**
(multipart), без заголовка Content-Type (его проставляет браузер):
```js
POST {BASE_URL}/v1/images/edits
Headers: Authorization: Bearer <apiKey>
FormData:
  model, prompt, n, size, quality, format, background, moderation,
  image (одна или несколько — до 16; каждая скачивается как blob и добавляется)
```
Роутится через `generateI2I()`:
```js
export async function generateI2I(apiKey, params) {
  const modelInfo = getModelById(params.model);
  if (modelInfo?.editEndpoint) return generateImageEdit(apiKey, params);
  return generateImage(apiKey, params);
}
```

### Разбор ответа — `extractImageUrl()`
API может вернуть URL **или** base64 (`b64_json`). Хелпер вытаскивает картинку из
любого формата ответа. base64 превращается в `data:image/...;base64,...`.

---

## 5. Сохранение в TOS + мгновенный показ

**Проблема, которую решили:** раньше код ждал генерацию (≈30–250 c у API) **плюс**
скачивание и повторную заливку в TOS — и только потом показывал картинку. Долго.

**Решение — оптимистичный показ:**
1. `generateImage` возвращает «сырой» URL/base64 **сразу**, не дожидаясь TOS.
2. В `runGeneration` (ImageStudio) картинка показывается мгновенно
   (`addToHistory`).
3. В фоне:
   - `persistImageToTOS(rawUrl)` → `POST /api/upload-file` → сервер заливает в
     TOS (`images/…`) и возвращает постоянный URL;
   - URL в истории/на холсте подменяется на TOS-ссылку;
   - запись сохраняется в `localStorage` и в галерею (`POST /api/gallery`).
4. **base64 не пишется в localStorage** до заливки (иначе переполнение квоты).

Итог: время на сайте = время генерации API, без лишних задержек.

### `app/api/upload-file/route.js`
- `POST` — принимает `{ image: "data:..." }` или `{ url: "https://..." }`,
  декодирует/скачивает байты и кладёт в TOS. Папка выбирается по content-type:
  `videos/`, `audio/` или `images/`.
- `GET ?filename=&type=` — отдаёт **presigned PUT URL**: браузер может залить
  файл напрямую в TOS, минуя лимит тела Vercel в 4.5 МБ (так работает загрузка
  референсов для видео).

### `app/api/gallery/route.js`
- `GET` — читает `gallery/{userId}/entries.json` из TOS.
- `POST` — `maybeUploadMediaToTOS()` скачивает медиа с CDN и зеркалирует в TOS
  (`videos/`/`audio/`/`images/`), затем дописывает запись в начало `entries.json`.

---

## 6. Выбор приоритета (маршрутизация memefast)

memefast умеет роутить по суффиксу в имени модели. Клиент выбирает стратегию
кнопкой **«Приоритет»** в тулбаре:

| Метка в UI | Суффикс | Значение |
|------------|---------|----------|
| Авто       | (нет)   | обычная маршрутизация |
| Быстрее    | `:nitro`| максимальная скорость |
| Дешевле    | `:floor`| минимальная цена |
| Стабильнее | `:stable`| максимальная надёжность |

В `muapi.js`:
```js
function applyRouting(modelId, routing) {
  if (routing && routing !== 'default') return `${modelId}:${routing}`;
  return modelId;
}
// пример: "gpt-image-2" + "nitro" → "gpt-image-2:nitro"
```
memefast срезает суффикс перед отправкой апстриму — апстрим видит чистое имя.

> Важно: суффикс — фича **memefast**. К видео Seedance (идёт напрямую через
> Volcano Ark, не через memefast) он **не применяется**.

---

## 7. Локализация настроек

Значения переведены на русский, но в API уходят **оригинальные** ключи. Словари
в `ImageStudio.jsx`:
```js
QUALITY_LABELS    = { auto:"Авто", high:"Высокое", medium:"Среднее", low:"Низкое" }
BACKGROUND_LABELS = { auto:"Авто", transparent:"Прозрачный", opaque:"Непрозрачный" }
MODERATION_LABELS = { auto:"Авто", low:"Низкая" }
routingLabels     = { default:"Авто", nitro:"Быстрее", floor:"Дешевле", stable:"Стабильнее" }
```
`SimpleDropdown` принимает проп `labels` — показывает русский текст, а
`onSelect` отдаёт оригинальное значение. **Форматы (JPEG/PNG/WEBP) не переводятся.**

Что значит **«Фон»** при редактировании:
- `auto` — модель решает сама (обычно непрозрачный);
- `transparent` — прозрачный фон (нужен PNG/WEBP, у JPEG прозрачности нет);
- `opaque` — принудительно непрозрачный.

---

## 8. Как добавить НОВУЮ модель изображения

1. В `models.js` добавь объект в `t2iModels` (и/или `i2iModels` с
   `editEndpoint: true`, если есть редактирование). Пропиши `inputs` с нужными
   `enum`/`default`.
2. Всё остальное подтянется автоматически:
   - дропдауны размера/качества/формата/фона/модерации появятся, если есть
     соответствующие `inputs`;
   - кнопка «Приоритет» работает для всех моделей memefast;
   - заливка в TOS и сохранение в галерею — общие.
3. Если у значения должна быть русская подпись — добавь её в нужный словарь
   (`QUALITY_LABELS` и т.п.). Без подписи покажется оригинальное значение.

---

## 9. История изменений (коммиты)

```
2a9b0c2  Add gpt-image-2 to t2iModels
cfe0c30  Add gpt-image-2 editing: POST /v1/images/edits via multipart/form-data
255f104  gpt-image-2: full size list (up to 4K) and quality options
654dbdb  Fix generation/editing: correct size param, TOS upload, format
b026465  Add Quality/Format/Background/Moderation dropdowns to toolbar
4613a95  Translate parameter values to Russian (formats kept as-is)
1f7f711  Show generated image instantly, mirror to TOS in the background
7f04f87  Add routing strategy selector (nitro/floor/stable)
```
