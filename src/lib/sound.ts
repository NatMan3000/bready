// Tiny WebAudio synth cues - no audio assets, quiet enough for a kitchen.

const MUTE_KEY = 'bready:muted'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    if (!('AudioContext' in window)) return null
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // storage unavailable - mute just won't persist
  }
}

function note(freq: number, at: number, duration: number, gain = 0.12, type: OscillatorType = 'sine') {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + at
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Soft pop - step checked off */
export function playPop() {
  if (isMuted()) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(520, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.09)
  g.gain.setValueAtTime(0.14, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.1)
  osc.connect(g).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.12)
}

/** Two-note bell - a step timer finished */
export function playChime() {
  if (isMuted()) return
  note(880, 0, 0.7, 0.12)
  note(1174.66, 0.18, 0.9, 0.1)
}

/** Short rising fanfare - the whole bake is done */
export function playFanfare() {
  if (isMuted()) return
  const seq = [523.25, 659.25, 783.99, 1046.5]
  seq.forEach((f, i) => note(f, i * 0.13, 0.5, 0.11, 'triangle'))
  note(1318.51, 0.55, 0.9, 0.08)
}

/** Soft low wobble - hands squishing into the dough. Throttle callers to ~1 per 150ms. */
export function playSquish() {
  if (isMuted()) return
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  // A little pitch dive gives it the wet, yielding feel of dough folding over.
  osc.frequency.setValueAtTime(160 + Math.random() * 30, t0)
  osc.frequency.exponentialRampToValueAtTime(68, t0 + 0.13)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.1, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + 0.17)
}

/** Single bright note - the loaf just hit perfect */
export function playDing() {
  if (isMuted()) return
  note(1318.51, 0, 0.6, 0.1)
  note(1975.53, 0.01, 0.35, 0.04)
}
