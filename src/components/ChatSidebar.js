// src/components/ChatSidebar.js
'use client'

import { useEffect, useState, useRef } from 'react'
import socket from '@/lib/socket'

// Music genres with royalty-free streaming URLs from Pixabay (CC0 license)
const MUSIC_GENRES = [
  { id: 'lofi', name: 'Lo-Fi', emoji: '🎧', url: 'https://cdn.pixabay.com/audio/2024/11/29/audio_7a38d7a4da.mp3' },
  { id: 'jazz', name: 'Jazz', emoji: '🎷', url: 'https://cdn.pixabay.com/audio/2024/09/10/audio_6e5d7d1912.mp3' },
  { id: 'piano', name: 'Piano', emoji: '🎹', url: 'https://cdn.pixabay.com/audio/2024/10/25/audio_09bf7e809d.mp3' },
  { id: 'acoustic', name: 'Acoustic', emoji: '🎸', url: 'https://cdn.pixabay.com/audio/2024/11/14/audio_91ef086ad5.mp3' },
  { id: 'ambient', name: 'Ambient', emoji: '🌙', url: 'https://cdn.pixabay.com/audio/2024/09/03/audio_de6cb752c1.mp3' },
  { id: 'nature', name: 'Nature', emoji: '🌿', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_2c0c930b44.mp3' },
  { id: 'classical', name: 'Classical', emoji: '🎻', url: 'https://cdn.pixabay.com/audio/2024/07/30/audio_d9b5545786.mp3' },
  { id: 'electronic', name: 'Electronic', emoji: '🎛️', url: 'https://cdn.pixabay.com/audio/2024/11/01/audio_feb03c08b0.mp3' },
  { id: 'chillhop', name: 'Chill', emoji: '☕', url: 'https://cdn.pixabay.com/audio/2024/10/08/audio_a0c7fb6e12.mp3' },
  { id: 'meditation', name: 'Calm', emoji: '🧘', url: 'https://cdn.pixabay.com/audio/2024/04/12/audio_369ffda87c.mp3' },
]

export default function ChatSidebar({ className, messages, onSendMessage }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)
  const [currentGenre, setCurrentGenre] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)

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
      // msg is now { text, sender } from the server
      onSendMessage({ sender: msg.sender || 'Player', text: msg.text || msg })
    }

    socket.on('chat', handleMessage)
    return () => socket.off('chat', handleMessage)
  }, [onSendMessage])

  // Music player functions
  const playGenre = (genre) => {
    if (currentGenre?.id === genre.id && isPlaying) {
      // Pause if clicking same genre
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      // Play new genre
      setCurrentGenre(genre)
      if (audioRef.current) {
        audioRef.current.src = genre.url
        audioRef.current.volume = volume
        audioRef.current.play().catch(e => console.log('Audio play failed', e))
        setIsPlaying(true)
      }
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div className={`${className} flex flex-col z-30`} role="complementary" aria-label="Chat Sidebar">
      {/* Hidden audio element */}
      <audio ref={audioRef} loop />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-sky-200/60 bg-gradient-to-r from-sky-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm">
            💬
          </div>
          <div>
            <h2 className="font-bold text-sky-800 text-sm">Chat</h2>
            <p className="text-[10px] text-sky-600/70">Talk with your partner</p>
          </div>
        </div>
      </div>

      {/* Music Section - Collapsible */}
      <div className="border-b border-sky-200/60">
        <details className="group">
          <summary className="px-4 py-2 cursor-pointer flex items-center justify-between bg-sky-50/50 hover:bg-sky-100/50 transition-colors">
            <span className="text-xs font-semibold text-sky-700 flex items-center gap-2">
              🎵 Background Music
              {isPlaying && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </span>
            <svg className="w-4 h-4 text-sky-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-3 py-2 bg-white/50">
            <div className="grid grid-cols-5 gap-1 mb-2">
              {MUSIC_GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => playGenre(genre)}
                  className={`py-1.5 text-sm rounded-lg border transition-all ${
                    currentGenre?.id === genre.id && isPlaying
                      ? 'bg-gradient-to-br from-sky-400 to-indigo-500 border-sky-300 shadow-sm text-white'
                      : 'bg-white border-gray-200 hover:border-sky-300 hover:bg-sky-50'
                  }`}
                  title={genre.name}
                >
                  {genre.emoji}
                </button>
              ))}
            </div>
            {currentGenre && (
              <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg border border-sky-200">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      audioRef.current?.pause()
                      setIsPlaying(false)
                    } else {
                      audioRef.current?.play()
                      setIsPlaying(true)
                    }
                  }}
                  className="p-1.5 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-all"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  )}
                </button>
                <span className="text-[10px] text-sky-700 font-medium flex-shrink-0">{currentGenre.emoji} {currentGenre.name}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 accent-sky-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        </details>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gradient-to-b from-white to-sky-50/30">
        {messages.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <span className="text-3xl block mb-2">💬</span>
            <p className="text-xs font-medium">No messages yet</p>
            <p className="text-[10px] mt-1">Start chatting!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm ${
              msg.sender === 'You' 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-br-sm' 
                : msg.sender === '🎮 System'
                  ? 'bg-violet-50 border border-violet-200 text-violet-700 rounded-bl-sm italic text-[10px]'
                  : 'bg-white border border-sky-100 text-stone-700 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
            <span className="text-[9px] text-stone-400 mt-0.5 px-1">{msg.sender}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-sky-200/60 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white text-stone-700 placeholder-stone-400 text-xs"
            aria-label="Message input"
          />
          <button 
            onClick={sendMessage}
            className="px-3 py-2 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-lg hover:from-sky-600 hover:to-indigo-700 transition-all shadow-sm"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
