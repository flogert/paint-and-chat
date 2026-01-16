'use client'

import { useEffect, useState, useRef } from 'react'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B5DE5', '#F15BB5']

const CursorOverlay = ({ socket, roomInfo, containerRef }) => {
  const [cursors, setCursors] = useState({})
  const myCursor = useRef({ x: 0, y: 0 })
  const lastEmit = useRef(0)

  useEffect(() => {
    if (!socket || !roomInfo) return

    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width // Normalize to 0-1
      const y = (e.clientY - rect.top) / rect.height // Normalize to 0-1
      
      myCursor.current = { x, y }

      // Throttle emission to 30fps
      const now = Date.now()
      if (now - lastEmit.current > 33) {
        socket.emit('cursor-move', { x, y, side: roomInfo.side })
        lastEmit.current = now
      }
    }

    const handleRemoteCursor = ({ x, y, side, id }) => {
      if (id === socket.id) return
      setCursors(prev => ({
        ...prev,
        [id]: { x, y, side, color: COLORS[parseInt(id.slice(-4), 16) % COLORS.length] || '#000' }
      }))
    }
    
    const handleCursorRemove = ({ id }) => {
        setCursors(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    window.addEventListener('mousemove', handleMouseMove)
    socket.on('cursor-move', handleRemoteCursor)
    socket.on('user-disconnected', handleCursorRemove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      socket.off('cursor-move', handleRemoteCursor)
      socket.off('user-disconnected', handleCursorRemove)
    }
  }, [socket, roomInfo, containerRef])

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Object.entries(cursors).map(([id, cursor]) => (
        <div
            key={id}
            className="absolute transition-transform duration-100 ease-linear flex flex-col items-start"
            style={{
                left: 0,
                top: 0,
                transform: `translate(${cursor.x * 100}%, ${cursor.y * 100}%)`
            }}
        >
            <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="transform -translate-x-1 -translate-y-1 drop-shadow-md"
            >
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7841 12.3673H5.65376Z" fill={cursor.color} stroke="white"/>
            </svg>
            <span 
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shadow-sm ml-4 -mt-2 whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
            >
                {cursor.side === 'left' ? 'Player 1' : 'Player 2'}
            </span>
        </div>
      ))}
    </div>
  )
}

export default CursorOverlay
