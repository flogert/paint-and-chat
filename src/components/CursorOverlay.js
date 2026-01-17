'use client'

import { useEffect, useState, useRef } from 'react'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B5DE5', '#F15BB5']

const CursorOverlay = ({ socket, roomInfo, containerRef }) => {
  const [cursors, setCursors] = useState({})
  const lastEmit = useRef(0)

  useEffect(() => {
    if (!socket || !roomInfo) return

    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      // Use pixel coordinates relative to container
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Store container dimensions for proper scaling on other clients
      const width = rect.width
      const height = rect.height

      // Throttle emission to 30fps
      const now = Date.now()
      if (now - lastEmit.current > 33) {
        socket.emit('cursor-move', { 
          x: x / width,  // Normalize to 0-1 for transmission
          y: y / height, 
          side: roomInfo.side 
        })
        lastEmit.current = now
      }
    }
    
    const handleTouchMove = (e) => {
      if (!containerRef.current || e.touches.length !== 1) return
      const touch = e.touches[0]
      const rect = containerRef.current.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const width = rect.width
      const height = rect.height
      
      const now = Date.now()
      if (now - lastEmit.current > 33) {
        socket.emit('cursor-move', { 
          x: x / width, 
          y: y / height, 
          side: roomInfo.side 
        })
        lastEmit.current = now
      }
    }

    const handleRemoteCursor = ({ x, y, side, id }) => {
      if (id === socket.id) return
      setCursors(prev => ({
        ...prev,
        [id]: { x, y, side, color: COLORS[parseInt(id.slice(-4), 16) % COLORS.length] || '#000', lastUpdate: Date.now() }
      }))
    }
    
    const handleCursorRemove = ({ id }) => {
        setCursors(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }
    
    // Clean up stale cursors
    const cleanupInterval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now()
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          if (now - next[id].lastUpdate > 5000) delete next[id]
        })
        return next
      })
    }, 2000)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    socket.on('cursor-move', handleRemoteCursor)
    socket.on('user-disconnected', handleCursorRemove)
    socket.on('playerLeft', handleCursorRemove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      socket.off('cursor-move', handleRemoteCursor)
      socket.off('user-disconnected', handleCursorRemove)
      socket.off('playerLeft', handleCursorRemove)
      clearInterval(cleanupInterval)
    }
  }, [socket, roomInfo, containerRef])

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Object.entries(cursors).map(([id, cursor]) => {
        // Get container dimensions for proper positioning
        const rect = containerRef.current?.getBoundingClientRect()
        const px = rect ? cursor.x * rect.width : 0
        const py = rect ? cursor.y * rect.height : 0
        
        return (
          <div
              key={id}
              className="absolute flex flex-col items-start"
              style={{
                  left: `${px}px`,
                  top: `${py}px`,
                  transition: 'left 0.08s linear, top 0.08s linear',
                  willChange: 'left, top'
              }}
          >
              <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="drop-shadow-md"
              >
                  <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19135L11.7841 12.3673H5.65376Z" fill={cursor.color} stroke="white" strokeWidth="1.5"/>
              </svg>
              <span 
                  className="text-[9px] font-bold px-1 py-0.5 rounded text-white shadow-sm -ml-1 -mt-1 whitespace-nowrap opacity-90"
                  style={{ backgroundColor: cursor.color }}
              >
                  {cursor.side === 'left' ? 'P1' : 'P2'}
              </span>
          </div>
        )
      })}
    </div>
  )
}

export default CursorOverlay
