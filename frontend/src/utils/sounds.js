// Sound utility for playing audio feedback
// Place your sound files in the /public/sounds/ directory
// Recommended formats: .mp3, .wav, .ogg

class SoundManager {
  constructor() {
    this.sounds = {}
    this.music = null // For background music/OST
    this.enabled = true
    this.volume = 0.7
    this.musicVolume = 0.5 // Lower volume for background music
  }

  // Load a sound file
  load(name, path) {
    if (this.sounds[name]) return
    const audio = new Audio(path)
    audio.volume = this.volume
    this.sounds[name] = audio
  }

  // Load background music (OST)
  loadMusic(path) {
    if (this.music) {
      this.stopMusic()
    }
    const audio = new Audio(path)
    audio.volume = this.musicVolume
    audio.loop = true
    this.music = audio
  }

  // Play a sound
  play(name) {
    if (!this.enabled) return
    
    const sound = this.sounds[name]
    if (!sound) {
      console.warn(`Sound "${name}" not loaded`)
      return
    }

    // Clone and play to allow overlapping sounds
    const clone = sound.cloneNode()
    clone.volume = this.volume
    clone.play().catch(err => {
      // Handle autoplay restrictions
      console.warn('Could not play sound:', err)
    })
  }

  // Play background music
  playMusic() {
    if (!this.enabled || !this.music) return
    this.music.play().catch(err => {
      console.warn('Could not play music:', err)
    })
  }

  // Stop background music
  stopMusic() {
    if (this.music) {
      this.music.pause()
      this.music.currentTime = 0
    }
  }

  // Set volume (0.0 to 1.0)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume
    })
  }

  // Set music volume
  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol))
    if (this.music) {
      this.music.volume = this.musicVolume
    }
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled && this.music) {
      this.stopMusic()
    }
  }
}

// Create singleton instance
const soundManager = new SoundManager()

// Initialize all sound files
soundManager.load('right_answer', '/sounds/right_answer.wav')
soundManager.load('wrong_answer', '/sounds/wrong_answer.wav')
soundManager.load('win', '/sounds/win_sound_alt.wav')
soundManager.load('lose', '/sounds/lose_sound.wav')
soundManager.loadMusic('/sounds/quiz_ost.wav')

// Also support old names for backward compatibility
soundManager.load('correct', '/sounds/right_answer.wav')
soundManager.load('incorrect', '/sounds/wrong_answer.wav')

export default soundManager

