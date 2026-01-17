'use client'

// Background music player using royalty-free procedural audio
class MusicPlayer {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.volume = 0.2
    this.enabled = true
    this.currentLoop = null
    this.nodes = []
    this.gainNode = null
  }

  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      // Create master gain node
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
      this.gainNode.connect(this.audioContext.destination)
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) this.stop()
  }

  // Create an oscillator with envelope
  createTone(freq, type = 'sine', duration = 2, delay = 0) {
    if (!this.audioContext || !this.gainNode) return null

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.type = type
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime)

    const startTime = this.audioContext.currentTime + delay
    const attackTime = 0.1
    const releaseTime = 0.5

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.15, startTime + attackTime)
    gain.gain.setValueAtTime(0.15, startTime + duration - releaseTime)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.gainNode)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.1)

    return { osc, gain, filter }
  }

  // Relaxing ambient pad with chord progressions
  playAmbient() {
    if (!this.enabled || this.isPlaying) return
    this.init()
    if (!this.audioContext) return

    // Resume context if suspended (required for mobile)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.isPlaying = true
    this.nodes = []

    // Chord progression: Cmaj7 → Am7 → Fmaj7 → G7
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // C3 E3 G3 B3 (Cmaj7)
      [110.00, 130.81, 164.81, 196.00], // A2 C3 E3 G3 (Am7)  
      [87.31, 110.00, 130.81, 164.81],  // F2 A2 C3 E3 (Fmaj7)
      [98.00, 123.47, 146.83, 174.61],  // G2 B2 D3 F3 (G7)
    ]

    let chordIndex = 0

    const playChord = () => {
      if (!this.isPlaying) return

      const chord = chords[chordIndex]
      
      // Play each note of the chord with slight delays for richness
      chord.forEach((freq, i) => {
        // Pad sound
        this.createTone(freq, 'sine', 3.8, i * 0.05)
        // Add subtle harmonics
        this.createTone(freq * 2, 'sine', 3.5, i * 0.05 + 0.1)
      })

      chordIndex = (chordIndex + 1) % chords.length

      // Schedule next chord (4 second cycle)
      this.currentLoop = setTimeout(playChord, 4000)
    }

    playChord()
  }

  stop() {
    this.isPlaying = false
    if (this.currentLoop) {
      clearTimeout(this.currentLoop)
      this.currentLoop = null
    }
    // Fade out master
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5)
      // Reset after fade
      setTimeout(() => {
        if (this.gainNode && this.audioContext) {
          this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
        }
      }, 600)
    }
    this.nodes = []
  }

  toggle() {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.playAmbient()
    }
    return this.isPlaying
  }
}

const musicPlayer = new MusicPlayer()
export default musicPlayer
