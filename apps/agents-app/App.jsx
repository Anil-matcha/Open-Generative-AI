import React, { useState, useEffect } from 'react'
import { Bot, User, Settings, Play, Pause, Square, MoreVertical } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

const initialAgents = [
  { id: '1', name: 'Assistant Agent', status: 'idle', type: 'assistant' },
  { id: '2', name: 'Code Agent', status: 'idle', type: 'coding' },
  { id: '3', name: 'Research Agent', status: 'idle', type: 'research' },
]

function AgentsApp() {
  const [agents, setAgents] = useState(initialAgents)
  const [selectedAgent, setSelectedAgent] = useState(null)

  const toggleAgentStatus = (id) => {
    setAgents(agents.map(agent => {
      if (agent.id === id) {
        const newStatus = agent.status === 'idle' ? 'running' : 'idle'
        return { ...agent, status: newStatus }
      }
      return agent
    }))
  }

  return (
    <div className="agents-app">
      <Toaster />
      <div className="header">
        <h1>Agents Studio</h1>
        <button className="create-btn" onClick={() => toast.info('Create agent feature coming soon')}>
          + Create Agent
        </button>
      </div>

      <div className="content">
        <div className="agents-panel">
          {agents.map(agent => (
            <div 
              key={agent.id} 
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-header">
                <Bot className="agent-icon" />
                <div className="agent-info">
                  <h3>{agent.name}</h3>
                  <span className={`status ${agent.status}`}>{agent.status}</span>
                </div>
                <button 
                  className="status-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleAgentStatus(agent.id)
                  }}
                >
                  {agent.status === 'idle' ? <Play /> : <Pause />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="agent-detail">
          {selectedAgent ? (
            <>
              <div className="detail-header">
                <div className="detail-info">
                  <Bot className="detail-icon" />
                  <div>
                    <h2>{selectedAgent.name}</h2>
                    <p>Agent Type: {selectedAgent.type}</p>
                  </div>
                </div>
                <button className="settings-btn">
                  <Settings />
                </button>
              </div>
              
              <div className="agent-chat">
                <div className="messages">
                  <div className="message system">
                    <Bot className="msg-icon" />
                    <div className="msg-content">
                      Agent initialized. How can I help you?
                    </div>
                  </div>
                </div>
                
                <form className="input-form">
                  <input type="text" placeholder="Send a message to the agent..." />
                  <button type="submit">Send</button>
                </form>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Bot className="empty-icon" />
              <h3>Select an agent</h3>
              <p>Choose an agent from the panel to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentsApp