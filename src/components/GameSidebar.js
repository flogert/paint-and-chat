'use client'

import { useState, useEffect } from 'react'

const PROMPTS = [
  "A flying elephant eating pizza",
  "A futuristic city underwater",
  "A cat wearing a spacesuit",
  "A tree made of candy",
  "A dragon reading a book",
  "A robot painting a portrait",
  "A house with legs",
  "A cloud shaped like a car",
  "A fish riding a bicycle",
  "A mountain with a face",
  "A superhero with a useless power",
  "A castle in the sky",
  "A monster under the bed having a tea party",
  "A giraffe wearing a scarf",
  "A penguin on a surfboard"
]

export default function GameSidebar({ className }) {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const generatePrompt = () => {
    const random = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    setCurrentPrompt(random)
    setTimeLeft(60) // 60 seconds challenge
    setIsActive(true)
  }

  useEffect(() => {
    let interval = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  return (
    <div className={`${className} flex flex-col bg-stone-100 border-r border-stone-200 shadow-xl z-30 transition-all duration-300`} role="complementary" aria-label="Game Sidebar">
      <div className="p-4 border-b border-stone-200 bg-stone-100/80 backdrop-blur-sm">
        <h2 className="font-semibold text-stone-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
          </svg>
          Daily Challenge
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-100 flex flex-col items-center text-center">
        
        <div className="w-full p-6 bg-white rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-2">Current Prompt</h3>
          <p className="text-xl font-bold text-stone-800 min-h-[3.5rem] flex items-center justify-center">
            {currentPrompt || "Ready to draw?"}
          </p>
        </div>

        {isActive && (
          <div className="text-4xl font-black text-amber-500 tabular-nums animate-pulse">
            {timeLeft}s
          </div>
        )}

        <button 
          onClick={generatePrompt}
          className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
          </svg>
          {currentPrompt ? "New Prompt" : "Start Game"}
        </button>

        <div className="text-xs text-stone-400 mt-auto">
          Draw the prompt before the timer runs out!
        </div>
      </div>
    </div>
  )
}
