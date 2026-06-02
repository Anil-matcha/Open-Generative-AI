"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Home;
var _react = _interopRequireDefault(require("react"));
var _reactflow = require("reactflow");
var _NodeFlow = _interopRequireDefault(require("./components/NodeFlow"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function Home(_ref) {
  var initialNodeSchemas = _ref.initialNodeSchemas,
    initialWorkflowData = _ref.initialWorkflowData;
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center h-screen w-full"
  }, /*#__PURE__*/_react["default"].createElement(_reactflow.ReactFlowProvider, null, /*#__PURE__*/_react["default"].createElement(_NodeFlow["default"], {
    initialNodeSchemas: initialNodeSchemas,
    initialWorkflowData: initialWorkflowData
  })));
}