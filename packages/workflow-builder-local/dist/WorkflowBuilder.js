"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Home;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactflow = require("reactflow");

var _componentsNodeFlow = require("./components/NodeFlow");

var _componentsNodeFlow2 = _interopRequireDefault(_componentsNodeFlow);

"use client";

function Home(_ref) {
  var initialNodeSchemas = _ref.initialNodeSchemas;
  var initialWorkflowData = _ref.initialWorkflowData;

  return _react2["default"].createElement(
    "div",
    { className: "flex flex-col items-center justify-center h-screen w-full" },
    _react2["default"].createElement(
      _reactflow.ReactFlowProvider,
      null,
      _react2["default"].createElement(_componentsNodeFlow2["default"], {
        initialNodeSchemas: initialNodeSchemas,
        initialWorkflowData: initialWorkflowData
      })
    )
  );
}

module.exports = exports["default"];