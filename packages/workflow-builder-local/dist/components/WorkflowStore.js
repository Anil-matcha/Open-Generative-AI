"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setWorkflowIds = exports.getWorkflowId = exports.getRunId = void 0;
var workflowId = null;
var runId = null;
var setWorkflowIds = exports.setWorkflowIds = function setWorkflowIds(wfId, rId) {
  workflowId = wfId;
  runId = rId;
};
var getWorkflowId = exports.getWorkflowId = function getWorkflowId() {
  return workflowId;
};
var getRunId = exports.getRunId = function getRunId() {
  return runId;
};