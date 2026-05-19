/**
 * MuAPI client bridge for packages/studio components.
 *
 * Components such as MarketingStudio, WorkflowStudio, and AgentStudio
 * import from "../muapi" (one level up from their component directory).
 * Re-exporting from the project-wide src/lib/muapi.js avoids duplication
 * and keeps all API calls identical across every studio.
 *
 * CAUTION: do NOT add workflow-builder or ai-agent to this bridge, and
 * do NOT import from this file inside node_modules/workflow-builder or
 * node_modules/ai-agent.  Doing so would create a circular dependency
 * (WorkflowUI → workflow-builder → muapi → models) which Vite cannot
 * safely transform for SSR.
 */
export * from '../../src/lib/muapi.js';
