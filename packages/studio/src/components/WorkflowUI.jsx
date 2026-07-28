"use client";

import React, { useEffect } from "react";
import { WorkflowBuilder } from "workflow-builder";
import "reactflow/dist/style.css";
import "react-toastify/dist/ReactToastify.css";


const WorkflowUI = ({
  workflowId,
  initialNodeSchemas,
  initialWorkflowData,
  onGenerationComplete,
  onGenerationError,
}) => {
  useEffect(() => {
    sessionStorage.setItem("fromWorkflowBuilder", "true");
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <WorkflowBuilder 
        workflowId={workflowId}
        initialNodeSchemas={initialNodeSchemas} 
        initialWorkflowData={initialWorkflowData}
        costType="dollars" 
        onGenerationComplete={onGenerationComplete}
        onGenerationError={onGenerationError}
      />
    </div>
  );
};

export default WorkflowUI;
