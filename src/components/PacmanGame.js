'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import socket from '@/lib/socket'
import sounds from '@/lib/sounds'

// Maze layout (simple 2D grid) 1=Wall, 0=Dot, 2=Empty start, 3=Power Pellet
// 21x21 grid
const MAZE_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
  [1,3,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,3,1],
  [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,1,2,2,2,1,1,1,0,1,1,1,1,1],
  [1,1,1,1,1,0,1,2,2,2,2,2,2,2,1,0,1,1,1,1,1],
  [1,1,1,1,1,0,1,2,2,2,2,2,2,2,1,0,1,1,1,1,1],
  [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1],
  [1,3,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,3,1],
  [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

// Constants
const CELL_SIZE = 25
const SPEED = 2
const BOARD_WIDTH = MAZE_GRID[0].length * CELL_SIZE // 525
const BOARD_HEIGHT = MAZE_GRID.length * CELL_SIZE // 525

// Directions
const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 }
}

export default function PacmanGame({ side, onClose, leftPacmanImage, rightPacmanImage, onGameWin }) { // 'left' or 'right' player
  const canvasRef = useRef(null)
  const [score, setScore] = useState({ left: 0, right: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  
  // Players state (positions allow decimals for smooth movement)
  // Grid coordinates are Math.floor(pixelPos / CELL_SIZE)
  const playersRef = useRef({
    left: { x: 1 * CELL_SIZE, y: 1 * CELL_SIZE, dir: DIRS.NONE, nextDir: DIRS.NONE, score: 0, mouthOpen: 0 },
    right: { x: 19 * CELL_SIZE, y: 19 * CELL_SIZE, dir: DIRS.NONE, nextDir: DIRS.NONE, score: 0, mouthOpen: 0 }
  })
  
  // Game state (pellets)
  const pelletsRef = useRef([])
  const frameRef = useRef(0)
  
  // Images
  const leftImgRef = useRef(null)
  const rightImgRef = useRef(null)

  // Initialize
  useEffect(() => {
    // Load images
    if (leftPacmanImage) {
      const img = new Image()
      img.src = leftPacmanImage
      leftImgRef.current = img
    }
    if (rightPacmanImage) {
      const img = new Image()
      img.src = rightPacmanImage
      rightImgRef.current = img
    }

    // Initialize pellets
    const p = []
    for (let y = 0; y < MAZE_GRID.length; y++) {
      for (let x = 0; x < MAZE_GRID[y].length; x++) {
        if (MAZE_GRID[y][x] === 0) p.push({ x, y, type: 'dot', active: true })
        if (MAZE_GRID[y][x] === 3) p.push({ x, y, type: 'power', active: true })
      }
    }
    pelletsRef.current = p
  }, [leftPacmanImage, rightPacmanImage])

  // Networking
  useEffect(() => {
    const handleMove = ({ side: s, dir, x, y }) => {
       if (s !== side) {
           playersRef.current[s].x = x
           playersRef.current[s].y = y
           playersRef.current[s].dir = dir
       }
    }
    
    const handleEat = ({ pelletIndex, side: s }) => {
       if (pelletsRef.current[pelletIndex] && pelletsRef.current[pelletIndex].active) {
           pelletsRef.current[pelletIndex].active = false
           // Update score locally for display
           playersRef.current[s].score += (pelletsRef.current[pelletIndex].type === 'power' ? 50 : 10)
           setScore(prev => ({
               ...prev,
               [s]: playersRef.current[s].score
           }))
       }
    }

    socket.on('pacman-move', handleMove)
    socket.on('pacman-eat', handleEat)
    
    return () => {
        socket.off('pacman-move', handleMove)
        socket.off('pacman-eat', handleEat)
    }
  }, [side])

  // Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      let newDir = null
      if (['ArrowUp', 'w', 'W'].includes(e.key)) newDir = DIRS.UP
      if (['ArrowDown', 's', 'S'].includes(e.key)) newDir = DIRS.DOWN
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) newDir = DIRS.LEFT
      if (['ArrowRight', 'd', 'D'].includes(e.key)) newDir = DIRS.RIGHT
      
      if (newDir) {
           playersRef.current[side].nextDir = newDir
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [side])

  // Game Loop
  useEffect(() => {
    let animationId
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const canMove = (x, y, dir) => {
        // Calculate next position center
        const centerX = x + CELL_SIZE/2 + dir.x * SPEED
        const centerY = y + CELL_SIZE/2 + dir.y * SPEED
        
        // Check grid cell at that center
        const gridX = Math.floor(centerX / CELL_SIZE)
        const gridY = Math.floor(centerY / CELL_SIZE)
        
        // Bounds check
        if (gridY < 0 || gridY >= MAZE_GRID.length || gridX < 0 || gridX >= MAZE_GRID[0].length) return false
        
        return MAZE_GRID[gridY][gridX] !== 1
    }
    
    // Snap to grid for turning
    const tryTurn = (p, currentDir, nextDir) => {
        if (nextDir === DIRS.NONE || nextDir === currentDir) return currentDir
        
        // Exact center check to allow turn
        const centerX = p.x + CELL_SIZE/2
        const centerY = p.y + CELL_SIZE/2
        
        const gridX = Math.floor(centerX / CELL_SIZE)
        const gridY = Math.floor(centerY / CELL_SIZE)
        
        const cellCenterX = gridX * CELL_SIZE + CELL_SIZE/2
        const cellCenterY = gridY * CELL_SIZE + CELL_SIZE/2
        
        // If close enough to center, snap and turn
        if (Math.abs(centerX - cellCenterX) < SPEED && Math.abs(centerY - cellCenterY) < SPEED) {
             // Check if target cell in nextDir is free
             const targetX = gridX + nextDir.x
             const targetY = gridY + nextDir.y
             if (MAZE_GRID[targetY][targetX] !== 1) {
                 p.x = gridX * CELL_SIZE
                 p.y = gridY * CELL_SIZE
                 return nextDir
             }
        }
        
        // Allow reversing immediately anywhere
        if (nextDir.x === -currentDir.x && nextDir.y === -currentDir.y) {
            return nextDir
        }
        
        return currentDir
    }

    const gameloop = () => {
       frameRef.current++
       
       // Update Local Player
       const p = playersRef.current[side]
       
       // Try to change direction
       p.dir = tryTurn(p, p.dir, p.nextDir)
       
       // Move
       if (canMove(p.x, p.y, p.dir)) {
           p.x += p.dir.x * SPEED
           p.y += p.dir.y * SPEED
           
           // Mouth animation
           p.mouthOpen = Math.abs(Math.sin(frameRef.current * 0.2)) * 0.5
           
           // Emit move (throttled)
           if (frameRef.current % 3 === 0) {
               socket.emit('pacman-move', { side, dir: p.dir, x: p.x, y: p.y })
           }
           
           // Collision with pellets
           const centerX = p.x + CELL_SIZE/2
           const centerY = p.y + CELL_SIZE/2
           
           pelletsRef.current.forEach((pellet, idx) => {
               if (!pellet.active) return
               const px = pellet.x * CELL_SIZE + CELL_SIZE/2
               const py = pellet.y * CELL_SIZE + CELL_SIZE/2
               const dist = Math.hypot(centerX - px, centerY - py)
               
               if (dist < CELL_SIZE/2) {
                   // Eat
                   pellet.active = false
                   p.score += (pellet.type === 'power' ? 50 : 10)
                   setScore(s => ({ ...s, [side]: p.score }))
                   socket.emit('pacman-eat', { pelletIndex: idx, side })
                   
                   if (pellet.type === 'power') sounds.pop()
               }
           })
       }
       
       // Check win condition (all pellets eaten)
       if (pelletsRef.current.every(pl => !pl.active) && !gameOver) {
           setGameOver(true)
           const w = score.left > score.right ? 'left' : 'right'
           setWinner(w)
           if (w === side) {
                onGameWin && onGameWin(50) // 50 coins for clearing maze
                sounds.success()
           }
       }
       
       // Render
       ctx.fillStyle = '#000000'
       ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
       
       // Draw Maze
       ctx.fillStyle = '#1e3a8a' // Blue walls
       ctx.shadowColor = '#3b82f6'
       ctx.shadowBlur = 10
       for (let y = 0; y < MAZE_GRID.length; y++) {
          for (let x = 0; x < MAZE_GRID[y].length; x++) {
              if (MAZE_GRID[y][x] === 1) {
                  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
              }
          }
       }
       ctx.shadowBlur = 0
       
       // Draw Pellets
       pelletsRef.current.forEach(pellet => {
           if (!pellet.active) return
           ctx.beginPath()
           ctx.arc(
               pellet.x * CELL_SIZE + CELL_SIZE/2, 
               pellet.y * CELL_SIZE + CELL_SIZE/2, 
               pellet.type === 'power' ? 6 : 2, 
               0, Math.PI * 2
           )
           ctx.fillStyle = '#fce7f3' // Pink dots
           if (pellet.type === 'power') {
               ctx.shadowBlur = 5
               ctx.shadowColor = '#ec4899'
           }
           ctx.fill()
           ctx.shadowBlur = 0
       })
       
       // Draw Players
       ;['left', 'right'].forEach(s => {
           const ply = playersRef.current[s]
           const img = s === 'left' ? leftImgRef.current : rightImgRef.current
           
           ctx.save()
           ctx.translate(ply.x + CELL_SIZE/2, ply.y + CELL_SIZE/2)
           
           // Rotate based on dir
           let angle = 0
           if (ply.dir === DIRS.UP) angle = -Math.PI/2
           if (ply.dir === DIRS.DOWN) angle = Math.PI/2
           if (ply.dir === DIRS.LEFT) angle = Math.PI
           
           ctx.rotate(angle)
           
           if (img) {
               ctx.drawImage(img, -CELL_SIZE/1.5, -CELL_SIZE/1.5, CELL_SIZE*1.3, CELL_SIZE*1.3)
           } else {
               // Fallback Pacman drawing
               ctx.beginPath()
               ctx.arc(0, 0, CELL_SIZE/2 - 2, 
                   0.2 * Math.PI + ply.mouthOpen, 
                   1.8 * Math.PI - ply.mouthOpen
               )
               ctx.lineTo(0, 0)
               ctx.fillStyle = s === 'left' ? '#fbbf24' : '#60a5fa'
               ctx.fill()
           }
           
           ctx.restore()
       })
       
       animationId = requestAnimationFrame(gameloop)
    }
    
    animationId = requestAnimationFrame(gameloop)
    return () => cancelAnimationFrame(animationId)
  }, [side])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-stone-900 p-4 rounded-2xl shadow-2xl border-4 border-indigo-500">
        <div className="mb-4 flex justify-between items-center text-white font-mono">
            <div className="flex flex-col items-center w-32 border-b-2 border-amber-500 pb-2">
                <span className="text-xs text-amber-500">LEFT</span>
                <span className="text-3xl font-black">{score.left}</span>
            </div>
            
            <div className="text-center px-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">MAZE MASTER</h2>
                <div className="text-[10px] text-stone-400">Use Arrow Keys</div>
            </div>
            
            <div className="flex flex-col items-center w-32 border-b-2 border-sky-500 pb-2">
                <span className="text-xs text-sky-500">RIGHT</span>
                <span className="text-3xl font-black">{score.right}</span>
            </div>
        </div>

        <canvas 
            ref={canvasRef}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            className="rounded-lg shadow-inner bg-black cursor-none mx-auto border-2 border-indigo-900"
        />
        
        <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full text-white font-bold shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        >
            ×
        </button>

        {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
                <div className="text-center animate-bounce">
                    <h1 className="text-5xl font-black text-white mb-2">{winner} Wins!</h1>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-bold text-white shadow-lg hover:scale-105 transition-transform"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}
