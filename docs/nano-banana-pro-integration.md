# Nano Banana Pro (gemini-3-pro-image-preview) — как это устроено

Третья модель изображений. Технически — **полный аналог Nano Banana 2**: тот же
нативный Gemini API (`generateContent`), те же параметры. Отличается только
именем модели (`gemini-3-pro-image-preview`) — это «pro»-версия (выше качество,
дороже).

> Полное описание механики Gemini-моделей — в `docs/nano-banana-2-integration.md`.
> Базовая механика (TOS, мгновенный показ, галерея, маршрутизация) —
> в `docs/gpt-image-2-integration.md`. Здесь — только то, что относится к Pro.

---

## 1. Что именно добавили

**Только запись в каталоге `models.js`.** Код в `muapi.js` и `ImageStudio.jsx`
**не трогали** — он уже умеет работать с любой Gemini-моделью.

```js
// Генерация (t2i)
{
  id: "gemini-3-pro-image-preview",
  name: "Nano Banana Pro",
  apiId: "gemini-3-pro-image-preview",   // ← попадает прямо в URL
  inputs: {
    prompt:       { type: "string" },
    aspect_ratio: { enum: GEMINI_AR, default: "1:1" },   // те же 14 соотношений
    imageSize:    { enum: ["1K","2K","4K","512"], default: "1K" },
  },
}

// Редактирование (i2i) — без editEndpoint (Gemini редактирует тем же
// generateContent с inline-референсами)
{
  id: "gemini-3-pro-image-preview-edit",
  name: "Nano Banana Pro",
  apiId: "gemini-3-pro-image-preview",
  inputs: { prompt, aspect_ratio: GEMINI_AR, imageSize: [...] },
}
```

---

## 2. Почему ничего больше не понадобилось

Маршрутизация в `muapi.js` идёт по регулярке на `apiId`:
```js
if (/gemini.*image/i.test(baseModelId)) {
    return generateGeminiImage(apiKey, baseModelId, params);
}
```
`gemini-3-pro-image-preview` содержит `gemini` и `image` → автоматически попадает
в `generateGeminiImage`, который:
- строит запрос `POST /v1beta/models/gemini-3-pro-image-preview:generateContent`
- ставит `generationConfig.imageConfig` (aspectRatio + imageSize)
- вшивает референсы как base64 `inline_data`
- парсит `candidates[].content.parts[].inlineData`
- поддерживает суффикс маршрутизации (`:nitro`/`:floor`/`:stable`)

Дропдауны в тулбаре (Соотношение сторон, Разрешение, Приоритет) появляются
автоматически, потому что читаются из `inputs` модели.

---

## 3. Запрос (для справки)

```
POST https://memefast.top/v1beta/models/gemini-3-pro-image-preview:generateContent
Headers: Authorization: Bearer <token>, Content-Type: application/json
Body:
{
  "contents": [
    { "parts": [
        { "text": "<prompt>" },
        { "inline_data": { "mime_type": "image/png", "data": "<base64>" } }  // референс (опц.)
    ]}
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"],
    "imageConfig": { "aspectRatio": "1:1", "imageSize": "1K" }
  }
}
```
Ответ — base64 в `candidates[0].content.parts[].inlineData.data`.

---

## 4. Отличие Pro от Flash (Nano Banana 2)

| | Nano Banana 2 | Nano Banana Pro |
|---|---|---|
| Модель | `gemini-3.1-flash-image-preview` | `gemini-3-pro-image-preview` |
| Класс | Flash (быстрее, дешевле) | Pro (качественнее, дороже) |
| Параметры | aspectRatio + imageSize | те же |
| Эндпоинт / формат | generateContent / Gemini native | те же |

Для пользователя в Studio они выглядят одинаково и имеют одинаковые настройки —
выбор между ними это выбор скорость/цена ↔ качество.

---

## 5. Как добавить ещё одну Gemini-модель

1. Добавь блок в `t2iModels` (и `i2iModels`) с `apiId`, где есть `gemini` и
   `image`.
2. Пропиши `inputs.aspect_ratio` (= `GEMINI_AR`) и `inputs.imageSize`.
3. Всё. Код в muapi/UI не трогаешь.

---

## 6. Коммит

```
81da08a  Add Nano Banana Pro (gemini-3-pro-image-preview) image model
```
Изменён только `models.js`.
