import React, { useState, useEffect } from 'react'
import { MessageCircle, Send, User, Bot, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      const assistantMessage = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to send message')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <Toaster />
      <div className="header">
        <Bot className="bot-icon" />
        <h1>Assistant Studio</h1>
      </div>
      
      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <Bot className="empty-icon" />
              <p>Start a conversation with your AI assistant</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' && <Bot className="msg-icon" />}
                <div className="msg-text">{msg.content}</div>
                {msg.role === 'user' && <User className="msg-icon" />}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <Bot className="msg-icon" />
                <Loader2 className="loading-icon animate-spin" />
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            <Send />
          </button>
        </form>
      </div>
    </div>
  )
}

export default App