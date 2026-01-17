'use client'

import { useState, useEffect } from 'react'
import socket from '@/lib/socket'
import sounds from '@/lib/sounds'

export default function RoomLobby({ onJoinRoom }) {
  const [mode, setMode] = useState('menu') // 'menu', 'create', 'join'
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Check socket connection
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socket.connected)
    }
    
    checkConnection()
    socket.on('connect', checkConnection)
    socket.on('disconnect', checkConnection)
    
    return () => {
      socket.off('connect', checkConnection)
      socket.off('disconnect', checkConnection)
    }
  }, [])

  // Generate a random name
  useEffect(() => {
    const adjectives = ['Happy', 'Silly', 'Creative', 'Artsy', 'Colorful', 'Doodly', 'Sketchy', 'Brushy', 'Painty', 'Crafty']
    const nouns = ['Panda', 'Unicorn', 'Artist', 'Painter', 'Doodler', 'Creator', 'Wizard', 'Dragon', 'Phoenix', 'Tiger']
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`
    setPlayerName(randomName)
  }, [])

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!isConnected) {
      setError('Not connected to server. Please refresh the page.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // Add timeout
    const timeout = setTimeout(() => {
      setIsLoading(false)
      setError('Connection timeout. Make sure the server is running.')
    }, 5000)
    
    socket.emit('createRoom', { name: playerName.trim() }, (response) => {
      clearTimeout(timeout)
      setIsLoading(false)
      if (response && response.success) {
        sounds.success()
        onJoinRoom({
          roomCode: response.roomCode,
          playerNumber: response.playerNumber,
          playerName: playerName.trim(),
          players: response.players,
          side: 'left'
        })
      } else {
        setError(response?.error || 'Failed to create room')
        sounds.error()
      }
    })
  }

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      setError('Please enter a valid 6-character room code')
      return
    }

    if (!isConnected) {
      setError('Not connected to server. Please refresh the page.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // Add timeout
    const timeout = setTimeout(() => {
      setIsLoading(false)
      setError('Connection timeout. Make sure the server is running.')
    }, 5000)
    
    socket.emit('joinRoom', { roomCode: roomCode.trim().toUpperCase(), name: playerName.trim() }, (response) => {
      clearTimeout(timeout)
      setIsLoading(false)
      if (response && response.success) {
        sounds.success()
        onJoinRoom({
          roomCode: response.roomCode,
          playerNumber: response.playerNumber,
          playerName: playerName.trim(),
          players: response.players,
          side: response.side
        })
      } else {
        setError(response?.error || 'Failed to join room')
        sounds.error()
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-sky-50 flex items-center justify-center z-50 p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl" />
      </div>
      
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-stone-800">How to Use Paint & Chat</h3>
              <button onClick={() => setShowHelp(false)} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-4 text-sm text-stone-600">
              <div className="flex gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-semibold text-stone-800">Create or Join a Room</p>
                  <p>Create a new room and share the code with friends, or join an existing room using a code.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-semibold text-stone-800">Draw on Your Canvas</p>
                  <p>Each player has their own side. Use the toolbar to pick brushes, colors, and special effects!</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-semibold text-stone-800">Chat & Play Games</p>
                  <p>Use the chat to talk with friends. Try drawing prompts or play fun minigames together!</p>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="font-semibold text-amber-800 mb-2">⌨️ Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="kbd">B</span> Brush</div>
                  <div><span className="kbd">E</span> Eraser</div>
                  <div><span className="kbd">Ctrl+Z</span> Undo</div>
                  <div><span className="kbd">Ctrl+Y</span> Redo</div>
                  <div><span className="kbd">1-9</span> Brush Size</div>
                  <div><span className="kbd">Tab</span> Switch Side</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/50">
        {/* Help Button */}
        <button 
          onClick={() => setShowHelp(true)}
          className="absolute top-4 right-4 w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 hover:text-stone-700 flex items-center justify-center text-sm font-bold transition-all"
          title="How to use"
        >
          ?
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">🎨</div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">🖌️</div>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 mb-1">
            Paint & Chat
          </h1>
          <p className="text-stone-500 text-sm">Create art together in real-time</p>
          
          {/* Connection Status */}
          <div className="mt-4">
            {!isConnected ? (
              <div className="inline-flex items-center gap-2 text-amber-600 text-xs bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Connecting...
                <button onClick={() => socket.connect()} className="text-amber-700 underline ml-1">Retry</button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                Ready to connect
              </div>
            )}
          </div>
        </div>

        {mode === 'menu' && (
          <div className="space-y-5">
            {/* Player Name Input */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-2">Your Display Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 text-base font-medium text-stone-800 transition-all bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                disabled={!isConnected}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="text-xl">✨</span>
                Create New Room
              </button>
              
              <button
                onClick={() => setMode('join')}
                disabled={!isConnected}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="text-xl">🔗</span>
                Join with Code
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-100">
                <div className="text-amber-500 text-lg mb-1">🎨</div>
                <p className="text-xs font-semibold text-stone-700">10+ Brushes</p>
                <p className="text-[10px] text-stone-500">Special effects included</p>
              </div>
              <div className="bg-sky-50/80 rounded-xl p-3 border border-sky-100">
                <div className="text-sky-500 text-lg mb-1">🎮</div>
                <p className="text-xs font-semibold text-stone-700">Mini Games</p>
                <p className="text-[10px] text-stone-500">Play with your art</p>
              </div>
              <div className="bg-rose-50/80 rounded-xl p-3 border border-rose-100">
                <div className="text-rose-500 text-lg mb-1">💬</div>
                <p className="text-xs font-semibold text-stone-700">Live Chat</p>
                <p className="text-[10px] text-stone-500">Talk while drawing</p>
              </div>
              <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-100">
                <div className="text-emerald-500 text-lg mb-1">🎵</div>
                <p className="text-xs font-semibold text-stone-700">Background Music</p>
                <p className="text-[10px] text-stone-500">Set the vibe</p>
              </div>
            </div>

            {/* Player preview */}
            <div className="flex items-center justify-center gap-6 pt-4 pb-2">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md mx-auto mb-1 flex items-center justify-center text-lg">🎨</div>
                <span className="text-[10px] text-stone-400 font-medium">Left Side</span>
              </div>
              <div className="text-stone-300 text-xs">+</div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-md mx-auto mb-1 flex items-center justify-center text-lg">🖌️</div>
                <span className="text-[10px] text-stone-400 font-medium">Right Side</span>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-stone-400">
              Up to 4 players • Real-time sync • Works on mobile
            </p>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('menu'); setError('') }}
              className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm font-medium"
            >
              <span>←</span> Back
            </button>
            
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg mx-auto mb-3">✨</div>
              <h2 className="text-xl font-bold text-stone-800">Create a Room</h2>
              <p className="text-stone-500 text-sm mt-1">Get a code to share with friends</p>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 text-base font-medium text-stone-800 transition-all bg-white"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 rounded-xl p-3 border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={isLoading || !isConnected}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold text-base shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
            
            <p className="text-center text-xs text-stone-400">
              You'll be the room host (Left Side)
            </p>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('menu'); setError('') }}
              className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm font-medium"
            >
              <span>←</span> Back
            </button>
            
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg mx-auto mb-3">🔗</div>
              <h2 className="text-xl font-bold text-stone-800">Join a Room</h2>
              <p className="text-stone-500 text-sm mt-1">Enter the code from your friend</p>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 text-base font-medium text-stone-800 transition-all bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 text-2xl font-mono font-bold text-center tracking-[0.3em] uppercase text-stone-800 transition-all bg-white"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 rounded-xl p-3 border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !isConnected}
              className="w-full py-4 px-6 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </button>
            
            <p className="text-center text-xs text-stone-400">
              You'll join as a guest (Right Side)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
