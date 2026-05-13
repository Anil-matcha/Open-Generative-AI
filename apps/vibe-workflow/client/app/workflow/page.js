import React from "react";
import { cookies } from "next/headers";
import WorkflowListingClient from "./WorkflowListingClient";

async function getWorkflowDefs(cookieHeader) {
  const endpoint = `http://127.0.0.1:8000/api/workflow/get-workflow-defs`;
  try {
    const res = await fetch(endpoint, {
      cache: 'no-store',
      headers: {
        'Cookie': cookieHeader || '',
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching workflows on server:", error);
    return [];
  }
}

const WorkflowList = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const initialWorkflowList = await getWorkflowDefs(cookieHeader);

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-x-hidden selection:bg-blue-500/30">
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <WorkflowListingClient initialWorkflowList={initialWorkflowList} />
    </div>
  );
};

export default WorkflowList;
