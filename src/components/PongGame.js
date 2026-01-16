'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import socket from '@/lib/socket'
import sounds from '@/lib/sounds'

export default function PongGame({ isActive, playerSide, onClose, onScoreUpdate, leftPaddleImage, rightPaddleImage, onGameWin }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const leftImgRef = useRef(null)
  const rightImgRef = useRef(null)
  const gameStateRef = useRef({
    ball: { x: 0.5, y: 0.5, vx: 0.008, vy: 0.006 },
    leftPaddle: 0.5,
    rightPaddle: 0.5,
    leftScore: 0,
    rightScore: 0,
    isHost: playerSide === 'left',
    leftImg: null,
    rightImg: null
  })

  useEffect(() => {
     if (leftPaddleImage) {
         const img = new Image()
         img.src = leftPaddleImage
         leftImgRef.current = img
     }
     if (rightPaddleImage) {
         const img = new Image()
         img.src = rightPaddleImage
         rightImgRef.current = img
     }
  }, [leftPaddleImage, rightPaddleImage])
  
  const [scores, setScores] = useState({ left: 0, right: 0 })
  const keysPressed = useRef({ up: false, down: false })

  const PADDLE_HEIGHT = 0.15
  const PADDLE_WIDTH = 0.02
  const BALL_SIZE = 0.02
  const PADDLE_SPEED = 0.025

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysPressed.current.up = true
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysPressed.current.down = true
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysPressed.current.up = false
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysPressed.current.down = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle paddle movement from other player
  useEffect(() => {
    const handlePaddleMove = (data) => {
      if (data.side === 'left' && playerSide === 'right') {
        gameStateRef.current.leftPaddle = data.position
      } else if (data.side === 'right' && playerSide === 'left') {
        gameStateRef.current.rightPaddle = data.position
      }
    }

    const handleBallSync = (data) => {
      // Only non-host receives ball sync
      if (playerSide !== 'left') {
        gameStateRef.current.ball = data.ball
        if (data.scores) {
          gameStateRef.current.leftScore = data.scores.left
          gameStateRef.current.rightScore = data.scores.right
          setScores(data.scores)
        }
      }
    }

    const handlePongScore = (data) => {
      setScores(data.scores)
      gameStateRef.current.leftScore = data.scores.left
      gameStateRef.current.rightScore = data.scores.right
      sounds.pop()
    }

    socket.on('pongPaddle', handlePaddleMove)
    socket.on('pongBall', handleBallSync)
    socket.on('pongScore', handlePongScore)

    return () => {
      socket.off('pongPaddle', handlePaddleMove)
      socket.off('pongBall', handleBallSync)
      socket.off('pongScore', handlePongScore)
    }
  }, [playerSide])

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const state = gameStateRef.current
    const isHost = playerSide === 'left'

    // Update paddle position based on input
    const myPaddle = playerSide === 'left' ? 'leftPaddle' : 'rightPaddle'
    
    if (keysPressed.current.up) {
      state[myPaddle] = Math.max(PADDLE_HEIGHT / 2, state[myPaddle] - PADDLE_SPEED)
    }
    if (keysPressed.current.down) {
      state[myPaddle] = Math.min(1 - PADDLE_HEIGHT / 2, state[myPaddle] + PADDLE_SPEED)
    }

    // Send paddle position to other player
    socket.emit('pongPaddle', { side: playerSide, position: state[myPaddle] })

    // Only host updates ball physics
    if (isHost) {
      // Update ball position
      state.ball.x += state.ball.vx
      state.ball.y += state.ball.vy

      // Ball collision with top/bottom walls
      if (state.ball.y <= BALL_SIZE / 2 || state.ball.y >= 1 - BALL_SIZE / 2) {
        state.ball.vy *= -1
        state.ball.y = Math.max(BALL_SIZE / 2, Math.min(1 - BALL_SIZE / 2, state.ball.y))
        sounds.tick()
      }

      // Ball collision with left paddle
      if (state.ball.x <= PADDLE_WIDTH + BALL_SIZE / 2 && 
          state.ball.x >= PADDLE_WIDTH / 2 &&
          state.ball.y >= state.leftPaddle - PADDLE_HEIGHT / 2 && 
          state.ball.y <= state.leftPaddle + PADDLE_HEIGHT / 2) {
        state.ball.vx = Math.abs(state.ball.vx) * 1.05 // Speed up slightly
        state.ball.vy += (state.ball.y - state.leftPaddle) * 0.02 // Add angle based on hit position
        sounds.pop()
      }

      // Ball collision with right paddle
      if (state.ball.x >= 1 - PADDLE_WIDTH - BALL_SIZE / 2 && 
          state.ball.x <= 1 - PADDLE_WIDTH / 2 &&
          state.ball.y >= state.rightPaddle - PADDLE_HEIGHT / 2 && 
          state.ball.y <= state.rightPaddle + PADDLE_HEIGHT / 2) {
        state.ball.vx = -Math.abs(state.ball.vx) * 1.05
        state.ball.vy += (state.ball.y - state.rightPaddle) * 0.02
        sounds.pop()
      }

      // Scoring
      if (state.ball.x < 0) {
        // Right scores
        state.rightScore++
        setScores({ left: state.leftScore, right: state.rightScore })
        socket.emit('pongScore', { scores: { left: state.leftScore, right: state.rightScore } })
        sounds.success()
        
        if (state.rightScore >= 5) {
             onGameWin && onGameWin(10) // 10 coins for winning
        }

        // Reset ball
        state.ball = { x: 0.5, y: 0.5, vx: -0.008, vy: (Math.random() - 0.5) * 0.01 }
      } else if (state.ball.x > 1) {
        // Left scores
        state.leftScore++
        setScores({ left: state.leftScore, right: state.rightScore })
        socket.emit('pongScore', { scores: { left: state.leftScore, right: state.rightScore } })
        sounds.success()

        if (state.leftScore >= 5) {
             onGameWin && onGameWin(10) // 10 coins for winning
        }

        // Reset ball
        state.ball = { x: 0.5, y: 0.5, vx: 0.008, vy: (Math.random() - 0.5) * 0.01 }
      }

      // Sync ball state to other players
      socket.emit('pongBall', { ball: state.ball, scores: { left: state.leftScore, right: state.rightScore } })
    }

    // Draw everything
    const w = canvas.width
    const h = canvas.height

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, w, h)

    // Draw center line
    ctx.setLineDash([10, 10])
    ctx.strokeStyle = '#ffffff30'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw scores
    ctx.fillStyle = '#ffffff40'
    ctx.font = `bold ${Math.floor(h * 0.15)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText(state.leftScore.toString(), w * 0.25, h * 0.18)
    ctx.fillText(state.rightScore.toString(), w * 0.75, h * 0.18)

    // Draw paddles
    const paddleW = w * PADDLE_WIDTH
    const paddleH = h * PADDLE_HEIGHT

    // Left paddle
    const leftY = h * state.leftPaddle
    if (leftImgRef.current) {
      ctx.save()
      ctx.translate(paddleW / 2, leftY)
      ctx.rotate(Math.PI / 2) 
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 10
      ctx.drawImage(leftImgRef.current, -paddleH / 2, -paddleW / 2, paddleH, paddleW)
      ctx.restore()
    } else {
      const leftGrad = ctx.createLinearGradient(0, 0, paddleW, 0)
      leftGrad.addColorStop(0, '#f59e0b')
      leftGrad.addColorStop(1, '#ea580c')
      ctx.fillStyle = leftGrad
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 15
      ctx.fillRect(0, leftY - paddleH / 2, paddleW, paddleH)
    }

    // Right paddle
    const rightY = h * state.rightPaddle
    if (rightImgRef.current) {
      ctx.save()
      ctx.translate(w - paddleW / 2, rightY)
      ctx.rotate(-Math.PI / 2)
      ctx.shadowColor = '#0ea5e9'
      ctx.shadowBlur = 10
      ctx.drawImage(rightImgRef.current, -paddleH / 2, -paddleW / 2, paddleH, paddleW)
      ctx.restore()
    } else {
      const rightGrad = ctx.createLinearGradient(w - paddleW, 0, w, 0)
      rightGrad.addColorStop(0, '#0ea5e9')
      rightGrad.addColorStop(1, '#6366f1')
      ctx.fillStyle = rightGrad
      ctx.shadowColor = '#0ea5e9'
      ctx.shadowBlur = 15
      ctx.fillRect(w - paddleW, rightY - paddleH / 2, paddleW, paddleH)
    }

    // Draw ball
    const ballRadius = Math.min(w, h) * BALL_SIZE / 2
    ctx.beginPath()
    ctx.arc(w * state.ball.x, h * state.ball.y, ballRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.shadowBlur = 0

    // Draw player indicator
    ctx.font = '14px system-ui'
    ctx.fillStyle = playerSide === 'left' ? '#f59e0b' : '#0ea5e9'
    ctx.textAlign = playerSide === 'left' ? 'left' : 'right'
    ctx.fillText(
      `You: ${playerSide === 'left' ? '🎨 Left' : '🖌️ Right'}`,
      playerSide === 'left' ? 10 : w - 10,
      h - 10
    )

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [playerSide])

  // Start/stop game loop
  useEffect(() => {
    if (isActive) {
      // Reset game state
      gameStateRef.current = {
        ball: { x: 0.5, y: 0.5, vx: 0.008, vy: 0.006 },
        leftPaddle: 0.5,
        rightPaddle: 0.5,
        leftScore: 0,
        rightScore: 0,
        isHost: playerSide === 'left'
      }
      setScores({ left: 0, right: 0 })
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, gameLoop])

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        canvasRef.current.width = container.offsetWidth
        canvasRef.current.height = container.offsetHeight
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="absolute inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg transition-all"
      >
        ✕ Exit Pong
      </button>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-50 text-white/60 text-sm">
        <p>↑↓ or W/S to move</p>
        <p>First to 10 wins!</p>
      </div>

      {/* Score display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-8 text-white font-black text-2xl">
        <span className="text-amber-400">{scores.left}</span>
        <span className="text-white/30">-</span>
        <span className="text-sky-400">{scores.right}</span>
      </div>

      {/* Win message */}
      {(scores.left >= 10 || scores.right >= 10) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <div className={`text-4xl font-black ${scores.left >= 10 ? 'text-amber-400' : 'text-sky-400'}`}>
              {scores.left >= 10 ? '🎨 Left' : '🖌️ Right'} Wins!
            </div>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:from-amber-600 hover:to-orange-600"
            >
              Back to Drawing
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
