"use client"

import React from 'react'
import { WorkflowBuilder } from "workflow-builder"
import "reactflow/dist/style.css"
import "workflow-builder/dist/tailwind.css";

const WorkflowBuilderClient = ({ initialWorkflowData, initialNodeSchemas }) => {
  return (
    <WorkflowBuilder 
      initialWorkflowData={initialWorkflowData} 
      initialNodeSchemas={initialNodeSchemas} 
    />
  )
}

export default WorkflowBuilderClient;
