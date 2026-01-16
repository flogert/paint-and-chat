'use client'

// GIF Recording utility - records canvas frames and exports as animated GIF
// Uses browser's native canvas and creates an animated GIF using a simple encoder

class GifRecorder {
  constructor() {
    this.frames = []
    this.isRecording = false
    this.frameInterval = null
    this.startTime = null
  }

  // Start recording frames from a canvas
  startRecording(canvas, fps = 10) {
    if (this.isRecording) return
    
    this.frames = []
    this.isRecording = true
    this.startTime = Date.now()
    
    const captureFrame = () => {
      if (!this.isRecording) return
      
      // Capture current canvas state
      const frame = {
        dataUrl: canvas.toDataURL('image/png'),
        timestamp: Date.now() - this.startTime
      }
      this.frames.push(frame)
    }
    
    // Capture initial frame
    captureFrame()
    
    // Capture frames at specified FPS
    this.frameInterval = setInterval(captureFrame, 1000 / fps)
    
    return true
  }

  // Stop recording
  stopRecording() {
    if (!this.isRecording) return null
    
    this.isRecording = false
    if (this.frameInterval) {
      clearInterval(this.frameInterval)
      this.frameInterval = null
    }
    
    return this.frames.length
  }

  // Get recording duration
  getDuration() {
    if (this.frames.length === 0) return 0
    return this.frames[this.frames.length - 1].timestamp
  }

  // Get frame count
  getFrameCount() {
    return this.frames.length
  }

  // Export as animated GIF using canvas manipulation
  // Note: This creates a simple "flipbook" GIF
  async exportAsGif(filename = 'drawing-timelapse.gif') {
    if (this.frames.length === 0) {
      console.warn('No frames to export')
      return null
    }

    // For a proper GIF, we'd need a library like gif.js
    // This is a simplified version that exports as WebM video instead
    // which has better browser support for recording
    
    // Alternative: Export as a series of PNGs in a zip, or as WebM
    return this.exportAsWebM(filename.replace('.gif', '.webm'))
  }

  // Export as WebM video (better browser support)
  async exportAsWebM(filename = 'drawing-timelapse.webm') {
    if (this.frames.length < 2) {
      console.warn('Need at least 2 frames to create video')
      return null
    }

    try {
      // Create a temporary canvas for the video
      const firstFrame = await this.loadImage(this.frames[0].dataUrl)
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = firstFrame.width
      tempCanvas.height = firstFrame.height
      const ctx = tempCanvas.getContext('2d')

      // Use MediaRecorder if available
      if (typeof MediaRecorder !== 'undefined') {
        const stream = tempCanvas.captureStream(30)
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
        const chunks = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }

        return new Promise((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.click()
            URL.revokeObjectURL(url)
            resolve(true)
          }

          recorder.start()

          // Play through all frames
          let frameIndex = 0
          const playNextFrame = async () => {
            if (frameIndex >= this.frames.length) {
              recorder.stop()
              return
            }

            const img = await this.loadImage(this.frames[frameIndex].dataUrl)
            ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
            ctx.drawImage(img, 0, 0)
            frameIndex++

            // Calculate delay to next frame
            const delay = frameIndex < this.frames.length 
              ? (this.frames[frameIndex].timestamp - this.frames[frameIndex - 1].timestamp)
              : 100

            setTimeout(playNextFrame, Math.max(delay, 50))
          }

          playNextFrame()
        })
      } else {
        // Fallback: just download the last frame
        const link = document.createElement('a')
        link.href = this.frames[this.frames.length - 1].dataUrl
        link.download = filename.replace('.webm', '.png')
        link.click()
        return true
      }
    } catch (error) {
      console.error('Error exporting video:', error)
      return null
    }
  }

  // Export frames as downloadable PNG sequence (zip would require a library)
  async exportFramesPNG() {
    if (this.frames.length === 0) return null

    // Just download the last frame for simplicity
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    link.href = this.frames[this.frames.length - 1].dataUrl
    link.download = `drawing_final_${timestamp}.png`
    link.click()
    return true
  }

  // Load image from data URL
  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUrl
    })
  }

  // Clear recorded frames
  clear() {
    this.frames = []
    this.isRecording = false
    if (this.frameInterval) {
      clearInterval(this.frameInterval)
      this.frameInterval = null
    }
  }
}

// Singleton instance
const gifRecorder = new GifRecorder()
export default gifRecorder
