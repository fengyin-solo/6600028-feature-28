<script setup lang="ts">
import { useFluidStore } from '../store/fluid'
import { PRESETS } from '../utils/sph-engine'
import type { Preset } from '../types'

const store = useFluidStore()

function selectPreset(preset: Preset) {
  store.initSimulation(preset)
}

function toggleRun() {
  if (store.isRunning) {
    store.stop()
  } else {
    store.start()
  }
}

function reset() {
  store.reset()
}

function stepOnce() {
  store.stepOnce()
}

function onGravity(e: Event) {
  store.updateParam('gravity', parseFloat((e.target as HTMLInputElement).value))
}
function onViscosity(e: Event) {
  store.updateParam('viscosity', parseFloat((e.target as HTMLInputElement).value))
}
function onSmoothingRadius(e: Event) {
  store.updateParam('smoothingRadius', parseFloat((e.target as HTMLInputElement).value))
}
function onParticleCount(e: Event) {
  store.particleCount = parseInt((e.target as HTMLInputElement).value)
}
function onDt(e: Event) {
  store.updateParam('dt', parseFloat((e.target as HTMLInputElement).value))
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  const remainSec = sec - min * 60
  return `${min}m ${remainSec.toFixed(0)}s`
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<template>
  <div class="w-72 bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col gap-4 overflow-auto h-full">
    <!-- Presets -->
    <div>
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">预设场景</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="preset in PRESETS"
          :key="preset.name"
          @click="selectPreset(preset)"
          class="text-xs px-2 py-2 rounded transition text-left"
          :class="store.currentPreset.name === preset.name
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          {{ preset.label }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ store.currentPreset.description }}</p>
    </div>

    <!-- Controls -->
    <div class="flex gap-2">
      <button
        @click="toggleRun"
        class="flex-1 py-2 rounded text-sm font-medium transition"
        :class="store.isRunning
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'"
      >
        {{ store.isRunning ? '暂停' : '开始' }}
      </button>
      <button
        @click="reset"
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded text-sm transition"
      >
        重置
      </button>
      <button
        @click="stepOnce"
        :disabled="store.isRunning"
        class="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 py-2 rounded text-sm transition"
      >
        单步
      </button>
    </div>

    <!-- Parameters -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">模拟参数</h3>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>重力</span>
          <span class="text-gray-300">{{ store.params.gravity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="20" step="0.1"
          :value="store.params.gravity"
          @input="onGravity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粘性</span>
          <span class="text-gray-300">{{ store.params.viscosity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="5" step="0.1"
          :value="store.params.viscosity"
          @input="onViscosity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>光滑半径</span>
          <span class="text-gray-300">{{ store.params.smoothingRadius.toFixed(0) }}</span>
        </label>
        <input
          type="range" min="10" max="50" step="1"
          :value="store.params.smoothingRadius"
          @input="onSmoothingRadius"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粒子数量</span>
          <span class="text-gray-300">{{ store.particleCount }}</span>
        </label>
        <input
          type="range" min="200" max="2000" step="50"
          :value="store.particleCount"
          @input="onParticleCount"
          class="w-full accent-blue-500 h-1.5"
        />
        <p class="text-xs text-gray-600 mt-0.5">重置后生效</p>
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>时间步长</span>
          <span class="text-gray-300">{{ store.params.dt.toFixed(4) }}</span>
        </label>
        <input
          type="range" min="0.001" max="0.02" step="0.001"
          :value="store.params.dt"
          @input="onDt"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>
    </div>

    <!-- Stats -->
    <div>
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">运行状态</h3>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">FPS</span>
          <p class="text-green-400 font-mono text-sm">{{ store.fps }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">粒子数</span>
          <p class="text-blue-400 font-mono text-sm">{{ store.particleArray.length }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">平均密度</span>
          <p class="text-yellow-400 font-mono text-sm">{{ store.avgDensity.toFixed(0) }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">最大速度</span>
          <p class="text-red-400 font-mono text-sm">{{ store.maxVelocity.toFixed(1) }}</p>
        </div>
      </div>
    </div>

    <!-- Last Run Summary -->
    <div class="mt-auto pt-3 border-t border-gray-700">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
        <span>最近一次运行摘要</span>
        <span v-if="store.lastRunSummary" class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
      </h3>
      <div v-if="store.lastRunSummary" class="space-y-2 text-xs">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">预设场景</span>
          <span class="text-purple-400 font-medium">{{ store.lastRunSummary.presetLabel }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">保存时间</span>
          <span class="text-gray-300 font-mono">{{ formatTime(store.lastRunSummary.savedAt) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">运行时长</span>
          <span class="text-gray-300 font-mono">{{ formatDuration(store.lastRunSummary.durationMs) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">帧数</span>
          <span class="text-gray-300 font-mono">{{ store.lastRunSummary.frameCount }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">平均 FPS</span>
          <span class="text-green-400 font-mono">{{ store.lastRunSummary.avgFps }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-gray-700">
          <div class="bg-gray-900 rounded px-2 py-1.5">
            <span class="text-gray-500">终止密度</span>
            <p class="text-yellow-400 font-mono text-sm">{{ store.lastRunSummary.finalAvgDensity.toFixed(0) }}</p>
          </div>
          <div class="bg-gray-900 rounded px-2 py-1.5">
            <span class="text-gray-500">终止速度</span>
            <p class="text-red-400 font-mono text-sm">{{ store.lastRunSummary.finalMaxVelocity.toFixed(1) }}</p>
          </div>
          <div class="bg-gray-900 rounded px-2 py-1.5 col-span-2">
            <span class="text-gray-500">峰值速度</span>
            <p class="text-orange-400 font-mono text-sm">{{ store.lastRunSummary.peakMaxVelocity.toFixed(1) }}</p>
          </div>
        </div>
        <details class="cursor-pointer">
          <summary class="text-gray-500 hover:text-gray-300 transition select-none">参数快照</summary>
          <div class="mt-2 space-y-1 bg-gray-900 rounded p-2 font-mono">
            <div class="flex justify-between"><span class="text-gray-500">gravity</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.gravity.toFixed(1) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">viscosity</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.viscosity.toFixed(1) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">smoothing</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.smoothingRadius.toFixed(0) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">dt</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.dt.toFixed(4) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">restDensity</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.restDensity }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">gasConst</span><span class="text-gray-300">{{ store.lastRunSummary.paramsSnapshot.gasConstant }}</span></div>
          </div>
        </details>
      </div>
      <div v-else class="text-xs text-gray-600 italic py-4 text-center">
        暂无运行记录<br>
        <span class="text-gray-700">开始→停止或重置后将保存摘要</span>
      </div>
    </div>
  </div>
</template>
