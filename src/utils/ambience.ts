/**
 * Optional ambience: procedural rain (filtered noise) + crickets (pulsed oscillators).
 * Nothing is created until the user switches sound on (browser autoplay rules).
 */
let ctx: AudioContext | null = null
let rainGain: GainNode | null = null
let cricketGain: GainNode | null = null
let master: GainNode | null = null

function start() {
  if (ctx) return
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // rain: looping white noise -> band-pass
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  noise.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 3200
  bp.Q.value = 0.35
  rainGain = ctx.createGain()
  rainGain.gain.value = 0
  noise.connect(bp).connect(rainGain).connect(master)
  noise.start()

  // crickets: 2 high sines gated by a fast LFO
  cricketGain = ctx.createGain()
  cricketGain.gain.value = 0
  cricketGain.connect(master)
  ;[4300, 5100].forEach((f, i) => {
    const osc = ctx!.createOscillator()
    osc.frequency.value = f
    const gate = ctx!.createGain()
    gate.gain.value = 0
    const lfo = ctx!.createOscillator()
    lfo.frequency.value = 11 + i * 2.5
    const lfoGain = ctx!.createGain()
    lfoGain.gain.value = 0.5
    const bias = ctx!.createConstantSource()
    bias.offset.value = 0.5
    lfo.connect(lfoGain).connect(gate.gain)
    bias.connect(gate.gain)
    osc.connect(gate).connect(cricketGain!)
    osc.start(); lfo.start(); bias.start()
  })
}

export function setAmbience(on: boolean, rain: number, night: number) {
  if (on) start()
  if (!ctx || !master || !rainGain || !cricketGain) return
  if (on && ctx.state === 'suspended') void ctx.resume()
  const t = ctx.currentTime
  master.gain.setTargetAtTime(on ? 0.5 : 0, t, 0.3)
  rainGain.gain.setTargetAtTime(0.35 * rain, t, 0.4)
  cricketGain.gain.setTargetAtTime(0.012 * night * (1 - rain * 0.85), t, 0.6)
}
