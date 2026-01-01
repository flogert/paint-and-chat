'use client'

import { useState, useRef } from 'react'
import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'
import ChatSidebar from '@/components/ChatSidebar'
import GameSidebar from '@/components/GameSidebar'

export default function Home() {
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [brushStyle, setBrushStyle] = useState('solid') // solid | dotted | dashed | fuzzy
  const [brushOpacity, setBrushOpacity] = useState(1)
  const [currentTool, setCurrentTool] = useState('brush') // brush | eraser | bucket | rectangle | circle | line
  const [messages, setMessages] = useState([])
  const [isChatOpen, setIsChatOpen] = useState(false) // State for mobile chat toggle
  const [isGameOpen, setIsGameOpen] = useState(false) // State for mobile game toggle

  // Reference to the canvas element for clearing
  const canvasRef = useRef(null)
  const canvasLogicRef = useRef(null)

  const handleSendMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message])
  }

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const handleUndo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.undo()
    }
  }

  const handleRedo = () => {
    if (canvasLogicRef.current) {
      canvasLogicRef.current.redo()
    }
  }

  return (
    <main className="w-screen h-screen flex flex-col bg-stone-50 overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        brushStyle={brushStyle}
        setBrushStyle={setBrushStyle}
        brushOpacity={brushOpacity}
        setBrushOpacity={setBrushOpacity}
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        clearCanvas={clearCanvas}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Game Sidebar */}
        <GameSidebar
          className={`
            fixed inset-y-0 left-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-30
            ${isGameOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:w-80 md:shadow-none md:border-r md:border-gray-200
          `}
        />

        {/* Canvas */}
        <div className="flex-1 relative bg-white shadow-inner">
          <Canvas
            ref={canvasLogicRef}
            canvasRef={canvasRef}
            brushColor={brushColor}
            brushSize={brushSize}
            brushStyle={brushStyle}
            brushOpacity={brushOpacity}
            currentTool={currentTool}
          />

          {/* Game Toggle Button (Mobile) */}
          <button
            onClick={() => setIsGameOpen(!isGameOpen)}
            className="fixed bottom-4 left-4 z-40 p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all md:hidden"
            aria-label={isGameOpen ? "Close Game" : "Open Game"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Chat Toggle Button (Mobile/Desktop) */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-4 right-4 z-40 p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all md:hidden"
            aria-label={isChatOpen ? "Close Chat" : "Open Chat"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.405 0 4.781.173 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Chat Sidebar */}
        <ChatSidebar
          className={`
            fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-30
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
            md:relative md:translate-x-0 md:w-80 md:shadow-none md:border-l md:border-gray-200
          `}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        
        {/* Overlay for mobile when chat is open */}
        {(isChatOpen || isGameOpen) && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
            onClick={() => { setIsChatOpen(false); setIsGameOpen(false) }}
            aria-hidden="true"
          />
        )}
      </div>
    </main>
  )
}
