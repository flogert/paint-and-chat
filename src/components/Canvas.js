'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import socket from '@/lib/socket'

const Canvas = forwardRef(({
  canvasRef,
  brushColor,
  brushSize,
  brushStyle,
  brushOpacity,
  currentTool,
}, ref) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const lastPos = useRef(null)
  const ctxRef = useRef(null)

  const [undoStack, setUndoStack] = useState([])  // History of drawing actions
  const [redoStack, setRedoStack] = useState([])  // Redo stack to store undone actions

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match parent container
    const setCanvasSize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    setCanvasSize()

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx

    const drawRemote = (data) => {
      const { type, startX, startY, endX, endY, offsetX, offsetY, brushColor, brushSize, brushOpacity, brushStyle, erasing, prevX, prevY } = data
      
      ctx.strokeStyle = erasing ? '#ffffff' : brushColor
      ctx.lineWidth = brushSize
      ctx.globalAlpha = brushOpacity

      // Apply brush style
      if (brushStyle === 'dotted') {
        ctx.setLineDash([1, 10])
      } else if (brushStyle === 'dashed') {
        ctx.setLineDash([10, 10])
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

    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setCanvasSize()
      ctx.putImageData(imageData, 0, 0)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      socket.off('draw', drawRemote)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Save current canvas state for undo
  const saveState = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack((prev) => [...prev, imageData])
    setRedoStack([])  // Clear redo stack whenever a new drawing action happens
  }

  const startDrawing = (x, y) => {
    const ctx = ctxRef.current
    if (!ctx) return

    if (currentTool === 'bucket') {
      fillBucket(x, y, brushColor)
      return
    }

    setIsDrawing(true)
    setStartPos({ x, y })
    lastPos.current = { x, y }

    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : brushColor
    ctx.lineWidth = brushSize
    ctx.globalAlpha = brushOpacity

    // Apply brush style
    if (brushStyle === 'dotted') {
      ctx.setLineDash([1, 10])
    } else if (brushStyle === 'dashed') {
      ctx.setLineDash([10, 10])
    } else {
      ctx.setLineDash([]) // Solid line (default)
    }

    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
      saveState() // Save state BEFORE drawing shape for preview cleanup
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
      
      saveState()
    }
  }

  const draw = (x, y) => {
    if (!isDrawing) return
    const ctx = ctxRef.current
    if (!ctx) return

    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
      // Restore last state to clear previous preview
      if (undoStack.length > 0) {
        ctx.putImageData(undoStack[undoStack.length - 1], 0, 0)
      }

      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize
      ctx.globalAlpha = brushOpacity
      
      if (brushStyle === 'dotted') ctx.setLineDash([1, 10])
      else if (brushStyle === 'dashed') ctx.setLineDash([10, 10])
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
      }
    } else {
      const { x: prevX, y: prevY } = lastPos.current || { x, y }
      
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(x, y)
      ctx.stroke()

      socket.emit('draw', {
        prevX,
        prevY,
        offsetX: x,
        offsetY: y,
        brushColor,
        brushSize,
        brushStyle,
        brushOpacity,
        erasing: currentTool === 'eraser',
      })
      
      lastPos.current = { x, y }
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    setIsDrawing(false)
    const ctx = ctxRef.current
    if (!ctx) return

    // Get final coordinates (for mouse up)
    // Note: e might be undefined if called from mouseLeave, so use last known position if needed, 
    // but for shapes we need the final point. 
    // If e is present, use it.
    let endX = 0, endY = 0
    if (e && e.clientX !== undefined) {
      const rect = canvasRef.current.getBoundingClientRect()
      endX = e.clientX - rect.left
      endY = e.clientY - rect.top
    } else if (e && e.changedTouches && e.changedTouches[0]) {
       const rect = canvasRef.current.getBoundingClientRect()
       endX = e.changedTouches[0].clientX - rect.left
       endY = e.changedTouches[0].clientY - rect.top
    }

    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
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
      
      // We need to save the state with the final shape drawn
      // The shape is already drawn by the last 'draw' call (mousemove), 
      // but we need to make sure it's persisted in undoStack
      // Actually, 'draw' restores undoStack and draws. 
      // So the canvas currently shows the shape.
      // We just need to push this new state to undoStack.
      
      // Wait, if we just finished drawing, the canvas has the shape.
      // But we popped the undoStack in 'draw'? No, we read from it.
      // So we just need to save the current state as a NEW undo state.
      
      // However, since we didn't modify undoStack in 'draw' (we just read),
      // we can just saveState() now.
      
      // BUT, if we moved the mouse, 'draw' was called.
      // If we just clicked and released without moving, 'draw' wasn't called.
      // We should handle that case or just assume user moved.
      
      // Let's just saveState() to commit the shape.
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      setUndoStack((prev) => [...prev, imageData])
      setRedoStack([])
    }
    
    ctx.beginPath()
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    startDrawing(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    draw(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    draw(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  // Flood fill algorithm for the bucket tool
  const fillBucket = (x, y, color) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const targetColor = getColorAtPoint(x, y) // Get the color at the clicked point
    const targetR = targetColor.r
    const targetG = targetColor.g
    const targetB = targetColor.b
    const targetA = targetColor.a

    const fillColor = hexToRgb(color) // Convert color to RGB

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()

      const pixelIndex = (cy * canvas.width + cx) * 4
      if (pixels[pixelIndex] === targetR && pixels[pixelIndex + 1] === targetG &&
        pixels[pixelIndex + 2] === targetB && pixels[pixelIndex + 3] === targetA) {

        // Fill this pixel
        pixels[pixelIndex] = fillColor.r
        pixels[pixelIndex + 1] = fillColor.g
        pixels[pixelIndex + 2] = fillColor.b
        pixels[pixelIndex + 3] = 255

        // Add neighboring pixels to stack
        if (cx > 0 && !visited.has((cy * canvas.width) + (cx - 1))) stack.push([cx - 1, cy])
        if (cx < canvas.width - 1 && !visited.has((cy * canvas.width) + (cx + 1))) stack.push([cx + 1, cy])
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

  // Convert hex color to RGB
  const hexToRgb = (hex) => {
    let r = 0, g = 0, b = 0
    if (hex.length === 4) { // #RGB
      r = parseInt(hex[1] + hex[1], 16)
      g = parseInt(hex[2] + hex[2], 16)
      b = parseInt(hex[3] + hex[3], 16)
    } else if (hex.length === 7) { // #RRGGBB
      r = parseInt(hex[1] + hex[2], 16)
      g = parseInt(hex[3] + hex[4], 16)
      b = parseInt(hex[5] + hex[6], 16)
    }
    return { r, g, b }
  }

  // Undo function
  const undo = () => {
    if (undoStack.length === 0) return
    const previousState = undoStack[undoStack.length - 1]
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.putImageData(previousState, 0, 0)
    setRedoStack((prev) => [previousState, ...prev])
    setUndoStack((prev) => prev.slice(0, -1))  // Remove the last state after undo
  }

  // Redo function
  const redo = () => {
    if (redoStack.length === 0) return
    const nextState = redoStack[0]
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.putImageData(nextState, 0, 0)
    setUndoStack((prev) => [...prev, nextState])
    setRedoStack((prev) => prev.slice(1))  // Remove the first state after redo
  }

  useImperativeHandle(ref, () => ({
    undo,
    redo
  }))

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
        role="application"
        aria-label="Drawing canvas"
        style={{
          cursor: currentTool === 'bucket' ? 'url(/fill.png), auto' : 'crosshair', // Change cursor style for bucket fill tool
        }}
      />
    </>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
