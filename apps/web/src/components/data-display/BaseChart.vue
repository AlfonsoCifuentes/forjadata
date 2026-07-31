<script setup lang="ts">
import { BarChart, LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  option: EChartsCoreOption
  label: string
}>()

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  AriaComponent,
  CanvasRenderer,
])

const element = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null

onMounted(() => {
  if (!element.value) return
  chart = echarts.init(element.value, undefined, { renderer: 'canvas' })
  chart.setOption(props.option)
  resizeObserver = new ResizeObserver(() => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null
      chart?.resize({ silent: true })
    })
  })
  resizeObserver.observe(element.value)
})

watch(
  () => props.option,
  (option) => chart?.setOption(option, { notMerge: true }),
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  chart?.dispose()
})
</script>

<template>
  <div ref="element" class="chart" role="img" :aria-label="label"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  min-height: 18rem;
}
</style>
