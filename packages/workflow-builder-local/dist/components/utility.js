"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.videoModels = exports.videoCombinerModels = exports.textModels = exports.presets = exports.imageModels = exports.downloadFile = exports.concatModels = exports.audioModels = exports.apiNodeModels = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _reactHotToast = require("react-hot-toast");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var imageModels = exports.imageModels = [{
  id: "image-passthrough",
  name: "Input Image",
  input_params: {
    properties: {
      "image_url": {
        "examples": [],
        "description": "URL of the input image.",
        "field": "image",
        "type": "string",
        "title": "Image URL",
        "name": "image_url"
      }
    },
    required: ["prompt"]
  }
}, {
  id: "gpt-image-1.5",
  name: "GPT Image 1.5",
  input_params: {}
}, {
  id: "nano-banana",
  name: "Nano Banana",
  input_params: {}
}, {
  id: "nano-banana-edit",
  name: "Nano Banana Edit",
  input_params: {}
}, {
  id: "nano-banana-pro",
  name: "Nano Banana Pro",
  input_params: {}
}, {
  id: "nano-banana-pro-edit",
  name: "Nano Banana Pro Edit",
  input_params: {}
}, {
  id: "flux-schnell",
  name: "Flux Schnell",
  input_params: {}
}, {
  id: "flux-2-dev",
  name: "Flux 2 Dev",
  input_params: {}
}, {
  id: "flux-2-dev-edit",
  name: "Flux 2 Dev Edit",
  input_params: {}
}, {
  id: "flux-2-flex",
  name: "Flux 2 Flex",
  input_params: {}
}, {
  id: "flux-2-flex-edit",
  name: "Flux 2 Flex Edit",
  input_params: {}
}, {
  id: "flux-2-pro",
  name: "Flux 2 Pro",
  input_params: {}
}, {
  id: "flux-2-pro-edit",
  name: "Flux 2 Pro Edit",
  input_params: {}
}, {
  id: "bytedance-seedream-v4",
  name: "Bytedance Seedream v4",
  input_params: {}
}, {
  id: "bytedance-seedream-edit-v4",
  name: "Bytedance Seedream Edit v4",
  input_params: {}
}, {
  id: "bytedance-seedream-v4.5",
  name: "Seedream v4.5",
  input_params: {}
}, {
  id: "bytedance-seedream-v4.5-edit",
  name: "Seedream v4.5 Edit",
  input_params: {}
}, {
  id: "wan2.5-text-to-image",
  name: "Wan 2.5 Text to Image",
  input_params: {}
}, {
  id: "wan2.5-image-edit",
  name: "Wan 2.5 Image Edit",
  input_params: {}
}, {
  id: "wan2.6-text-to-image",
  name: "Wan 2.6 Text to Image",
  input_params: {}
}, {
  id: "wan2.6-image-edit",
  name: "Wan 2.6 Image Edit",
  input_params: {}
}, {
  id: "qwen-image",
  name: "Qwen Image",
  input_params: {}
}, {
  id: "qwen-image-edit-2511",
  name: "Qwen Image Edit 2511",
  input_params: {}
}, {
  id: "qwen-image-edit",
  name: "Qwen Image Edit",
  input_params: {}
}, {
  id: "qwen-image-edit-plus",
  name: "Qwen Image Edit Plus",
  input_params: {}
}, {
  id: "qwen-image-edit-plus-lora",
  name: "Qwen Image Edit Plus (LoRA)",
  input_params: {}
}, {
  id: "z-image-turbo",
  name: "Z Image Turbo",
  input_params: {}
}, {
  id: "chroma-image",
  name: "Chroma Image",
  input_params: {}
}, {
  id: "kling-o1-text-to-image",
  name: "Kling O1 Text to Image",
  input_params: {}
}, {
  id: "kling-o1-edit-image",
  name: "Kling O1 Image Edit",
  input_params: {}
}, {
  id: "grok-imagine-text-to-image",
  name: "Grok Imagine",
  input_params: {}
}, {
  id: "hunyuan-image-2.1",
  name: "Hunyuan Image 2.1",
  input_params: {}
}, {
  id: "hunyuan-image-3.0",
  name: "Hunyuan Image 3.0",
  input_params: {}
}, {
  id: "google-imagen4",
  name: "Google Imagen 4",
  input_params: {}
}, {
  id: "google-imagen4-fast",
  name: "Google Imagen 4 Fast",
  input_params: {}
}, {
  id: "google-imagen4-ultra",
  name: "Google Imagen 4 Ultra",
  input_params: {}
}, {
  id: "midjourney-v7-text-to-image",
  name: "Midjourney v7 Text to Image",
  input_params: {}
}, {
  id: "midjourney-v7-image-to-image",
  name: "Midjourney v7 Image to Image",
  input_params: {}
}, {
  id: "midjourney-v7-omni-reference",
  name: "Midjourney v7 Omni Reference",
  input_params: {}
}, {
  id: "midjourney-v7-style-reference",
  name: "Midjourney v7 Style Reference",
  input_params: {}
}, {
  id: "vidu-q2-text-to-image",
  name: "Vidu Q2 Text to Image",
  input_params: {}
}, {
  id: "vidu-q2-reference-to-image",
  name: "Vidu Q2 Reference Image",
  input_params: {}
}];
var videoModels = exports.videoModels = [{
  id: "video-passthrough",
  name: "Input Video",
  input_params: {
    properties: {
      "video_url": {
        "examples": [],
        "description": "URL of the input video.",
        "field": "video",
        "type": "string",
        "title": "Video URL",
        "name": "video_url"
      }
    },
    required: ["prompt"]
  }
}, {
  id: "seedance-lite-i2v",
  name: "Seedance Lite I2V",
  input_params: {}
}, {
  id: "seedance-lite-t2v",
  name: "Seedance Lite T2V",
  input_params: {}
}, {
  id: "seedance-pro-t2v",
  name: "Seedance Pro T2V",
  input_params: {}
}, {
  id: "seedance-pro-i2v",
  name: "Seedance Pro I2V",
  input_params: {}
}, {
  id: "seedance-pro-t2v-fast",
  name: "Seedance Pro T2V Fast",
  input_params: {}
}, {
  id: "seedance-pro-i2v-fast",
  name: "Seedance Pro I2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-i2v",
  name: "Seedance v1.5 Pro I2V",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-t2v",
  name: "Seedance v1.5 Pro T2V",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-i2v-fast",
  name: "Seedance v1.5 Pro I2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-t2v-fast",
  name: "Seedance v1.5 Pro T2V Fast",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-video-extend",
  name: "Seedance v1.5 Pro Video Extend",
  input_params: {}
}, {
  id: "seedance-v1.5-pro-video-extend-fast",
  name: "Seedance v1.5 Pro Video Extend Fast",
  input_params: {}
}, {
  id: "veo3.1-image-to-video",
  name: "Veo3.1 I2V",
  input_params: {}
}, {
  id: "veo3.1-text-to-video",
  name: "Veo3.1 T2V",
  input_params: {}
}, {
  id: "veo3.1-fast-image-to-video",
  name: "Veo3.1 Fast I2V",
  input_params: {}
}, {
  id: "veo3.1-fast-text-to-video",
  name: "Veo3.1 Fast T2V",
  input_params: {}
}, {
  id: "wan2.2-text-to-video",
  name: "Wan 2.2 T2V",
  input_params: {}
}, {
  id: "wan2.2-image-to-video",
  name: "Wan 2.2 I2V",
  input_params: {}
}, {
  id: "wan2.2-5b-fast-t2v",
  name: "Wan 2.2 5B Fast T2V",
  input_params: {}
}, {
  id: "wan2.2-animate",
  name: "Wan 2.2 Animate",
  input_params: {}
}, {
  id: "wan2.2-edit-video",
  name: "Wan 2.2 Video Edit",
  input_params: {}
}, {
  id: "wan2.2-spicy-image-to-video",
  name: "Wan 2.2 Spicy I2V",
  input_params: {}
}, {
  id: "wan2.2-spicy-video-extend",
  name: "Wan 2.2 Spicy Extend",
  input_params: {}
}, {
  id: "wan2.5-text-to-video",
  name: "Wan 2.5 T2V",
  input_params: {}
}, {
  id: "wan2.5-image-to-video",
  name: "Wan 2.5 I2V",
  input_params: {}
}, {
  id: "wan2.5-text-to-video-fast",
  name: "Wan 2.5 Fast T2V",
  input_params: {}
}, {
  id: "wan2.5-image-to-video-fast",
  name: "Wan 2.5 Fast I2V",
  input_params: {}
}, {
  id: "wan2.6-text-to-video",
  name: "Wan 2.6 T2V",
  input_params: {}
}, {
  id: "wan2.6-image-to-video",
  name: "Wan 2.6 I2V",
  input_params: {}
}, {
  id: "openai-sora",
  name: "OpenAI Sora",
  input_params: {}
}, {
  id: "openai-sora-2-text-to-video",
  name: "Sora 2 T2V",
  input_params: {}
}, {
  id: "openai-sora-2-image-to-video",
  name: "Sora 2 I2V",
  input_params: {}
}, {
  id: "openai-sora-2-pro-text-to-video",
  name: "Sora 2 Pro T2V",
  input_params: {}
}, {
  id: "openai-sora-2-pro-image-to-video",
  name: "Sora 2 Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-pro-t2v",
  name: "Kling v2.5 Turbo Pro T2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-pro-i2v",
  name: "Kling v2.5 Turbo Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.5-turbo-std-i2v",
  name: "Kling v2.5 Turbo Std I2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-t2v",
  name: "Kling v2.6 Pro T2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-i2v",
  name: "Kling v2.6 Pro I2V",
  input_params: {}
}, {
  id: "kling-v2.6-pro-motion-control",
  name: "Kling v2.6 Pro Motion Control",
  input_params: {}
}, {
  id: "kling-o1-text-to-video",
  name: "Kling O1 T2V",
  input_params: {}
}, {
  id: "kling-o1-image-to-video",
  name: "Kling O1 I2V",
  input_params: {}
}, {
  id: "kling-o1-video-edit",
  name: "Kling O1 Video Edit",
  input_params: {}
}, {
  id: "kling-o1-video-edit-fast",
  name: "Kling O1 Video Edit Fast",
  input_params: {}
}, {
  id: "kling-o1-reference-to-video",
  name: "Kling O1 Reference",
  input_params: {}
}, {
  id: "kling-o1-standard-image-to-video",
  name: "Kling O1 Standard I2V",
  input_params: {}
}, {
  id: "kling-o1-standard-reference-to-video",
  name: "Kling O1 Standard Reference",
  input_params: {}
}, {
  id: "kling-o1-standard-video-edit",
  name: "Kling O1 Standard Video Edit",
  input_params: {}
}, {
  id: "grok-imagine-text-to-video",
  name: "Grok Imagine T2V",
  input_params: {}
}, {
  id: "grok-imagine-image-to-video",
  name: "Grok Imagine I2V",
  input_params: {}
}, {
  id: "hunyuan-text-to-video",
  name: "Hunyuan T2V",
  input_params: {}
}, {
  id: "hunyuan-fast-text-to-video",
  name: "Hunyuan Fast T2V",
  input_params: {}
}, {
  id: "hunyuan-image-to-video",
  name: "Hunyuan I2V",
  input_params: {}
}, {
  id: "midjourney-v7-image-to-video",
  name: "Midjourney v7 I2V",
  input_params: {}
}, {
  id: "vidu-q2-turbo-start-end-video",
  name: "Vidu Q2 Turbo Start/End",
  input_params: {}
}, {
  id: "vidu-q2-pro-start-end-video",
  name: "Vidu Q2 Pro Start/End",
  input_params: {}
}, {
  id: "vidu-q2-reference",
  name: "Vidu Q2 Reference",
  input_params: {}
}, {
  id: "luma-modify-video",
  name: "Luma Modify Video",
  input_params: {}
}, {
  id: "luma-flash-reframe",
  name: "Luma Flash Reframe",
  input_params: {}
}, {
  id: "video-combiner",
  name: "Video Combiner",
  input_params: {}
}];
var textModels = exports.textModels = [{
  id: "text-passthrough",
  name: "Input Text",
  input_params: {
    properties: {
      "prompt": {
        "examples": [""],
        "description": "Text prompt describing the image.",
        "type": "string",
        "title": "Prompt",
        "name": "prompt"
      }
    },
    required: ["prompt"]
  }
}, {
  id: "any-llm",
  name: "Any Llm",
  input_params: {}
}, {
  id: "openrouter-vision",
  name: "Openrouter Vision",
  input_params: {}
}, {
  id: "gpt-5-nano",
  name: "GPT5 Nano",
  input_params: {}
}, {
  id: "gpt-5-mini",
  name: "GPT5 Mini",
  input_params: {}
}];
var audioModels = exports.audioModels = [{
  id: "audio-passthrough",
  name: "Input Audio",
  input_params: {
    properties: {
      "audio_url": {
        "examples": [],
        "description": "URL of the input audio.",
        "field": "audio",
        "type": "string",
        "title": "Audio URL",
        "name": "audio_url"
      }
    },
    required: ["audio_url"]
  }
}, {
  id: "suno-create-music",
  name: "Suno Create Music",
  input_params: {}
}, {
  id: "suno-extend-music",
  name: "Suno Extend Music",
  input_params: {}
}, {
  id: "suno-remix-music",
  name: "Suno Remix Music",
  input_params: {}
}, {
  id: "minimax-voice-clone",
  name: "Minimax Voice Clone",
  input_params: {}
}, {
  id: "minimax-speech-2.6-hd",
  name: "Minimax Speech 2.6 HD",
  input_params: {}
}, {
  id: "minimax-speech-2.6-turbo",
  name: "Minimax Speech 2.6 Turbo",
  input_params: {}
}];
var concatModels = exports.concatModels = [{
  id: "prompt-concatenator",
  name: "Prompt Concatenator",
  input_params: {
    properties: {
      "prompt": {
        "examples": [""],
        "description": "Text prompt describing the image.",
        "type": "string",
        "title": "Prompt",
        "name": "prompt"
      }
    },
    required: ["prompt"]
  }
}];
var videoCombinerModels = exports.videoCombinerModels = [{
  id: "video-combiner",
  name: "Video Combiner",
  input_params: {
    properties: {
      "videos_list": {
        "examples": ["https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/seedance-v2.0-i2v.mp4"],
        "description": "Upload the video clips you want to combine, in order. Each clip can be 5–60 seconds.",
        "field": "videos_list",
        "type": "array",
        "items": {
          "type": "string"
        },
        "title": "Video Clips",
        "name": "videos_list",
        "maxItems": 20
      },
      "aspect_ratio": {
        "enum": ["auto", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
        "title": "Aspect Ratio",
        "name": "aspect_ratio",
        "type": "string",
        "default": "auto",
        "description": "Output aspect ratio. 'auto' uses the aspect ratio of the first uploaded clip."
      }
    },
    required: ["videos_list"]
  }
}];
var apiNodeModels = exports.apiNodeModels = [{
  id: "wavespeed",
  name: "Wavespeed API",
  input_params: {
    properties: {
      "model_url": {
        "default": "",
        "description": "https://wavespeed.ai/models/wavespeed-ai/flux-schnell",
        "type": "string",
        "format": "text",
        "required": true
      },
      "api_key": {
        "examples": "",
        "description": "API Key of the wavespeed ai.",
        "type": "string",
        "format": "text",
        "required": true
      }
    },
    required: ["model_url", "api_key"]
  }
}, {
  id: "straico",
  name: "Straico API",
  input_params: {
    properties: {
      "model_name": {
        "enum": [],
        "description": "Name of the model (e.g. sd-xl)",
        "type": "string",
        "default": "",
        "required": true
      },
      "model_type": {
        "enum": ["chat", "image", "video", "audio"],
        "default": "chat",
        "description": "Type of the model (e.g. chat, image, video, audio)",
        "type": "string",
        "required": true
      },
      "api_key": {
        "examples": "",
        "description": "API Key for Straico.",
        "type": "string",
        "format": "text",
        "required": true
      }
    },
    required: ["model_name", "model_type", "api_key"]
  }
}, {
  id: "runware",
  name: "Runware API",
  input_params: {
    properties: {
      "api_key": {
        "description": "Runware API Key",
        "type": "string",
        "format": "text",
        "required": true
      },
      "task_type": {
        "enum": ["imageInference", "textToVideo", "imageToVideo", "upscale", "removeBackground"],
        "description": "Task type (e.g. imageInference, textToVideo, imageToVideo, upscale)",
        "type": "string",
        "default": "imageInference",
        "required": true
      },
      "model_name": {
        "enum": [],
        "description": "AIR identifier of the model",
        "type": "string",
        "default": "",
        "required": false
      }
    },
    required: ["task_type", "api_key"]
  }
}, {
  id: "genvr",
  name: "GenVR API",
  input_params: {
    properties: {
      "uid": {
        "description": "Your GenVR User ID",
        "type": "string",
        "format": "text",
        "required": true
      },
      "api_key": {
        "description": "GenVR API Key",
        "type": "string",
        "format": "text",
        "required": true
      },
      "category": {
        "description": "Model category (e.g. imagegen)",
        "type": "string",
        "format": "text",
        "required": true
      },
      "subcategory": {
        "description": "Model identifier (e.g. flux_dev)",
        "type": "string",
        "format": "text",
        "required": true
      }
    },
    required: ["uid", "api_key", "category", "subcategory"]
  }
}];
var downloadFile = exports.downloadFile = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(file_url) {
    var filename,
      response,
      signed_url,
      _response,
      blob,
      url,
      link,
      _args = arguments,
      _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          filename = _args.length > 1 && _args[1] !== undefined ? _args[1] : "download";
          if (file_url) {
            _context.n = 1;
            break;
          }
          _reactHotToast.toast.error("File URL not found");
          return _context.a(2);
        case 1:
          _context.n = 2;
          return _axios["default"].post("/api/workflow/cloudfront-signed-url", {
            url: file_url
          });
        case 2:
          response = _context.v;
          signed_url = response.data.signed_url;
          _context.p = 3;
          _context.n = 4;
          return fetch(signed_url, {
            mode: "cors"
          });
        case 4:
          _response = _context.v;
          _context.n = 5;
          return _response.blob();
        case 5:
          blob = _context.v;
          url = window.URL.createObjectURL(blob);
          link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          _context.n = 7;
          break;
        case 6:
          _context.p = 6;
          _t = _context.v;
          console.error("Download failed:", _t);
          _reactHotToast.toast.error("Download failed");
        case 7:
          return _context.a(2);
      }
    }, _callee, null, [[3, 6]]);
  }));
  return function downloadFile(_x) {
    return _ref.apply(this, arguments);
  };
}();
var presets = exports.presets = [{
  id: "empty-workflow",
  title: "Empty Workflow",
  description: "",
  icon: "plus",
  image: "",
  nodes: [],
  edges: []
}, {
  id: "image-generator",
  title: "Image Generator & Editor",
  description: "Simple text to image Generation and Editing with Wan 2.5",
  icon: "image",
  image: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg",
  nodes: [{
    id: "text1",
    position: {
      x: -69,
      y: 22
    },
    data: {
      selectedModel: {
        id: "text-passthrough",
        name: "Input Text"
      },
      formValues: {
        prompt: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
      },
      outputs: [{
        type: "text",
        value: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
      }],
      resultUrl: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design."
    },
    type: "textNode"
  }, {
    id: "image1",
    position: {
      x: 370,
      y: 250
    },
    data: {
      selectedModel: {
        id: "wan2.5-text-to-image",
        name: "Wan 2.5 Text to Image"
      },
      formValues: {
        prompt: "Ultra-detailed cinematic portrait of a futuristic AI engineer inside a holographic command center. Floating transparent UI panels, glowing blue and violet data streams, reflective surfaces, soft rim lighting, shallow depth of field, realistic skin texture, high-end sci-fi film aesthetic, 8K resolution, photorealistic, dramatic contrast, clean futuristic design.",
        width: 1024,
        height: 1024
      },
      outputs: [{
        type: "image_url",
        value: "https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"
    },
    type: "imageNode"
  }, {
    id: "text2",
    position: {
      x: 390,
      y: -235
    },
    data: {
      selectedModel: {
        id: "text-passthrough",
        name: "Input Text"
      },
      formValues: {
        prompt: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
      },
      outputs: [{
        type: "text",
        value: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
      }],
      resultUrl: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood."
    },
    type: "textNode"
  }, {
    id: "image2",
    position: {
      x: 835,
      y: 25
    },
    data: {
      selectedModel: {
        id: "wan2.5-image-edit",
        name: "Wan 2.5 Image Edit"
      },
      formValues: {
        prompt: "Enhance the lighting to be more cinematic with stronger rim light and subtle volumetric fog. Increase contrast and depth, add more glowing holographic elements around the subject, slightly darken the background for focus, improve facial realism and sharpness, maintain photorealistic style and premium sci-fi mood.",
        images_list: ["https://cdn.muapi.ai/outputs/8c6c1863ae594cb99e82884f5d3de058.jpg"],
        width: 2048,
        height: 2048
      },
      outputs: [{
        type: "image_url",
        value: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/e53f9cb2caf947f790154dada58a426c.jpg"
    },
    type: "imageNode"
  }],
  edges: [{
    id: "e1-1",
    source: "text1",
    target: "image1",
    sourceHandle: "textOutput",
    targetHandle: "imageInput",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2
    }
  }, {
    id: "e1-2",
    source: "image1",
    target: "image2",
    sourceHandle: "imageOutput",
    targetHandle: "imageInput2",
    style: {
      stroke: "#22c55e",
      strokeWidth: 2
    }
  }, {
    id: "e1-3",
    source: "text2",
    target: "image2",
    sourceHandle: "textOutput",
    targetHandle: "imageInput",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2
    }
  }]
}, {
  id: "video-generator",
  title: "Video Generator",
  description: "Simple Video Generation with Seedance Lite",
  icon: "video",
  image: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg",
  nodes: [{
    id: "text1",
    position: {
      x: -9,
      y: 30
    },
    data: {
      selectedModel: {
        id: "text-passthrough",
        name: "Input Text"
      },
      formValues: {
        prompt: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
      },
      outputs: [{
        type: "text",
        value: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
      }],
      resultUrl: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style."
    },
    type: "textNode"
  }, {
    id: "image1",
    position: {
      x: -14,
      y: -426
    },
    data: {
      selectedModel: {
        id: "bytedance-seedream-v4.5",
        name: "Seedream v4.5"
      },
      formValues: {
        prompt: "Wide cinematic shot of a glowing futuristic city built from floating geometric shapes and holographic panels. Neon blue and purple lights, soft volumetric fog, reflective surfaces, dramatic sky, ultra-realistic lighting, depth of field, 8K detail, sci-fi cinematic style, symmetrical composition.",
        aspect_ratio: "1:1",
        quality: "high"
      },
      outputs: [{
        type: "image_url",
        value: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg"
    },
    type: "imageNode"
  }, {
    id: "video1",
    position: {
      x: 624,
      y: -154
    },
    data: {
      selectedModel: {
        id: "seedance-lite-i2v",
        name: "Seedance Lite I2V"
      },
      formValues: {
        prompt: "Animate the scene with slow cinematic camera movement, subtle parallax, and smooth forward motion. Holographic elements gently pulse and shift, light rays move naturally through fog, floating structures subtly rotate, ultra-smooth transitions, realistic motion blur, film-grade animation, cinematic pacing, premium tech showcase style.",
        image_url: "https://cdn.muapi.ai/outputs/836c0912239f4f11a2ca333e26387152.jpg",
        resolution: "720p",
        duration: 5,
        camera_fixed: false
      },
      outputs: [{
        type: "video_url",
        value: "https://cdn.muapi.ai/outputs/6e1f813951b24868ad117ddca0aaa8ea.mp4"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/6e1f813951b24868ad117ddca0aaa8ea.mp4"
    },
    type: "videoNode"
  }],
  edges: [{
    id: "e1-1",
    source: "text1",
    target: "video1",
    sourceHandle: "textOutput",
    targetHandle: "videoInput",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2
    }
  }, {
    id: "e1-2",
    source: "image1",
    target: "video1",
    sourceHandle: "imageOutput",
    targetHandle: "videoInput2",
    style: {
      stroke: "#22c55e",
      strokeWidth: 2
    }
  }]
}, {
  id: "audio-generator",
  title: "Audio Generator",
  description: "Generate audio from text with Suno",
  icon: "audio",
  image: "https://images.unsplash.com/photo-1526512340740-9217d0159da9?q=80&w=500&auto=format&fit=crop",
  nodes: [{
    id: "text1",
    position: {
      x: -9,
      y: 30
    },
    data: {
      selectedModel: {
        id: "text-passthrough",
        name: "Input Text"
      },
      formValues: {
        prompt: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
      },
      outputs: [{
        type: "text",
        value: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
      }],
      resultUrl: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds."
    },
    type: "textNode"
  }, {
    id: "audio1",
    position: {
      x: 400,
      y: 100
    },
    data: {
      selectedModel: {
        id: "suno-create-music",
        name: "Suno Create Music"
      },
      formValues: {
        prompt: "Generate a cinematic ambient soundscape with deep atmospheric pads, soft evolving synth textures, subtle low-frequency pulses, and gentle high-end shimmer. The mood should feel futuristic, calm, and inspirational, suitable for a high-end AI product or cinematic workflow reveal. Clean mix, professional sound design, smooth transitions, no abrupt sounds.",
        style: "Classical",
        style_weight: 0,
        vocal_gender: "male",
        weirdness_constraint: 0,
        audio_weight: 0,
        instrumental: true,
        model: "V5",
        negative_tags: null
      },
      outputs: [{
        type: "audio_url",
        value: "https://cdn.muapi.ai/outputs/6a42f05895284e8687420843c749e11c.mp3"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/6a42f05895284e8687420843c749e11c.mp3"
    },
    type: "audioNode"
  }],
  edges: [{
    id: "e1-1",
    source: "text1",
    target: "audio1",
    sourceHandle: "textOutput",
    targetHandle: "audioInput2",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2
    }
  }]
}, {
  id: "captioning",
  title: "LLM Image Captioning",
  description: "Generate a prompt from an image with GPT-5",
  icon: "text",
  image: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg",
  nodes: [{
    id: "image1",
    position: {
      x: 0,
      y: 100
    },
    data: {
      selectedModel: {
        id: "image-passthrough",
        name: "Input Image"
      },
      formValues: {
        image_url: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
      },
      outputs: [{
        type: "image_url",
        value: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
      }],
      resultUrl: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
    },
    type: "imageNode"
  }, {
    id: "text1",
    position: {
      x: 432,
      y: -110
    },
    data: {
      selectedModel: {
        id: "gpt-5-nano",
        name: "GPT5 Nano"
      },
      formValues: {
        prompt: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene.",
        image_url: "https://cdn.muapi.ai/outputs/a4c650a8834a4a14a82a961710617fd2.jpg"
      },
      outputs: [{
        type: "text",
        value: "A cinematic sci‑fi cityscape at golden hour. A lone explorer stands on the edge of a jagged cliff, gazing out over a vast megacity that rises above a sea of low-lying clouds. The foreground cliff is dark, rough rock with cracks and tufts of green grass and small wildflowers along the edge. The explorer wears a rugged, modern space/terrain suit with a backpack and gear; their silhouette is a quiet, contemplative figure framed against the glowing city. The city below and around is a dense forest of skyscrapers of varying shapes and heights, all made of glass and metal. Neon accents run along many surfaces: turquoise and teal vertical lines glow along several towers, red and magenta edge lights highlight upper contours, and cyan geometric strips trace architectural grooves. The central cluster features a pair of towering, illuminated monoliths with bright cyan highlights and antennae that reach into the sky. Other buildings have curved, multi-tiered silhouettes and reflective façades that catch the sunset and neon alike. A veil of mist and fog hangs around the lower levels, softening edges and lending a dreamlike scale to the city.\n\nIn the sky, several sleek flying vehicles streak by, leaving luminous trails—white and pale yellow from some, magenta and purple from others—adding dynamic motion and depth. The trails glow against a sky that shifts from warm sunset golds and oranges near the horizon to cool deep blues higher up, with scattered, sunlit clouds that glow with a honeyed, amber tint. The sun is low on the left, casting long, warm rays across the cliff and creating a gentle rim light on the explorer, while the city glows with cooler neon against the fading daylight. The overall atmosphere is awe-inspiring, adventurous, and slightly otherworldly—a moment of solitary exploration at the edge of a technologically advanced but fragile-looking metropolis. \n\nSuggested prompt (condensed for reuse):\nHyperreal cinematic sci‑fi city at golden hour. A lone explorer in a rugged space/terrain suit stands on the edge of a jagged cliff, overlooking a megacity rising from a sea of clouds. Tall glass towers with teal/cyan neon lines and red/magenta edge lights dominate the skyline; central twin towers glow with cyan accents. A warm sunset gradient—gold, orange, pink—meets cool neon reflections on glass. Flying vehicles streak across the sky, leaving white, yellow, and magenta light trails. Foreground cliff is rough rock with sparse grasses; mist swirls around the lower city, hiding the bases. The mood is awe-inspiring, adventurous, and otherworldly, with a sense of solitary discovery. Ultra-detailed, 8k, cinematic concept art, 16:9, high dynamic range, volumetric fog, soft lens flare from the sun."
      }],
      resultUrl: "A cinematic sci‑fi cityscape at golden hour. A lone explorer stands on the edge of a jagged cliff, gazing out over a vast megacity that rises above a sea of low-lying clouds. The foreground cliff is dark, rough rock with cracks and tufts of green grass and small wildflowers along the edge. The explorer wears a rugged, modern space/terrain suit with a backpack and gear; their silhouette is a quiet, contemplative figure framed against the glowing city. The city below and around is a dense forest of skyscrapers of varying shapes and heights, all made of glass and metal. Neon accents run along many surfaces: turquoise and teal vertical lines glow along several towers, red and magenta edge lights highlight upper contours, and cyan geometric strips trace architectural grooves. The central cluster features a pair of towering, illuminated monoliths with bright cyan highlights and antennae that reach into the sky. Other buildings have curved, multi-tiered silhouettes and reflective façades that catch the sunset and neon alike. A veil of mist and fog hangs around the lower levels, softening edges and lending a dreamlike scale to the city.\n\nIn the sky, several sleek flying vehicles streak by, leaving luminous trails—white and pale yellow from some, magenta and purple from others—adding dynamic motion and depth. The trails glow against a sky that shifts from warm sunset golds and oranges near the horizon to cool deep blues higher up, with scattered, sunlit clouds that glow with a honeyed, amber tint. The sun is low on the left, casting long, warm rays across the cliff and creating a gentle rim light on the explorer, while the city glows with cooler neon against the fading daylight. The overall atmosphere is awe-inspiring, adventurous, and slightly otherworldly—a moment of solitary exploration at the edge of a technologically advanced but fragile-looking metropolis. \n\nSuggested prompt (condensed for reuse):\nHyperreal cinematic sci‑fi city at golden hour. A lone explorer in a rugged space/terrain suit stands on the edge of a jagged cliff, overlooking a megacity rising from a sea of clouds. Tall glass towers with teal/cyan neon lines and red/magenta edge lights dominate the skyline; central twin towers glow with cyan accents. A warm sunset gradient—gold, orange, pink—meets cool neon reflections on glass. Flying vehicles streak across the sky, leaving white, yellow, and magenta light trails. Foreground cliff is rough rock with sparse grasses; mist swirls around the lower city, hiding the bases. The mood is awe-inspiring, adventurous, and otherworldly, with a sense of solitary discovery. Ultra-detailed, 8k, cinematic concept art, 16:9, high dynamic range, volumetric fog, soft lens flare from the sun."
    },
    type: "textNode"
  }, {
    id: "text2",
    position: {
      x: -2,
      y: -335
    },
    data: {
      selectedModel: {
        id: "text-passthrough",
        name: "Input Text"
      },
      formValues: {
        prompt: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene."
      },
      outputs: [{
        type: "text",
        value: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene."
      }],
      resultUrl: "Provide a detailed prompt of this image, capturing as many elements as possible. Include specifics about the colors, textures, any people or objects present, and the setting. Describe the atmosphere, any notable features or interactions, and the overall mood of the scene."
    },
    type: "textNode"
  }],
  edges: [{
    id: "e4-1",
    source: "image1",
    target: "text1",
    sourceHandle: "imageOutput",
    targetHandle: "textInput2",
    style: {
      stroke: "#22c55e",
      strokeWidth: 2
    }
  }, {
    id: "e4-2",
    source: "text2",
    target: "text1",
    sourceHandle: "textOutput",
    targetHandle: "textInput",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2
    }
  }]
}];