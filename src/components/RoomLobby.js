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
    <div className="fixed inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 flex items-center justify-center z-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/20 to-indigo-100/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-stone-200/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <span className="text-4xl">🎨</span>
            <span className="text-4xl">🖌️</span>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 mb-2">
            Paint & Chat
          </h1>
          <p className="text-stone-500">Draw together with friends!</p>
          {!isConnected && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Connecting to server...
              </div>
              <button
                onClick={() => socket.connect()}
                className="text-xs text-stone-500 hover:text-stone-700 underline"
              >
                Retry connection
              </button>
            </div>
          )}
          {isConnected && (
            <div className="mt-3 inline-flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              Connected
            </div>
          )}
        </div>

        {mode === 'menu' && (
          <div className="space-y-4">
            {/* Player Name Input */}
            <div>
              <label className="text-sm font-bold text-stone-600 block mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 text-lg font-medium text-stone-800 transition-all bg-stone-50/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🎨</span>
                Create Room
              </button>
              
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🔗</span>
                Join Room
              </button>
            </div>

            {/* Player color preview */}
            <div className="flex items-center justify-center gap-6 pt-6 pb-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mx-auto mb-1 flex items-center justify-center text-2xl">🎨</div>
                <span className="text-xs text-stone-500 font-medium">Left Player</span>
              </div>
              <div className="text-stone-300">×</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg mx-auto mb-1 flex items-center justify-center text-2xl">🖌️</div>
                <span className="text-xs text-stone-500 font-medium">Right Player</span>
              </div>
            </div>

            {/* Info */}
            <p className="text-center text-xs text-stone-400 pt-2">
              Up to 4 players per room • Draw on your side!
            </p>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('menu'); setError('') }}
              className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm"
            >
              Back
            </button>
            
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-stone-700">Create a Room</h2>
              <p className="text-stone-500 text-sm mt-2">You will get a code to share with friends</p>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-600 block mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-lg font-medium text-stone-800 transition-all"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-2">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('menu'); setError('') }}
              className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-sm"
            >
              Back
            </button>
            
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-stone-700">Join a Room</h2>
              <p className="text-stone-500 text-sm mt-2">Enter the code shared by your friend</p>
            </div>

            <div>
              <label className="text-sm font-bold text-stone-600 block mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-lg font-medium text-stone-800 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-stone-600 block mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCD12"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 text-2xl font-mono font-bold text-center tracking-widest uppercase text-stone-800 transition-all"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-2">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinRoom}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 hover:from-sky-500 hover:via-indigo-600 hover:to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
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
          </div>
        )}
      </div>
    </div>
  )
}
