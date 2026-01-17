'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import socket from '@/lib/socket'
import { getBrushSettings, getRandomColor, applyWobble, hexToRgb } from '@/lib/canvasUtils'

const Canvas = forwardRef((props, ref) => {
  const {
  canvasRef,
  // Left player settings
  leftBrushColor,
  leftBrushSize,
  leftBrushStyle,
  leftBrushOpacity,
  leftCurrentTool,
  leftWobblyMode,
  leftRandomColorMode,
  leftMirrorMode,
  leftGlowMode,
  leftScatterMode,
  leftNeonMode,
  leftDiscoMode,
  leftGravityMode,
  leftZigzagMode,
  leftPixelMode,
  // Right player settings
  rightBrushColor,
  rightBrushSize,
  rightBrushStyle,
  rightBrushOpacity,
  rightCurrentTool,
  rightWobblyMode,
  rightRandomColorMode,
  rightMirrorMode,
  rightGlowMode,
  rightScatterMode,
  rightNeonMode,
  rightDiscoMode,
  rightGravityMode,
  rightZigzagMode,
  rightPixelMode,
  // Callbacks
  onColorPick,
  setLeftBrushColor,
  setRightBrushColor,
} = props

  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [activeSide, setActiveSide] = useState(null) // 'left' | 'right'
  const lastPos = useRef(null)
  const ctxRef = useRef(null)

  // Separate undo/redo stacks for each side
  const [leftUndoStack, setLeftUndoStack] = useState([])
  const [leftRedoStack, setLeftRedoStack] = useState([])
  const [rightUndoStack, setRightUndoStack] = useState([])
  const [rightRedoStack, setRightRedoStack] = useState([])

  // Helpers imported from @/lib/canvasUtils
  const getBrushSettingsWrapper = (side) => getBrushSettings(side, props)

  // Determine which side of the canvas the x coordinate is on
  const getSide = (x) => {
    const canvas = canvasRef.current
    if (!canvas) return 'left'
    return x < canvas.width / 2 ? 'left' : 'right'
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let timeoutId = null
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const parent = canvas.parentElement
        if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
            // Save current content
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = canvas.width
            tempCanvas.height = canvas.height
            const tempCtx = tempCanvas.getContext('2d')
            if (canvas.width > 0 && canvas.height > 0) {
                tempCtx.drawImage(canvas, 0, 0)
            }
            
            // Resize
            canvas.width = parent.clientWidth
            canvas.height = parent.clientHeight
            
            // Restore content (scaled)
            if (tempCanvas.width > 0 && tempCanvas.height > 0) {
                ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height)
            }
            
            // Re-apply context settings
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctxRef.current = ctx
        }
      }, 100)
    }

    // Initial size
    // ...existing code...
    const parent = canvas.parentElement
    if (parent) {
       canvas.width = parent.clientWidth
       canvas.height = parent.clientHeight
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
    
    window.addEventListener('resize', handleResize)

    const drawRemote = (data) => {
      const { type, startX, startY, endX, endY, offsetX, offsetY, brushColor, brushSize, brushOpacity, brushStyle, erasing, prevX, prevY } = data
      
      ctx.strokeStyle = erasing ? '#ffffff' : brushColor
      ctx.lineWidth = brushSize
      ctx.globalAlpha = brushOpacity

      // Apply brush style
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      ctx.lineCap = 'round'

      if (brushStyle === 'dotted') {
        ctx.setLineDash([1, 10])
      } else if (brushStyle === 'dashed') {
        ctx.setLineDash([10, 10])
      } else if (brushStyle === 'glow') {
        ctx.setLineDash([])
        ctx.shadowBlur = 10
        ctx.shadowColor = brushColor
      } else if (brushStyle === 'square') {
        ctx.setLineDash([])
        ctx.lineCap = 'square'
      } else {
        ctx.setLineDash([])
      }

      if (type === 'rectangle') {
        ctx.strokeRect(startX, startY, endX - startX, endY - startY)
      } else if (type === 'circle') {
        ctx.beginPath()
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (type === 'line') {
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      } else if (type === 'triangle') {
        ctx.beginPath()
        const width = endX - startX
        const height = endY - startY
        ctx.moveTo(startX + width / 2, startY)
        ctx.lineTo(startX, startY + height)
        ctx.lineTo(endX, startY + height)
        ctx.closePath()
        ctx.stroke()
      } else if (type === 'star') {
        ctx.beginPath()
        const outerRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
        const innerRadius = outerRadius * 0.5
        const spikes = 5
        let rotation = -Math.PI / 2
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = rotation + (i * Math.PI) / spikes
          const px = startX + radius * Math.cos(angle)
          const py = startY + radius * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.closePath()
        ctx.stroke()
      } else {
        // Default brush/eraser
        if (prevX !== undefined && prevY !== undefined) {
          ctx.beginPath()
          ctx.moveTo(prevX, prevY)
          ctx.lineTo(offsetX, offsetY)
          ctx.stroke()
        } else {
          ctx.lineTo(offsetX, offsetY)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(offsetX, offsetY)
        }
      }
    }

    socket.on('draw', drawRemote)

    return () => {
      socket.off('draw', drawRemote)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Save current canvas state for undo (per side)
  const saveState = (side) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    const midPoint = canvas.width / 2
    // Save only the relevant side's image data
    const x = side === 'left' ? 0 : midPoint
    const width = midPoint
    const imageData = ctx.getImageData(x, 0, width, canvas.height)
    
    if (side === 'left') {
      setLeftUndoStack((prev) => [...prev.slice(-20), imageData]) // Keep last 20 states
      setLeftRedoStack([])
    } else {
      setRightUndoStack((prev) => [...prev.slice(-20), imageData])
      setRightRedoStack([])
    }
  }

  const startDrawing = (x, y) => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    // Determine which side the drawing starts on
    const side = getSide(x)
    setActiveSide(side)
    const { brushColor, brushSize, brushStyle, brushOpacity, currentTool, wobblyMode, randomColorMode, mirrorMode, glowMode, scatterMode, neonMode } = getBrushSettingsWrapper(side)

    // Handle eyedropper tool
    if (currentTool === 'eyedropper') {
      const imageData = ctx.getImageData(x, y, 1, 1).data
      const pickedColor = `#${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`
      if (onColorPick) {
        onColorPick(pickedColor, side)
      }
      return
    }

    if (currentTool === 'bucket') {
      fillBucket(x, y, brushColor, side)
      return
    }

    setIsDrawing(true)
    setStartPos({ x, y })
    lastPos.current = { x, y }

    // Save state for shape tools so we can undo/restore preview
    if (['rectangle', 'circle', 'line', 'triangle', 'star'].includes(currentTool)) {
      saveState(side)
    }

    // Get the actual color to use (might be random or neon)
    let actualColor = brushColor
    if (randomColorMode) {
      actualColor = getRandomColor()
    } else if (neonMode) {
      const neonColors = ['#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00', '#ff6600']
      actualColor = neonColors[Math.floor(Date.now() / 100) % neonColors.length]
    }
    
    // Apply wobble if enabled
    const drawPos = wobblyMode ? applyWobble(x, y) : { x, y }

    ctx.beginPath() // Ensure we start a fresh path for this stroke
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : actualColor
    ctx.lineWidth = brushSize
    ctx.globalAlpha = brushOpacity

    // Apply brush style
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    ctx.lineCap = 'round'
    
    // Apply glow/neon effects
    if (glowMode || neonMode) {
      ctx.shadowBlur = neonMode ? 20 : 15
      ctx.shadowColor = actualColor
    }

    if (brushStyle === 'dotted') {
      ctx.setLineDash([1, 10])
    } else if (brushStyle === 'dashed') {
      ctx.setLineDash([10, 10])
    } else if (brushStyle === 'glow') {
      ctx.setLineDash([])
      ctx.shadowBlur = 10
      ctx.shadowColor = brushColor
    } else if (brushStyle === 'square') {
      ctx.setLineDash([])
      ctx.lineCap = 'square'
    } else {
      ctx.setLineDash([]) // Solid line (default)
    }

    if (['rectangle', 'circle', 'line', 'triangle', 'star'].includes(currentTool)) {
      // Logic moved to startDrawing
    } else if (currentTool === 'spray') {
      saveState(side)
      // Spray paint effect
      const density = Math.floor(brushSize * 2)
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI
        const radius = Math.random() * brushSize
        const sprayX = x + radius * Math.cos(angle)
        const sprayY = y + radius * Math.sin(angle)
        ctx.fillStyle = brushColor
        ctx.globalAlpha = brushOpacity * 0.3
        ctx.fillRect(sprayX, sprayY, 1, 1)
      }
    } else if (currentTool === 'pencil') {
      // Pencil - thin sharp line
      ctx.lineWidth = Math.max(1, brushSize * 0.3)
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 0.1, y + 0.1)
      ctx.stroke()
      
      socket.emit('draw', {
        prevX: x,
        prevY: y,
        offsetX: x,
        offsetY: y,
        brushColor,
        brushSize: Math.max(1, brushSize * 0.3),
        brushStyle,
        brushOpacity,
        erasing: false,
      })
      
      saveState(side)
    } else {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 0.1, y + 0.1)
      ctx.stroke()
      
      socket.emit('draw', {
        prevX: x,
        prevY: y,
        offsetX: x,
        offsetY: y,
        brushColor,
        brushSize,
        brushStyle,
        brushOpacity,
        erasing: currentTool === 'eraser',
      })
      
      saveState(side)
    }
  }

  const draw = (x, y) => {
    if (!isDrawing || !activeSide) return
    const ctx = ctxRef.current
    if (!ctx) return

    // Constrain drawing to the active side
    const canvas = canvasRef.current
    const midPoint = canvas.width / 2
    if (activeSide === 'left' && x > midPoint) {
      x = midPoint
    } else if (activeSide === 'right' && x < midPoint) {
      x = midPoint
    }

    const { brushColor, brushSize, brushStyle, brushOpacity, currentTool, wobblyMode, randomColorMode, mirrorMode, glowMode, scatterMode, neonMode, discoMode, gravityMode, zigzagMode, pixelMode } = getBrushSettingsWrapper(activeSide)

    // Get actual color (might be random, neon, or disco)
    let actualColor = brushColor
    let actualSize = brushSize
    if (randomColorMode) {
      actualColor = getRandomColor()
    } else if (neonMode) {
      // Neon mode - cycle through bright neon colors
      const neonColors = ['#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00', '#ff6600']
      actualColor = neonColors[Math.floor(Date.now() / 100) % neonColors.length]
    } else if (discoMode) {
      // Disco mode - rapid flashing colors with pulsing size
      const discoColors = ['#ff0000', '#ff00ff', '#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff8800']
      actualColor = discoColors[Math.floor(Date.now() / 50) % discoColors.length]
      actualSize = brushSize * (0.5 + Math.abs(Math.sin(Date.now() / 100)) * 1)
    }
    
    // Apply wobble if enabled
    const drawPos = wobblyMode ? applyWobble(x, y) : { x, y }
    const actualX = drawPos.x
    const actualY = drawPos.y

    if (['rectangle', 'circle', 'line', 'triangle', 'star'].includes(currentTool)) {
      // Restore last state to clear previous preview
      // Resolve undoStack based on activeSide
      const currentUndoStack = activeSide === 'left' ? leftUndoStack : rightUndoStack
      
      if (currentUndoStack.length > 0) {
        const xOffset = activeSide === 'left' ? 0 : (canvasRef.current.width / 2)
        ctx.putImageData(currentUndoStack[currentUndoStack.length - 1], xOffset, 0)
      }

      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize
      ctx.globalAlpha = brushOpacity
      
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      ctx.lineCap = 'round'

      if (brushStyle === 'dotted') ctx.setLineDash([1, 10])
      else if (brushStyle === 'dashed') ctx.setLineDash([10, 10])
      else if (brushStyle === 'glow') {
        ctx.setLineDash([])
        ctx.shadowBlur = 10
        ctx.shadowColor = brushColor
      } else if (brushStyle === 'square') {
        ctx.setLineDash([])
        ctx.lineCap = 'square'
      }
      else ctx.setLineDash([])

      if (currentTool === 'rectangle') {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y)
      } else if (currentTool === 'circle') {
        ctx.beginPath()
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (currentTool === 'line') {
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (currentTool === 'triangle') {
        ctx.beginPath()
        const width = x - startPos.x
        const height = y - startPos.y
        ctx.moveTo(startPos.x + width / 2, startPos.y) // Top center
        ctx.lineTo(startPos.x, startPos.y + height) // Bottom left
        ctx.lineTo(x, startPos.y + height) // Bottom right
        ctx.closePath()
        ctx.stroke()
      } else if (currentTool === 'star') {
        ctx.beginPath()
        const outerRadius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        const innerRadius = outerRadius * 0.5
        const spikes = 5
        let rotation = -Math.PI / 2
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = rotation + (i * Math.PI) / spikes
          const px = startPos.x + radius * Math.cos(angle)
          const py = startPos.y + radius * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.closePath()
        ctx.stroke()
      }
    } else if (currentTool === 'spray') {
      // Spray paint effect during drag
      const density = Math.floor(brushSize * 1.5)
      ctx.fillStyle = actualColor
      ctx.globalAlpha = brushOpacity * 0.2
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * 2 * Math.PI
        const radius = Math.random() * brushSize
        const sprayX = actualX + radius * Math.cos(angle)
        const sprayY = actualY + radius * Math.sin(angle)
        ctx.fillRect(sprayX, sprayY, 1, 1)
      }
    } else if (currentTool === 'pencil') {
      const { x: prevX, y: prevY } = lastPos.current || { x: actualX, y: actualY }
      ctx.strokeStyle = actualColor
      ctx.lineWidth = Math.max(1, brushSize * 0.3)
      ctx.lineCap = 'butt'
      
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(actualX, actualY)
      ctx.stroke()

      socket.emit('draw', {
        prevX,
        prevY,
        offsetX: actualX,
        offsetY: actualY,
        brushColor: actualColor,
        brushSize: Math.max(1, brushSize * 0.3),
        brushStyle,
        brushOpacity,
        erasing: false,
      })
      
      lastPos.current = { x: actualX, y: actualY }
    } else if (currentTool === 'calligraphy') {
      // Calligraphy brush - varies width based on movement direction
      const { x: prevX, y: prevY } = lastPos.current || { x: actualX, y: actualY }
      const dx = actualX - prevX
      const dy = actualY - prevY
      const angle = Math.atan2(dy, dx)
      
      // Width varies based on angle - thinner on horizontal, thicker on vertical
      const widthFactor = Math.abs(Math.sin(angle))
      const dynamicWidth = brushSize * (0.3 + widthFactor * 0.7)
      
      ctx.strokeStyle = actualColor
      ctx.lineWidth = dynamicWidth
      ctx.lineCap = 'round'
      
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(actualX, actualY)
      ctx.stroke()

      socket.emit('draw', {
        prevX,
        prevY,
        offsetX: actualX,
        offsetY: actualY,
        brushColor: actualColor,
        brushSize: dynamicWidth,
        brushStyle,
        brushOpacity,
        erasing: false,
      })
      
      lastPos.current = { x: actualX, y: actualY }
    } else if (currentTool === 'marker') {
      // Marker tool - semi-transparent overlapping strokes
      const { x: prevX, y: prevY } = lastPos.current || { x: actualX, y: actualY }
      
      ctx.strokeStyle = actualColor
      ctx.lineWidth = brushSize * 1.5
      ctx.lineCap = 'square'
      ctx.globalAlpha = brushOpacity * 0.3
      
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(actualX, actualY)
      ctx.stroke()

      socket.emit('draw', {
        prevX,
        prevY,
        offsetX: actualX,
        offsetY: actualY,
        brushColor: actualColor,
        brushSize: brushSize * 1.5,
        brushStyle,
        brushOpacity: brushOpacity * 0.3,
        erasing: false,
      })
      
      lastPos.current = { x: actualX, y: actualY }
    } else {
      const { x: prevX, y: prevY } = lastPos.current || { x: actualX, y: actualY }
      
      // Ensure context settings are correct for manual drawing
      ctx.lineWidth = brushSize
      ctx.globalAlpha = brushOpacity

      // Apply glow effect if enabled (including disco glow)
      if (glowMode || neonMode || discoMode) {
        ctx.shadowBlur = neonMode ? 20 : discoMode ? 25 : 15
        ctx.shadowColor = actualColor
      } else {
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }
      
      // Apply disco size pulsing
      if (discoMode) {
        ctx.lineWidth = actualSize
      }
      
      // Pixel mode - snap to grid and draw squares
      if (pixelMode) {
        const gridSize = Math.max(8, brushSize)
        const snapX = Math.floor(actualX / gridSize) * gridSize
        const snapY = Math.floor(actualY / gridSize) * gridSize
        ctx.fillStyle = currentTool === 'eraser' ? '#ffffff' : actualColor
        ctx.fillRect(snapX, snapY, gridSize, gridSize)
      } 
      // Zigzag mode - create zigzag pattern
      else if (zigzagMode) {
        const zigzagOffset = Math.sin(Date.now() / 30) * brushSize
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : actualColor
        ctx.beginPath()
        ctx.moveTo(prevX + zigzagOffset, prevY)
        ctx.lineTo(actualX - zigzagOffset, actualY)
        ctx.stroke()
      }
      // Normal stroke
      else {
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : actualColor
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(actualX, actualY)
        ctx.stroke()
      }
      
      // Gravity mode - add dripping effect
      if (gravityMode) {
        const dripCount = Math.floor(Math.random() * 3) + 1
        for (let i = 0; i < dripCount; i++) {
          const dripLength = Math.random() * brushSize * 3
          const dripX = actualX + (Math.random() - 0.5) * brushSize
          ctx.strokeStyle = actualColor
          ctx.lineWidth = Math.max(1, brushSize * 0.3)
          ctx.globalAlpha = brushOpacity * 0.5
          ctx.beginPath()
          ctx.moveTo(dripX, actualY)
          ctx.lineTo(dripX + (Math.random() - 0.5) * 2, actualY + dripLength)
          ctx.stroke()
          ctx.globalAlpha = brushOpacity
          ctx.lineWidth = brushSize
        }
      }
      
      // Mirror mode - draw on opposite side too
      if (mirrorMode) {
        const canvas = canvasRef.current
        const midPoint = canvas.width / 2
        // Calculate mirrored X position
        const mirrorX = activeSide === 'left' 
          ? midPoint + (midPoint - actualX) 
          : midPoint - (actualX - midPoint)
        const mirrorPrevX = activeSide === 'left'
          ? midPoint + (midPoint - prevX)
          : midPoint - (prevX - midPoint)
        
        if (pixelMode) {
          const gridSize = Math.max(8, brushSize)
          const snapMirrorX = Math.floor(mirrorX / gridSize) * gridSize
          const snapY = Math.floor(actualY / gridSize) * gridSize
          ctx.fillRect(snapMirrorX, snapY, gridSize, gridSize)
        } else {
          ctx.beginPath()
          ctx.moveTo(mirrorPrevX, prevY)
          ctx.lineTo(mirrorX, actualY)
          ctx.stroke()
        }
      }
      
      // Scatter mode - draw extra dots around the brush
      if (scatterMode) {
        const scatterCount = Math.floor(brushSize / 2) + 3
        for (let i = 0; i < scatterCount; i++) {
          const angle = Math.random() * 2 * Math.PI
          const distance = Math.random() * brushSize * 2
          const scatterX = actualX + distance * Math.cos(angle)
          const scatterY = actualY + distance * Math.sin(angle)
          const dotSize = Math.random() * (brushSize / 3) + 1
          
          ctx.fillStyle = actualColor
          ctx.globalAlpha = brushOpacity * (0.3 + Math.random() * 0.4)
          ctx.beginPath()
          ctx.arc(scatterX, scatterY, dotSize, 0, 2 * Math.PI)
          ctx.fill()
          ctx.globalAlpha = brushOpacity
        }
      }
      
      // Reset shadow after drawing
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      socket.emit('draw', {
        prevX,
        prevY,
        offsetX: actualX,
        offsetY: actualY,
        brushColor: actualColor,
        brushSize: actualSize,
        brushStyle,
        brushOpacity,
        erasing: currentTool === 'eraser',
        mirrorMode,
        glowMode,
        scatterMode,
        neonMode,
        discoMode,
        gravityMode,
        zigzagMode,
        pixelMode,
      })
      
      lastPos.current = { x: actualX, y: actualY }
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    setIsDrawing(false)
    setActiveSide(null)
    const ctx = ctxRef.current
    if (!ctx) return

    const { brushColor, brushSize, brushStyle, brushOpacity, currentTool } = activeSide ? getBrushSettingsWrapper(activeSide) : getBrushSettingsWrapper('left')

    // Get final coordinates (for mouse up)
    let endX = 0, endY = 0
    if (e) {
        const point = getCanvasPoint(e)
        endX = point.x
        endY = point.y
    }
    
    if (['rectangle', 'circle', 'line', 'triangle', 'star'].includes(currentTool)) {
      // Emit the shape
      socket.emit('draw', {
        type: currentTool,
        startX: startPos.x,
        startY: startPos.y,
        endX,
        endY,
        brushColor,
        brushSize,
        brushStyle,
        brushOpacity,
      })
      
      // State saved in startDrawing
    }
    
    ctx.beginPath()
  }

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
    } else {
        clientX = e.clientX
        clientY = e.clientY
    }
    
    // Scale correction
    return {
        x: (clientX - rect.left),
        y: (clientY - rect.top)
    }
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const { x, y } = getCanvasPoint(e)
    startDrawing(x, y)
  }

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasPoint(e)
    draw(x, y)
  }

  const handleTouchStart = (e) => {
    // Gestures are handled by the container/hook, but drawing needs 1 finger
    if (e.touches.length !== 1) return
    e.preventDefault()
    const { x, y } = getCanvasPoint(e)
    startDrawing(x, y)
  }

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return
    e.preventDefault()
    const { x, y } = getCanvasPoint(e)
    draw(x, y)
  }

  // Flood fill algorithm for the bucket tool - constrained to one side
  const fillBucket = (x, y, color, side) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    saveState(side) // Save state before fill

    const midPoint = canvas.width / 2
    const minX = side === 'left' ? 0 : midPoint
    const maxX = side === 'left' ? midPoint : canvas.width

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const targetColor = getColorAtPoint(x, y)
    const targetR = targetColor.r
    const targetG = targetColor.g
    const targetB = targetColor.b
    const targetA = targetColor.a

    const fillColor = hexToRgb(color)

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()

      // Constrain to the side
      if (cx < minX || cx >= maxX) continue

      const pixelIndex = (cy * canvas.width + cx) * 4
      if (pixels[pixelIndex] === targetR && pixels[pixelIndex + 1] === targetG &&
        pixels[pixelIndex + 2] === targetB && pixels[pixelIndex + 3] === targetA) {

        // Fill this pixel
        pixels[pixelIndex] = fillColor.r
        pixels[pixelIndex + 1] = fillColor.g
        pixels[pixelIndex + 2] = fillColor.b
        pixels[pixelIndex + 3] = 255

        // Add neighboring pixels to stack (respecting side boundaries)
        if (cx > minX && !visited.has((cy * canvas.width) + (cx - 1))) stack.push([cx - 1, cy])
        if (cx < maxX - 1 && !visited.has((cy * canvas.width) + (cx + 1))) stack.push([cx + 1, cy])
        if (cy > 0 && !visited.has(((cy - 1) * canvas.width) + cx)) stack.push([cx, cy - 1])
        if (cy < canvas.height - 1 && !visited.has(((cy + 1) * canvas.width) + cx)) stack.push([cx, cy + 1])

        visited.add((cy * canvas.width) + cx)
      }
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(imageData, 0, 0)
  }

  // Get color at a point on the canvas
  const getColorAtPoint = (x, y) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const imageData = ctx.getImageData(x, y, 1, 1)
    const data = imageData.data
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    }
  }

  // Undo function - per side
  const undo = (side) => {
    const undoStack = side === 'left' ? leftUndoStack : rightUndoStack
    const setUndoStack = side === 'left' ? setLeftUndoStack : setRightUndoStack
    const setRedoStack = side === 'left' ? setLeftRedoStack : setRightRedoStack
    
    if (undoStack.length === 0) return
    const previousState = undoStack[undoStack.length - 1]
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    const midPoint = canvas.width / 2
    const xOffset = side === 'left' ? 0 : midPoint
    ctx.putImageData(previousState, xOffset, 0)
    
    setRedoStack((prev) => [previousState, ...prev])
    setUndoStack((prev) => prev.slice(0, -1))
  }

  // Redo function - per side
  const redo = (side) => {
    const redoStack = side === 'left' ? leftRedoStack : rightRedoStack
    const setUndoStack = side === 'left' ? setLeftUndoStack : setRightUndoStack
    const setRedoStack = side === 'left' ? setLeftRedoStack : setRightRedoStack
    
    if (redoStack.length === 0) return
    const nextState = redoStack[0]
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    const midPoint = canvas.width / 2
    const xOffset = side === 'left' ? 0 : midPoint
    ctx.putImageData(nextState, xOffset, 0)
    
    setUndoStack((prev) => [...prev, nextState])
    setRedoStack((prev) => prev.slice(1))
  }

  // Clear one side of the canvas
  const clearSide = (side) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    saveState(side) // Save state before clearing
    
    const midPoint = canvas.width / 2
    if (side === 'left') {
      ctx.clearRect(0, 0, midPoint, canvas.height)
    } else {
      ctx.clearRect(midPoint, 0, midPoint, canvas.height)
    }
  }

  // Save one side of the canvas as an image
  const saveImage = (side) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const midPoint = canvas.width / 2
    
    // Create a temporary canvas to hold just the specified side
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = midPoint
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    // Fill with white background first
    tempCtx.fillStyle = '#ffffff'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Copy the appropriate side
    if (side === 'left') {
      tempCtx.drawImage(canvas, 0, 0, midPoint, canvas.height, 0, 0, midPoint, canvas.height)
    } else {
      tempCtx.drawImage(canvas, midPoint, 0, midPoint, canvas.height, 0, 0, midPoint, canvas.height)
    }
    
    // Create download link
    const link = document.createElement('a')
    const playerName = side === 'left' ? 'Player1' : 'Player2'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    link.download = `PaintAndChat_${playerName}_${timestamp}.png`
    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }

  // Save the full canvas as an image
  const saveFullImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    // Fill with white background first
    tempCtx.fillStyle = '#ffffff'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Copy the full canvas
    tempCtx.drawImage(canvas, 0, 0)
    
    // Create download link
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    link.download = `PaintAndChat_FullCanvas_${timestamp}.png`
    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }

  useImperativeHandle(ref, () => ({
    undo,
    redo,
    clearSide,
    saveImage,
    saveFullImage,
    getShipImage: (side) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const ctx = canvas.getContext('2d')
      
      const midPoint = canvas.width / 2
      const x = side === 'left' ? 0 : midPoint
      const width = midPoint
      const height = canvas.height
      
      const imageData = ctx.getImageData(x, 0, width, height)
      const data = imageData.data
      
      // Find bounding box
      let minX = width, minY = height, maxX = 0, maxY = 0
      let hasPixels = false
      
      for(let i=0; i<data.length; i+=4) {
        if (data[i+3] > 0 && !(data[i] === 255 && data[i+1] === 255 && data[i+2] === 255)) { // ignore transparent or pure white
           const idx = i / 4
           const px = idx % width
           const py = Math.floor(idx / width)
           
           if(px < minX) minX = px
           if(px > maxX) maxX = px
           if(py < minY) minY = py
           if(py > maxY) maxY = py
           hasPixels = true
        }
      }
      
      if (!hasPixels) return null // Return empty if nothing drawn
      
      // Add padding
      const padding = 5
      minX = Math.max(0, minX - padding)
      minY = Math.max(0, minY - padding)
      maxX = Math.min(width, maxX + padding)
      maxY = Math.min(height, maxY + padding)
      
      const cropWidth = maxX - minX
      const cropHeight = maxY - minY
      
      if(cropWidth <= 0 || cropHeight <= 0) return null
      
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 40 // Normalize size for game
      tempCanvas.height = 40
      const tempCtx = tempCanvas.getContext('2d')
      
      // Draw cropped region to temp canvas scaled
      tempCtx.drawImage(canvas, x + minX, minY, cropWidth, cropHeight, 0, 0, 40, 40)
      
      return tempCanvas.toDataURL()
    }
  }))

  return (
    <div 
      className="absolute inset-0 select-none" 
      style={{ 
        touchAction: 'none', 
        overscrollBehavior: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ cursor: 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
          role="application"
          aria-label="Drawing canvas - Left side for Player 1, Right side for Player 2"
          style={{
            touchAction: 'none',
            WebkitTouchCallout: 'none'
          }}
        />
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
