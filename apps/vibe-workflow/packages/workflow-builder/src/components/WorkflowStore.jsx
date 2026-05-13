let workflowId = null;
let runId = null;

export const setWorkflowIds = (wfId, rId) => {
  workflowId = wfId;
  runId = rId;
};

export const getWorkflowId = () => workflowId;
export const getRunId = () => runId;
