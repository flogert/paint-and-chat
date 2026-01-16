'use client'

// Sound effects utility using Web Audio API
class SoundManager {
  constructor() {
    this.audioContext = null
    this.enabled = true
    this.volume = 0.05
  }

  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  // Create oscillator-based sound
  playTone(frequency, duration, type = 'sine', fadeOut = true) {
    if (!this.enabled) return
    this.init()
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    
    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    }

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Brush stroke sound - soft whoosh
  brushStroke() {
    if (!this.enabled) return
    this.init()
    if (!this.audioContext) return

    const noise = this.createNoise(0.05)
    const filter = this.audioContext.createBiquadFilter()
    const gainNode = this.audioContext.createGain()

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime)

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05)
  }

  // Create white noise source
  createNoise(duration) {
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    noise.start()
    return noise
  }

  // Undo sound - descending tone
  undo() {
    this.playTone(600, 0.1, 'sine')
    setTimeout(() => this.playTone(400, 0.1, 'sine'), 50)
  }

  // Redo sound - ascending tone
  redo() {
    this.playTone(400, 0.1, 'sine')
    setTimeout(() => this.playTone(600, 0.1, 'sine'), 50)
  }

  // Clear canvas sound - whoosh down
  clear() {
    this.playTone(800, 0.15, 'sawtooth')
    setTimeout(() => this.playTone(400, 0.15, 'sawtooth'), 50)
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth'), 100)
  }

  // New prompt sound - cheerful ding
  newPrompt() {
    this.playTone(523, 0.1, 'sine') // C5
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 80) // E5
    setTimeout(() => this.playTone(784, 0.15, 'sine'), 160) // G5
  }

  // Timer tick sound
  tick() {
    // this.playTone(1000, 0.02, 'square')
  }

  // Timer warning (last 10 seconds)
  tickWarning() {
    // this.playTone(880, 0.05, 'square')
  }

  // Timer end sound - game over feel
  timerEnd() {
    this.playTone(440, 0.2, 'sawtooth')
    setTimeout(() => this.playTone(330, 0.2, 'sawtooth'), 150)
    setTimeout(() => this.playTone(220, 0.3, 'sawtooth'), 300)
  }

  // Success/complete sound
  success() {
    this.playTone(523, 0.1, 'sine')
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 100)
    setTimeout(() => this.playTone(784, 0.1, 'sine'), 200)
    setTimeout(() => this.playTone(1047, 0.2, 'sine'), 300)
  }
  
  // Note: clear() is defined above

  // Tool switch sound
  toolSwitch() {
    this.playTone(800, 0.03, 'sine')
  }

  // Color pick sound
  colorPick() {
    this.playTone(1200, 0.05, 'sine')
  }

  // Save sound
  save() {
    this.playTone(600, 0.1, 'sine')
    setTimeout(() => this.playTone(800, 0.15, 'sine'), 100)
  }

  // Wobbly mode toggle
  wobblyToggle() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(400 + Math.random() * 400, 0.05, 'sine')
      }, i * 50)
    }
  }

  // Random color mode toggle
  randomColorToggle() {
    const notes = [523, 587, 659, 698, 784] // C D E F G
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.08, 'sine'), i * 60)
    })
  }

  // Boss mode activate - typewriter sound
  bossMode() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playTone(200 + Math.random() * 100, 0.02, 'square')
      }, i * 30)
    }
  }

  // Pop sound for UI interactions
  pop() {
    this.playTone(1400, 0.03, 'sine')
  }

  // Error/invalid action
  error() {
    this.playTone(200, 0.1, 'sawtooth')
    setTimeout(() => this.playTone(150, 0.15, 'sawtooth'), 100)
  }

  // Backwards timer - gain time sound
  gainTime() {
    this.playTone(600, 0.05, 'sine')
    setTimeout(() => this.playTone(900, 0.08, 'sine'), 50)
  }
}

// Singleton instance
const sounds = new SoundManager()
export default sounds
