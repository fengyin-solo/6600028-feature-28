import { defineStore } from 'pinia'
import { SPHEngine, DEFAULT_PARAMS, PRESETS } from '../utils/sph-engine'
import type { SimParams, Preset, Particle, RunSummary } from '../types'

const SUMMARY_STORAGE_KEY = 'sph_last_run_summary'

export const useFluidStore = defineStore('fluid', {
  state: () => ({
    engine: null as SPHEngine | null,
    isRunning: false,
    particleCount: 800,
    currentPreset: PRESETS[0],
    params: { ...DEFAULT_PARAMS } as SimParams,
    fps: 0,
    frameCount: 0,
    lastRunSummary: null as RunSummary | null,
    _animId: null as number | null,
    _lastTime: 0,
    _fpsAccum: 0,
    _fpsFrames: 0,
    _runStartTime: 0,
    _runStartFrame: 0,
    _peakMaxVelocity: 0,
    _fpsSamples: [] as number[],
  }),
  getters: {
    particleArray: (state) => state.engine?.particles ?? [],
    avgDensity: (state) => {
      if (!state.engine || state.engine.particles.length === 0) return 0
      const sum = state.engine.particles.reduce((s, p) => s + p.density, 0)
      return sum / state.engine.particles.length
    },
    maxVelocity: (state) => {
      if (!state.engine || state.engine.particles.length === 0) return 0
      return Math.max(...state.engine.particles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy)))
    },
  },
  actions: {
    _loadLastRunSummary() {
      try {
        const raw = localStorage.getItem(SUMMARY_STORAGE_KEY)
        if (raw) {
          this.lastRunSummary = JSON.parse(raw) as RunSummary
        }
      } catch (e) {
        this.lastRunSummary = null
      }
    },
    _saveRunSummary() {
      if (!this.engine) return
      const endTime = performance.now()
      const framesRun = this.frameCount - this._runStartFrame
      const durationMs = endTime - this._runStartTime
      const avgFps = durationMs > 0
        ? Math.round(framesRun / (durationMs / 1000))
        : 0

      const summary: RunSummary = {
        presetName: this.currentPreset.name,
        presetLabel: this.currentPreset.label,
        startTime: this._runStartTime,
        endTime,
        durationMs,
        frameCount: framesRun,
        avgFps,
        particleCount: this.particleArray.length,
        finalAvgDensity: this.avgDensity,
        finalMaxVelocity: this.maxVelocity,
        peakMaxVelocity: this._peakMaxVelocity,
        paramsSnapshot: { ...this.params },
        savedAt: Date.now(),
      }
      this.lastRunSummary = summary
      try {
        localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary))
      } catch (e) {
        // ignore storage errors
      }
    },
    _updatePeakVelocity() {
      const cur = this.maxVelocity
      if (cur > this._peakMaxVelocity) {
        this._peakMaxVelocity = cur
      }
    },
    initSimulation(preset?: Preset) {
      this._loadLastRunSummary()
      if (preset) {
        this.currentPreset = preset
        this.params = { ...DEFAULT_PARAMS, ...preset.params }
        this.particleCount = preset.particleCount
      }
      const canvas = { width: 800, height: 500 }
      this.engine = new SPHEngine(this.particleCount, canvas.width, canvas.height, this.params)
      this.engine.initParticles(this.currentPreset.initialConfig, this.particleCount)
      this.frameCount = 0
      this.fps = 0
      this._peakMaxVelocity = 0
      this._fpsSamples = []
    },
    start() {
      if (this.isRunning || !this.engine) return
      this.isRunning = true
      this._lastTime = performance.now()
      this._fpsAccum = 0
      this._fpsFrames = 0
      this._runStartTime = performance.now()
      this._runStartFrame = this.frameCount
      this._peakMaxVelocity = 0
      this._fpsSamples = []
      const loop = (now: number) => {
        if (!this.isRunning || !this.engine) return
        const elapsed = now - this._lastTime
        this._lastTime = now
        this._fpsAccum += elapsed
        this._fpsFrames++
        if (this._fpsAccum >= 500) {
          const instFps = Math.round(this._fpsFrames / (this._fpsAccum / 1000))
          this.fps = instFps
          this._fpsSamples.push(instFps)
          this._fpsAccum = 0
          this._fpsFrames = 0
        }
        // Sub-steps for stability
        const subSteps = 3
        for (let s = 0; s < subSteps; s++) {
          this.engine.step()
        }
        this.frameCount++
        this._updatePeakVelocity()
        this._animId = requestAnimationFrame(loop)
      }
      this._animId = requestAnimationFrame(loop)
    },
    stop() {
      if (!this.isRunning) return
      this.isRunning = false
      if (this._animId !== null) {
        cancelAnimationFrame(this._animId)
        this._animId = null
      }
      const framesRun = this.frameCount - this._runStartFrame
      if (framesRun > 0) {
        this._saveRunSummary()
      }
    },
    reset() {
      if (this.isRunning) {
        this.isRunning = false
        if (this._animId !== null) {
          cancelAnimationFrame(this._animId)
          this._animId = null
        }
        const framesRun = this.frameCount - this._runStartFrame
        if (framesRun > 0) {
          this._saveRunSummary()
        }
      }
      this.initSimulation(this.currentPreset)
    },
    stepOnce() {
      if (!this.engine || this.isRunning) return
      const subSteps = 3
      for (let s = 0; s < subSteps; s++) {
        this.engine.step()
      }
      this.frameCount++
      this._updatePeakVelocity()
    },
    updateParam(key: keyof SimParams, value: number) {
      this.params[key] = value
      if (this.engine) {
        this.engine.params[key] = value
        if (key === 'smoothingRadius') {
          this.engine['cellSize'] = value
        }
      }
    },
  },
})
