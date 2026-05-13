import React from 'react';
import { cookies } from "next/headers";
import WorkflowBuilderClient from "./WorkflowBuilderClient";

async function fetchWorkflowData(id, cookieHeader) {
  const baseUrl = "http://127.0.0.1:8000/api/workflow";
  try {
    const [workflowRes, schemasRes] = await Promise.all([
      fetch(`${baseUrl}/get-workflow-def/${id}`, {
        cache: 'no-store',
        headers: { 'Cookie': cookieHeader || '' }
      }),
      fetch(`${baseUrl}/${id}/node-schemas`, {
        cache: 'no-store',
        headers: { 'Cookie': cookieHeader || '' }
      })
    ]);

    const initialWorkflowData = workflowRes.ok ? await workflowRes.json() : null;
    const initialNodeSchemas = schemasRes.ok ? await schemasRes.json() : null;

    return { initialWorkflowData, initialNodeSchemas };
  } catch (error) {
    console.error("Error fetching workflow data on server:", error);
    return { initialWorkflowData: null, initialNodeSchemas: null };
  }
}

export default async function WorkflowPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const { initialWorkflowData, initialNodeSchemas } = await fetchWorkflowData(id, cookieHeader);

  return (
    <div className="h-dvh w-full bg-black">
      <WorkflowBuilderClient 
        initialWorkflowData={initialWorkflowData} 
        initialNodeSchemas={initialNodeSchemas} 
      />
    </div>
  );
}
