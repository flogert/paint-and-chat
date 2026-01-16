'use client'

import { useEffect, useRef, useState } from 'react'
import socket from '@/lib/socket'

export default function GalagaGame({ onClose, side, leftShipImage, rightShipImage }) {
  const canvasRef = useRef(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [winner, setWinner] = useState(null) // 'coop' so just game over message? Or separate scores? Let's do shared score.

  const gameState = useRef({
    players: {
      left: { x: 300, y: 550, width: 40, height: 40, image: null },
      right: { x: 500, y: 550, width: 40, height: 40, image: null }
    },
    bullets: [], // { x, y, vy, side }
    enemies: [], // { id, x, y, type, width, height }
    stars: [],
    lastShot: 0,
    frameCount: 0,
    score: 0
  })

  // Load images
  useEffect(() => {
    const loadImg = (src) => {
      if (!src) return null
      const img = new Image()
      img.src = src
      return img
    }
    
    gameState.current.players.left.image = loadImg(leftShipImage)
    gameState.current.players.right.image = loadImg(rightShipImage)
    
    // Initialize stars
    for(let i=0; i<50; i++) {
      gameState.current.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1
      })
    }

    // Initialize enemies (Host only initially, but we'll sync)
    if (side === 'left') {
      const enemies = []
      const rows = 4
      const cols = 8
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          enemies.push({
            id: `enemy-${r}-${c}`,
            x: 100 + c * 60,
            y: 50 + r * 50,
            width: 30,
            height: 30,
            type: r % 2
          })
        }
      }
      gameState.current.enemies = enemies
      socket.emit('galaga-sync-enemies', { enemies })
    }
  }, [leftShipImage, rightShipImage, side])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // movement handled in loop via keys pressed check? 
      // Or just event based. Loop is smoother.
      // We'll use a specific key tracking set
    }
    
    const keys = {}
    const onKeyDown = (e) => keys[e.code] = true
    const onKeyUp = (e) => keys[e.code] = false
    
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Socket listeners
    const onMove = ({ side: s, x }) => {
      if (s !== side) gameState.current.players[s].x = x
    }
    
    const onShoot = ({ side: s, x, y }) => {
      gameState.current.bullets.push({ x, y, vy: -5, side: s })
    }

    const onEnemyDestroyed = ({ enemyId, side: scorerSide }) => {
      gameState.current.enemies = gameState.current.enemies.filter(e => e.id !== enemyId)
      gameState.current.score += 100
      setScore(gameState.current.score)
      // Play sound?
    }

    const onSyncEnemies = ({ enemies }) => {
      if (side === 'right') { // Only receive if not host
        gameState.current.enemies = enemies
      }
    }

    socket.on('galaga-move', onMove)
    socket.on('galaga-shoot', onShoot)
    socket.on('galaga-enemy-destroyed', onEnemyDestroyed)
    socket.on('galaga-sync-enemies', onSyncEnemies)

    // Game Loop
    let animationId
    const loop = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const state = gameState.current
      
      // Update local player
      let moved = false
      if (keys['ArrowLeft'] || keys['KeyA']) {
        state.players[side].x = Math.max(20, state.players[side].x - 5)
        moved = true
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        state.players[side].x = Math.min(canvas.width - 20, state.players[side].x + 5)
        moved = true
      }
      
      if (moved) {
        socket.emit('galaga-move', { side, x: state.players[side].x })
      }

      // Shooting
      if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && Date.now() - state.lastShot > 300) {
        const bulletX = state.players[side].x
        const bulletY = state.players[side].y - 20
        // Optimistic add
        // state.bullets.push({ x: bulletX, y: bulletY, vy: -5, side }) 
        // Actually wait for socket echo? No, better feedback to add instant, but to prevent duplicates filter emitted ones?
        // Simpler: Just emit, and let server broadcast back? 
        // Actually for fast shooting games, local + emit is standard.
        // We will receive our own shoot event if we use io.to(room).
        // Let's rely on the listener to add the bullet to avoid duplication logic.
        // BUT input lag feels bad. Let's add locally and ignore 'own' socket event?
        // Current server implementation: emits to whole room including sender.
        // So we just emit here, and handle the addition in the listener. (Lag might be visible)
        // Let's try direct add + socket.emit, and in listener filter out own?
        // Server sends to ALL. So in listener we check if (s !== side).
        
        socket.emit('galaga-shoot', { side, x: bulletX, y: bulletY })
        // Add locally immediately for responsiveness
        state.bullets.push({ x: bulletX, y: bulletY, vy: -5, side })
        state.lastShot = Date.now()
      }

      // Update bullets
      state.bullets.forEach(b => b.y += b.vy)
      state.bullets = state.bullets.filter(b => b.y > -50)

      // Update Enemies (Host only triggers logic, but movement can be deterministic locally)
      // Let's just move them locally for smoothness on both clients
      const enemySpeed = 1 + (state.score / 5000)
      const t = Date.now() / 1000
      state.enemies.forEach(e => {
        e.y += 0.2 * enemySpeed
        e.x += Math.sin(t + e.y/100) * 1
      })
      
      // Sync occasionally if host?
      if (side === 'left' && state.frameCount % 120 === 0) {
        socket.emit('galaga-sync-enemies', { enemies: state.enemies })
      }

      // Collision Detection (Local checks for hits)
      state.bullets.forEach((b, bIdx) => {
        if (b.used) return
        // Check enemy hits
        state.enemies.forEach(e => {
            if (Math.abs(b.x - e.x) < e.width/2 + 5 && Math.abs(b.y - e.y) < e.height/2 + 5) {
                // Hit!
                b.used = true
                socket.emit('galaga-hit-enemy', { enemyId: e.id, side: b.side }) // Server will broadcast destroy
                // Optimistically destroy here?
                // state.enemies = state.enemies.filter(en => en.id !== e.id)
                // Let's wait for server to sure sync
            }
        })
      })
      state.bullets = state.bullets.filter(b => !b.used)
      
      // Draw everything
      ctx.fillStyle = '#0f172a' // Dark blue space
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Stars
      ctx.fillStyle = '#ffffff'
      state.stars.forEach(s => {
        ctx.globalAlpha = Math.random() * 0.5 + 0.5
        ctx.fillRect(s.x, (s.y + t * 10 * s.speed) % canvas.height, s.size, s.size)
        // Move stars logic inline for visual
      })
      ctx.globalAlpha = 1

      // Players
      ;['left', 'right'].forEach(pSide => {
         const p = state.players[pSide]
         if (p.image && p.image.complete) {
            // Draw image centered
             ctx.drawImage(p.image, p.x - 20, p.y - 20, 40, 40)
         } else {
             // Fallback
             ctx.fillStyle = pSide === 'left' ? '#ff6b35' : '#3b82f6'
             ctx.beginPath()
             ctx.moveTo(p.x, p.y - 20)
             ctx.lineTo(p.x - 15, p.y + 15)
             ctx.lineTo(p.x + 15, p.y + 15)
             ctx.fill()
         }
         // Name label?
      })

      // Enemies
      state.enemies.forEach(e => {
          ctx.fillStyle = e.type === 0 ? '#ef4444' : '#22c55e'
          ctx.fillRect(e.x - e.width/2, e.y - e.height/2, e.width, e.height)
          // Eyes
          ctx.fillStyle = '#000'
          ctx.fillRect(e.x - 5, e.y - 5, 2, 2)
          ctx.fillRect(e.x + 5, e.y - 5, 2, 2)
      })

      // Bullets
      state.bullets.forEach(b => {
          ctx.fillStyle = '#f59e0b'
          ctx.fillRect(b.x - 2, b.y - 4, 4, 8)
      })
      
      state.frameCount++
      animationId = requestAnimationFrame(loop)
    }

    loop()
    return () => {
        cancelAnimationFrame(animationId)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        socket.off('galaga-move', onMove)
        socket.off('galaga-shoot', onShoot)
        socket.off('galaga-enemy-destroyed', onEnemyDestroyed)
        socket.off('galaga-sync-enemies', onSyncEnemies)
    }

  }, [side])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative bg-slate-800 p-2 rounded-xl border border-slate-600 shadow-2xl">
        <div className="flex justify-between items-center mb-2 px-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-mono">
                SPACE PAINTERS
            </h2>
            <div className="text-white font-mono text-lg">Score: {score}</div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition-colors"
            >
                ✕
            </button>
        </div>
        
        <canvas 
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-slate-900 rounded-lg shadow-inner cursor-none"
            style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        />
        
        <div className="mt-4 flex justify-between text-xs text-slate-400 font-mono px-4">
            <span>CONTROLS: Arrow Keys to Move, Space to Shoot</span>
            <span>Destroy enemies together!</span>
        </div>
      </div>
    </div>
  )
}