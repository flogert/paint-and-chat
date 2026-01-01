// src/components/ChatSidebar.js
'use client'

import { useEffect, useState, useRef } from 'react'
import socket from '@/lib/socket'

export default function ChatSidebar({ className, messages, onSendMessage }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('chat', input)
      onSendMessage({ sender: 'You', text: input })
      setInput('')
    }
  }

  useEffect(() => {
    const handleMessage = (msg) => {
      onSendMessage({ sender: 'Them', text: msg })
    }

    socket.on('chat', handleMessage)
    return () => socket.off('chat', handleMessage)
  }, [onSendMessage])

  return (
    <div className={`${className} flex flex-col bg-stone-100 border-l border-stone-200 shadow-xl z-30 transition-all duration-300`} role="complementary" aria-label="Chat Sidebar">
      <div className="p-4 border-b border-stone-200 bg-stone-100/80 backdrop-blur-sm">
        <h2 className="font-semibold text-stone-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
          </svg>
          Chat
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-100">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              msg.sender === 'You' 
                ? 'bg-amber-500 text-white rounded-br-none' 
                : 'bg-white border border-stone-200 text-stone-700 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.sender}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-stone-200 bg-stone-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-700 placeholder-stone-400"
            aria-label="Message input"
          />
          <button 
            onClick={sendMessage}
            className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors shadow-sm"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
