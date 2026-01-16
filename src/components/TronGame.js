'use client'

import { useState, useEffect, useRef } from 'react'
import socket from '@/lib/socket'

export default function TronGame({ onClose, playerSide, leftImage, rightImage }) {
  const canvasRef = useRef(null)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState("Get Ready!")
  
  // Game constants
  const GRID_SIZE = 5
  const SPEED = 5
  
  const gameState = useRef({
    running: false,
    players: {
      left: { x: 100, y: 300, dir: 'right', color: '#ff6b35', image: null, trail: [], alive: true },
      right: { x: 700, y: 300, dir: 'left', color: '#3b82f6', image: null, trail: [], alive: true }
    },
    grid: new Set() // Store occupied coordinates "x,y"
  })

  useEffect(() => {
    // Load images
    const loadImg = (src) => {
      if (!src) return null
      const img = new Image()
      img.src = src
      return img
    }
    gameState.current.players.left.image = loadImg(leftImage)
    gameState.current.players.right.image = loadImg(rightImage)
    
    // Auto start after short delay
    setTimeout(() => {
      gameState.current.running = true
      setMessage("")
    }, 2000)

    // Keyboard controls
    const handleKeyDown = (e) => {
      if (!gameState.current.running) return
      
      const p = gameState.current.players[playerSide]
      let newDir = null
      
      if ((e.key === 'ArrowUp' || e.key === 'w') && p.dir !== 'down') newDir = 'up'
      if ((e.key === 'ArrowDown' || e.key === 's') && p.dir !== 'up') newDir = 'down'
      if ((e.key === 'ArrowLeft' || e.key === 'a') && p.dir !== 'right') newDir = 'left'
      if ((e.key === 'ArrowRight' || e.key === 'd') && p.dir !== 'left') newDir = 'right'
      
      if (newDir && newDir !== p.dir) {
        p.dir = newDir
        // Emit move immediately for responsiveness logic? 
        // Actually Tron is continuous movement. We just sync turns?
        // Or better: sync position + direction.
        socket.emit('tron-move', { side: playerSide, direction: newDir, x: p.x, y: p.y })
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)

    // Socket listeners
    const onMove = ({ side, direction, x, y }) => {
      if (side !== playerSide) {
        const p = gameState.current.players[side]
        p.dir = direction
        // Snapping for sync
        p.x = x
        p.y = y
      }
    }

    const onDied = ({ side }) => {
       gameState.current.running = false
       if (side === playerSide) {
           setMessage("CRASH! You Lost!")
       } else {
           setMessage("VICTORY! Opponent Crashed!")
       }
    }

    socket.on('tron-move', onMove)
    socket.on('tron-died', onDied)

    // Game Loop
    let animationId
    const loop = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const state = gameState.current

      if (state.running) {
        // Move players
        ['left', 'right'].forEach(side => {
          const p = state.players[side]
          if (!p.alive) return

          // Add current pos to grid
          // To optimize: only add every few frames? Or draw continuous line?
          // Grid based collision is easier.
          // Let's assume lines are 4px wide.
          
          p.x += (p.dir === 'right' ? SPEED : p.dir === 'left' ? -SPEED : 0)
          p.y += (p.dir === 'down' ? SPEED : p.dir === 'up' ? -SPEED : 0)
          
          // Wall Collision
          if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
              if (side === playerSide) {
                  socket.emit('tron-died', { side })
                  onDied({ side }) // Local trigger
              }
          }

          // Trail Collision
          // Check pixel data or simpler math?
          // Simpler: Check against stored trail segments.
          // Store trail as lines: {x1,y1, x2,y2}
          // Current: p.trail is array of points.
          p.trail.push({x: p.x, y: p.y})
          
          // Self/Opponent Collision logic is tricky in continuous smooth movement.
          // Cheap hack: Check Canvas pixel data ahead? 
          // Or check distance to all trail points (expensive).
          // OPTIMIZATION: Only check every 5th point?
        })
        
        // Better Collision: Check pixel color at future position
        // Only checking for "myself" crashing
        const myP = state.players[playerSide]
        const aheadX = myP.x + (myP.dir === 'right' ? 6 : myP.dir === 'left' ? -6 : 0)
        const aheadY = myP.y + (myP.dir === 'down' ? 6 : myP.dir === 'up' ? -6 : 0)
        
        // Boundary check (redundant but safe)
        if (aheadX < 0 || aheadX > canvas.width || aheadY < 0 || aheadY > canvas.height) {
             // Wall handled above
        } else {
            // Check trail collision via getImageData
            // Note: Canvas state is from previous frame draw (tails are drawn).
            const pixel = ctx.getImageData(aheadX, aheadY, 1, 1).data
            // If not dark background (alpha > 0 and rgb not essentially black)
            // Background is #0f172a (15, 23, 42)
            // Trails are bright.
            if ((pixel[0] > 50 || pixel[1] > 50 || pixel[2] > 50) && pixel[0] !== 15) {
                // Crash!
                // Unless it's our own image? No, image is drawn at current pos. Trails are behind.
                if (state.running) { // check state again to avoid double death
                    socket.emit('tron-died', { side: playerSide })
                    onDied({ side: playerSide })
                }
            }
        }
      }

      // Draw
      // Clear with trail persistence? No, redraw all for clean look or use clearing rect?
      // For tron, trails persist.
      // But we need to move the head (image).
      // So clear screen, redraw all trails, draw heads.
      
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Grid lines
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      ctx.beginPath()
      for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, canvas.height) }
      for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(canvas.width, i) }
      ctx.stroke()

      ;['left', 'right'].forEach(side => {
          const p = state.players[side]
          
          // Draw Trail
          ctx.strokeStyle = p.color
          ctx.lineWidth = 4
          ctx.beginPath()
          if (p.trail.length > 0) {
              ctx.moveTo(p.trail[0].x, p.trail[0].y)
              for(let i=1; i<p.trail.length; i++) {
                  // Skip large jumps if we add wrap-around later
                  ctx.lineTo(p.trail[i].x, p.trail[i].y)
              }
          }
           // Connect last trail to current
          if (p.trail.length > 0) {
              const last = p.trail[p.trail.length-1]
              ctx.lineTo(p.x, p.y)
          }
          ctx.stroke()
          
          // Glow
          ctx.shadowBlur = 10
          ctx.shadowColor = p.color
          
          // Draw Head (Image or Box)
          if (p.image && p.image.complete) {
              ctx.save()
              ctx.translate(p.x, p.y)
              // Rotate based on dir
              let rot = 0
              if (p.dir === 'down') rot = Math.PI/2
              if (p.dir === 'left') rot = Math.PI
              if (p.dir === 'up') rot = -Math.PI/2
              ctx.rotate(rot)
              
              ctx.drawImage(p.image, -15, -15, 30, 30)
              ctx.restore()
          } else {
              ctx.fillStyle = p.color
              ctx.fillRect(p.x-5, p.y-5, 10, 10)
          }
          ctx.shadowBlur = 0
      })
      
      if (message) {
          ctx.fillStyle = 'white'
          ctx.font = 'bold 40px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(message, canvas.width/2, canvas.height/2)
      }

      animationId = requestAnimationFrame(loop)
    }
    
    loop()
    
    return () => {
        cancelAnimationFrame(animationId)
        window.removeEventListener('keydown', handleKeyDown)
        socket.off('tron-move', onMove)
        socket.off('tron-died', onDied)
    }
  }, [playerSide, leftImage, rightImage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative bg-slate-900 p-2 rounded-xl border border-cyan-500/50 shadow-2xl flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-2 px-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-mono tracking-widest">
                NEON RACERS
            </h2>
            <button 
                onClick={onClose}
                className="p-1 hover:bg-slate-800 rounded-full text-gray-400 hover:text-white"
            >
                ✕
            </button>
        </div>
        
        <canvas 
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-slate-950 rounded-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        />
        
        <div className="mt-4 text-xs text-cyan-400 font-mono">
             Use Arrow Keys. Don&apos;t hit the walls or trails!
        </div>
      </div>
    </div>
  )
}