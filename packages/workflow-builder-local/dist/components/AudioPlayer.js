"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _fa = require("react-icons/fa");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var AudioPlayer = function AudioPlayer(_ref) {
  var src = _ref.src,
    className = _ref.className;
  var audioRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isPlaying = _useState2[0],
    setIsPlaying = _useState2[1];
  var _useState3 = (0, _react.useState)(0),
    _useState4 = _slicedToArray(_useState3, 2),
    progress = _useState4[0],
    setProgress = _useState4[1];
  var _useState5 = (0, _react.useState)(0),
    _useState6 = _slicedToArray(_useState5, 2),
    currentTime = _useState6[0],
    setCurrentTime = _useState6[1];
  var _useState7 = (0, _react.useState)(0),
    _useState8 = _slicedToArray(_useState7, 2),
    duration = _useState8[0],
    setDuration = _useState8[1];
  var _useState9 = (0, _react.useState)(1),
    _useState0 = _slicedToArray(_useState9, 2),
    volume = _useState0[0],
    setVolume = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isMuted = _useState10[0],
    setIsMuted = _useState10[1];
  var toggleAudio = function toggleAudio() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  var handleEnded = function handleEnded() {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };
  (0, _react.useEffect)(function () {
    var audio = audioRef.current;
    if (!audio) return;
    var updateTime = function updateTime() {
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration * 100 || 0);
    };
    var setMeta = function setMeta() {
      return setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setMeta);
    audio.addEventListener("ended", handleEnded);
    return function () {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setMeta);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]); // Re-run effect if src changes

  var handleSeek = function handleSeek(e) {
    var audio = audioRef.current;
    if (!audio) return;
    var value = e.target.value;
    audio.currentTime = value / 100 * audio.duration;
    setProgress(value);
  };
  var handleVolumeChange = function handleVolumeChange(e) {
    var val = parseFloat(e.target.value);
    setVolume(val);
    audioRef.current.volume = val;
    setIsMuted(val === 0);
  };
  var toggleMute = function toggleMute() {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  var formatTime = function formatTime() {
    var seconds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return "".concat(m.toString().padStart(2, "0"), ":").concat(s.toString().padStart(2, "0"));
  };
  var bars = [40, 70, 45, 90, 65, 30, 85, 50, 75, 40, 60, 95, 20, 55, 80, 35, 70, 45, 90, 60];
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: className || "flex flex-col items-center justify-center p-4 w-full h-full bg-gradient-to-br from-[#121418] to-[#08090a] rounded-xl border border-white/5 relative group transition-all duration-500 select-none"
  }, /*#__PURE__*/_react["default"].createElement("audio", {
    ref: audioRef,
    src: src,
    crossOrigin: "anonymous"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-center gap-[2px] w-full h-12 mb-4 px-4 overflow-hidden",
    style: {
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
      maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
    }
  }, bars.map(function (height, i) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: i,
      className: "w-1 rounded-full transition-all duration-300 ease-in-out",
      style: {
        height: isPlaying ? "".concat(height, "%") : '4px',
        backgroundColor: i / bars.length < progress / 100 ? '#3b82f6' : '#2c3037',
        boxShadow: i / bars.length < progress / 100 ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
        opacity: isPlaying ? 0.8 + Math.random() * 0.2 : 0.3,
        transform: isPlaying ? "scaleY(".concat(0.8 + Math.random() * 0.4, ")") : 'scaleY(1)',
        transitionDelay: "".concat(i * 20, "ms")
      }
    });
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-4 w-full relative z-10"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: toggleAudio,
    className: "w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-110 active:scale-95 group/play"
  }, isPlaying ? /*#__PURE__*/_react["default"].createElement(_fa.FaPause, {
    size: 14,
    className: "group-hover/play:scale-110 transition-transform"
  }) : /*#__PURE__*/_react["default"].createElement(_fa.FaPlay, {
    size: 14,
    className: "translate-x-0.5 group-hover/play:scale-110 transition-transform"
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col flex-grow gap-1.5 min-w-0"
  }, /*#__PURE__*/_react["default"].createElement("input", {
    type: "range",
    min: "0",
    max: "100",
    step: "0.1",
    value: progress || 0,
    onChange: handleSeek,
    className: "w-full h-1.5 rounded-full appearance-none cursor-pointer hover:h-2 transition-all seek-bar active:-translate-y-px",
    style: {
      background: "linear-gradient(to right, #3b82f6 0%, #3b82f6 ".concat(progress || 0, "%, rgba(255, 255, 255, 0.1) ").concat(progress || 0, "%, rgba(255, 255, 255, 0.1) 100%)")
    }
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex justify-between items-center w-full"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-gray-500 font-medium tracking-tight tabular-nums"
  }, formatTime(currentTime)), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-gray-500 font-medium tracking-tight tabular-nums"
  }, formatTime(duration)))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 group/volume relative"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: toggleMute,
    className: "w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
  }, isMuted || volume === 0 ? /*#__PURE__*/_react["default"].createElement(_fa.FaVolumeMute, {
    size: 14
  }) : /*#__PURE__*/_react["default"].createElement(_fa.FaVolumeUp, {
    size: 14
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute bottom-full left-1/2 -translate-x-1/2 pb-4 opacity-0 group-hover/volume:opacity-100 pointer-events-none group-hover/volume:pointer-events-auto transition-all duration-300 translate-y-2 group-hover/volume:translate-y-0 z-30"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "bg-[#1a1b1e] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl flex flex-col items-center gap-2 h-24"
  }, /*#__PURE__*/_react["default"].createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    vertical: "true",
    value: volume,
    onChange: handleVolumeChange,
    className: "h-full w-1 accent-blue-500 cursor-pointer appearance-none bg-white/10 rounded-full",
    style: {
      WebkitAppearance: 'slider-vertical',
      appearance: 'slider-vertical',
      writingMode: 'bt-lr'
    }
  }))))));
};
var _default = exports["default"] = AudioPlayer;