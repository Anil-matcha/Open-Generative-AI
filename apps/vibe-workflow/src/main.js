// Vibe Workflow - Vanilla JS Node Editor
// Scaffolded from workflow-builder concepts, pure vanilla implementation

import supabase from '../supabase/config.js'
import { generateImage, generateVideo, callMuAPI } from './ai/muapi.js'
import { enhancePrompt, callOpenAI } from './ai/openai.js'

const canvas = document.getElementById('workflow-canvas')

let nodes = []
let nodeId = 0

function createNode(x, y, label = 'Node') {
  const nodeEl = document.createElement('div')
  nodeEl.className = 'node'
  nodeEl.style.left = `${x}px`
  nodeEl.style.top = `${y}px`
  nodeEl.innerHTML = `
    <div class="node-header">${label} #${++nodeId}</div>
    <div>Drag me</div>
  `
  nodeEl.dataset.id = nodeId

  // Drag logic
  let isDragging = false
  let startX, startY, startLeft, startTop

  nodeEl.addEventListener('mousedown', (e) => {
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    startLeft = parseInt(nodeEl.style.left) || 0
    startTop = parseInt(nodeEl.style.top) || 0
    document.body.style.userSelect = 'none'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    nodeEl.style.left = `${startLeft + dx}px`
    nodeEl.style.top = `${startTop + dy}px`
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
    document.body.style.userSelect = ''
  })

  canvas.appendChild(nodeEl)
  nodes.push({ id: nodeId, el: nodeEl, x, y, label })
  return nodeEl
}

// Init: add sample nodes and controls
function initEditor() {
  // Add some initial nodes
  createNode(100, 100, 'Input')
  createNode(400, 150, 'Process')
  createNode(700, 100, 'Output')

  // Add control hint
  const hint = document.createElement('div')
  hint.style.position = 'absolute'
  hint.style.top = '20px'
  hint.style.left = '20px'
  hint.style.color = '#888'
  hint.innerHTML = 'Click anywhere to add node • Drag nodes to move'
  canvas.appendChild(hint)

  // Click to add node
  canvas.addEventListener('click', (e) => {
    if (e.target === canvas) {
      createNode(e.offsetX, e.offsetY, 'New Node')
    }
  })

  console.log('Vanilla node editor initialized')
}

initEditor()

// Supabase Storage: upload workflow JSON/assets
async function uploadWorkflowJSON(workflowData, filename = `workflow-${Date.now()}.json`) {
  const { data, error } = await supabase.storage
    .from('workflows')
    .upload(filename, JSON.stringify(workflowData), { contentType: 'application/json' })
  if (error) console.error('Upload error:', error)
  return data
}

// Supabase Auth: login + session persistence
async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) console.error('Login error:', error)
  return data
}

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state:', event, session?.user?.email)
  if (session) localStorage.setItem('supabase_session', JSON.stringify(session))
})

// New: Call Supabase Edge Functions for workflow execution (Task 3)
async function executeWorkflowViaEdge(workflow, params = {}) {
  const { data, error } = await supabase.functions.invoke('workflow-execute', {
    body: { workflow, params }
  })
  if (error) console.error('Edge function error:', error)
  return data
}

async function callMuAPIProxy(endpoint, payload, useOpenAI = false) {
  const { data, error } = await supabase.functions.invoke('muapi-proxy', {
    body: { endpoint, payload, useOpenAI }
  })
  if (error) console.error('Proxy error:', error)
  return data
}

// Example integration: trigger from UI
window.executeWorkflow = (wf) => executeWorkflowViaEdge(wf, { prompt: 'test generation' })
window.callMuAPI = (p) => callMuAPIProxy('/v1/generate', p)

// Task 5 Step 3: Wire AI clients into workflow engine for node execution
async function executeAINode(node, input = {}) {
  const label = node.label || ''
  const prompt = input.prompt || 'default creative prompt'

  try {
    if (label.toLowerCase().includes('image') || label.toLowerCase().includes('muapi')) {
      const result = await generateImage(prompt, { width: 1024, height: 1024 })
      console.log('MuAPI Image result:', result)
      return result
    }
    if (label.toLowerCase().includes('video')) {
      const result = await generateVideo(prompt, { duration: 5 })
      console.log('MuAPI Video result:', result)
      return result
    }
    if (label.toLowerCase().includes('llm') || label.toLowerCase().includes('openai') || label.toLowerCase().includes('prompt')) {
      const enhanced = await enhancePrompt(prompt)
      console.log('OpenAI Enhanced Prompt:', enhanced)
      return { enhancedPrompt: enhanced }
    }
    // Fallback to proxy
    return await callMuAPIProxy('/v1/generate', { prompt })
  } catch (err) {
    console.error('AI Node execution failed:', err)
    return { error: err.message }
  }
}

// Extend workflow execution to support local AI nodes (hybrid edge + direct)
async function executeWorkflowWithAI(workflow, params = {}) {
  console.log('Executing workflow with AI integration...')
  const results = []
  for (const node of workflow.nodes || nodes) {
    const res = await executeAINode(node, params)
    results.push({ nodeId: node.id, result: res })
  }
  // Also call edge for full orchestration if needed
  const edgeResult = await executeWorkflowViaEdge(workflow, params)
  return { localResults: results, edgeResult }
}

window.executeAINode = executeAINode
window.executeWorkflowWithAI = executeWorkflowWithAI

// Step 4 env note: Keys loaded via import.meta.env.VITE_MUAPI_KEY / VITE_OPENAI_KEY in ai/*.js
console.log('MuAPI & OpenAI integration wired (Task 5 complete)')
