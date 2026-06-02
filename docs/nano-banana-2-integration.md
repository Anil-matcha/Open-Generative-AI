# Nano Banana 2 (gemini-3.1-flash-image-preview) — как это устроено

Вторая модель изображений в проекте. В отличие от gpt-image-2 (OpenAI-формат),
она работает через **нативный Gemini API** (`generateContent`). Документ
описывает, что и где сделано, чтобы потом было проще дорабатывать.

> Базовую механику (TOS, мгновенный показ, галерея, маршрутизация) смотри в
> `docs/gpt-image-2-integration.md` — здесь только то, что специфично для Gemini.

---

## 1. Чем отличается от gpt-image-2

| | gpt-image-2 | Nano Banana 2 (Gemini) |
|---|---|---|
| Эндпоинт | `POST /v1/images/generations` и `/v1/images/edits` | `POST /v1beta/models/{model}:generateContent` |
| Формат | OpenAI (JSON / multipart) | Gemini native (`contents` + `generationConfig`) |
| Размер | `size` (1024×1024 … 4K) | `imageConfig.imageSize` (1K/2K/4K/512) |
| Соотношение | нет (только size) | `imageConfig.aspectRatio` (14 вариантов) |
| Референс | multipart-файл | base64 `inline_data` в запросе |
| Ответ | url или `b64_json` | base64 в `candidates[].content.parts[].inlineData` |
| Редактирование | отдельный эндпоинт `/v1/images/edits` | тот же `generateContent` + inline-картинки |

---

## 2. Что в каталоге — `models.js`

```js
// Общий список соотношений сторон для Gemini
const GEMINI_AR = ["1:1","16:9","9:16","4:3","3:4","2:3","3:2",
                   "4:5","5:4","1:4","4:1","1:8","8:1","21:9"];

// Генерация (t2i)
{
  id: "gemini-3.1-flash-image-preview",
  name: "Nano Banana 2",
  apiId: "gemini-3.1-flash-image-preview",   // ← попадает прямо в URL
  inputs: {
    prompt:       { type: "string" },
    aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
    imageSize:    { enum: ["1K","2K","4K","512"], default: "1K" },
  },
}

// Редактирование (i2i) — БЕЗ editEndpoint, потому что Gemini редактирует
// тем же generateContent, просто с inline-референсами
{
  id: "gemini-3.1-flash-image-preview-edit",
  name: "Nano Banana 2",
  apiId: "gemini-3.1-flash-image-preview",
  inputs: { prompt, aspect_ratio: GEMINI_AR, imageSize: [...] },
}
```

**Как модель распознаётся в коде:** по регулярке `/gemini.*image/i` на `apiId`.
Если в имени есть `gemini` и `image` — запрос идёт в `generateGeminiImage`.

**Важный фикс:** `getModelById` теперь ищет и в `i2iModels`:
```js
export const getModelById = (id) =>
  t2iModels.find(m => m.id === id) || i2iModels.find(m => m.id === id);
```
Без этого редактирование (и Gemini, и gpt) не находило свою модель.

---

## 3. Вызов API — `muapi.js`

### Маршрутизация в `generateImage()`
```js
if (/gemini.*image/i.test(baseModelId)) {
    return generateGeminiImage(apiKey, baseModelId, params);
}
```

### `generateGeminiImage(apiKey, baseModelId, params)`
Строит запрос в нативном формате Gemini:
```js
POST {BASE_URL}/v1beta/models/{model}{:routing}:generateContent
Headers: Authorization: Bearer <apiKey>, Content-Type: application/json
Body:
{
  "contents": [
    { "parts": [
        { "text": "<prompt>" },
        { "inline_data": { "mime_type": "image/png", "data": "<base64>" } }  // референсы (опц.)
    ]}
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"],
    "imageConfig": {
      "aspectRatio": "1:1",   // из params.aspect_ratio
      "imageSize":   "1K"     // из params.imageSize
    }
  }
}
```
- `BASE_URL` в браузере = `/api/mf` (прокси Next.js → `memefast.top`, обходит CORS).
  Прокси пропускает любой путь, включая `/v1beta/...` (см. `middleware.js`).
- **Суффикс маршрутизации** (`:nitro`/`:floor`/`:stable`) вставляется в имя модели
  в URL: `…/gemini-3.1-flash-image-preview:nitro:generateContent`.
- Возвращает **сырой base64** сразу — показ мгновенный, заливка в TOS в фоне
  (логика общая, в `runGeneration`).

### Хелперы
```js
// URL картинки → Gemini inline_data { mime_type, data(base64) }
async function urlToInlineData(url) { … FileReader → dataURL → разбор … }

// Достаёт base64 из ответа Gemini
function extractGeminiImage(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  // ищем part.inlineData / part.inline_data → `data:${mime};base64,${data}`
}
```

---

## 4. UI — `ImageStudio.jsx`

Появился новый дропдаун **«Разрешение»** (imageSize: 1K/2K/4K/512). Он
показывается, только если у модели есть `inputs.imageSize` (то есть для Gemini).

- Состояние: `selectedImageSize`
- Сбрасывается на дефолт при смене модели / загрузке референса / сбросе
- Передаётся в `snap.selectedImageSize` → `genParams.imageSize`

**Соотношение сторон** для Gemini берётся из обычной кнопки «Соотношение сторон»
(она появляется, потому что у модели есть `inputs.aspect_ratio`). У gpt-image-2
этой кнопки нет — там используется размер.

Итог по тулбару:
| Модель | Кнопки в тулбаре |
|--------|------------------|
| GPT Image 2 | Размер, Качество, Формат, Приоритет |
| Nano Banana 2 | Соотношение сторон, Разрешение, Приоритет |

---

## 5. Как добавить следующую Gemini-модель

1. Добавь объект в `t2iModels` (и `i2iModels`, если нужно редактирование) с
   `apiId`, в котором есть `gemini` и `image` — тогда сработает авто-роутинг в
   `generateGeminiImage`.
2. Пропиши `inputs.aspect_ratio` и `inputs.imageSize` (или другие нужные поля).
3. Дропдауны подтянутся автоматически. Отдельный код в muapi/UI писать не нужно.

---

## 6. Коммит

```
5f7d712  Add Nano Banana 2 (gemini-3.1-flash-image-preview) image model
```
Изменённые файлы: `models.js`, `muapi.js`, `components/ImageStudio.jsx`.
