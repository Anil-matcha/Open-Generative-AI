"use client";

import React from "react";
import { WorkflowBuilder } from "workflow-builder";
import "reactflow/dist/style.css";
import "react-toastify/dist/ReactToastify.css";


const WorkflowUI = ({
  apiKey,
  workflowId,
  initialNodeSchemas,
  initialWorkflowData,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) => {
  return (
    <div className="w-full h-full bg-black">
      <WorkflowBuilder
        apiKey={apiKey}
        workflowId={workflowId}
        initialNodeSchemas={initialNodeSchemas}
        initialWorkflowData={initialWorkflowData}
        costType="dollars"
        onGenerationStart={onGenerationStart}
        onGenerationEnd={onGenerationEnd}
        onGenerationComplete={onGenerationComplete}
        onGenerationError={onGenerationError}
      />
    </div>
  );
};

export default WorkflowUI;
