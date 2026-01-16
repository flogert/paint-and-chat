import { useState, useRef, useEffect } from 'react'

export const useGestures = (canvasRef) => {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const lastTouchRef = useRef(null)
  const lastDistRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomSensitivity = 0.001
        const zoomDelta = -e.deltaY * zoomSensitivity
        const newScale = Math.min(Math.max(0.5, scale + zoomDelta), 4)
        
        // Calculate zoom focus (mouse position)
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        // Adjust offset to keep mouse point stable
        const scaleRatio = newScale / scale
        const newOffset = {
            x: mouseX - (mouseX - offset.x) * scaleRatio,
            y: mouseY - (mouseY - offset.y) * scaleRatio
        }
        
        setScale(newScale)
        setOffset(newOffset)
      } else {
        // Pan
        setOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }))
      }
    }

    // Basic touch gesture support
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            lastDistRef.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            lastTouchRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            }
        }
    }

    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            
            const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            }

            if (lastDistRef.current && lastTouchRef.current) {
                // Zoom
                const zoomFactor = dist / lastDistRef.current
                const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 4)
                
                // Pan
                const dx = center.x - lastTouchRef.current.x
                const dy = center.y - lastTouchRef.current.y
                
                // Adjust for zoom center
                const rect = canvas.getBoundingClientRect()
                const localX = center.x - rect.left
                const localY = center.y - rect.top
                
                // Simplified zoom-towards-center logic for stability
                setOffset(prev => ({
                    x: prev.x + dx,
                    y: prev.y + dy
                }))
                setScale(newScale)
            }
            
            lastDistRef.current = dist
            lastTouchRef.current = center
        }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
    }
  }, [canvasRef, scale, offset])

  return { scale, offset }
}
