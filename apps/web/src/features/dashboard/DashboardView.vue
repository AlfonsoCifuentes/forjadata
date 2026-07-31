<script setup lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  CopyCheck,
  FilePlus2,
  RefreshCcw,
} from '@lucide/vue'
import type { DashboardSummary, RequestDetail } from '@forjadata/contracts'
import type { EChartsCoreOption } from 'echarts/core'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import BaseChart from '@/components/data-display/BaseChart.vue'
import KpiCard from '@/components/data-display/KpiCard.vue'
import StatusBadge from '@/components/data-display/StatusBadge.vue'
import StatePanel from '@/components/feedback/StatePanel.vue'
import { forjadataApi } from '@/services/forjadata-api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const { t } = useI18n()
const data = ref<DashboardSummary | null>(null)
const recent = ref<RequestDetail[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const trendOption = computed<EChartsCoreOption>(() => ({
  aria: { enabled: true, decal: { show: true } },
  color: ['#f59e0b', '#06b6d4'],
  tooltip: { trigger: 'axis' },
  legend: {
    data: [t('dashboard.created'), t('dashboard.completed')],
    textStyle: { color: '#94a3b8' },
  },
  grid: { top: 50, right: 18, bottom: 28, left: 42 },
  xAxis: {
    type: 'category',
    data: data.value?.weeklyTrend.map((point) => point.week) ?? [],
    axisLine: { lineStyle: { color: '#64748b' } },
    axisLabel: { color: '#94a3b8' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#334155', opacity: 0.25 } },
  },
  series: [
    {
      name: t('dashboard.created'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      data: data.value?.weeklyTrend.map((point) => point.created) ?? [],
      areaStyle: { opacity: 0.1 },
    },
    {
      name: t('dashboard.completed'),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      data: data.value?.weeklyTrend.map((point) => point.completed) ?? [],
    },
  ],
}))

const categoryOption = computed<EChartsCoreOption>(() => ({
  aria: { enabled: true, decal: { show: true } },
  color: ['#f59e0b'],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 10, right: 15, bottom: 25, left: 130 },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#334155', opacity: 0.25 } },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: data.value?.categoryBreakdown.map((point) => point.category) ?? [],
    axisLabel: { color: '#94a3b8', width: 110, overflow: 'truncate' },
  },
  series: [
    {
      type: 'bar',
      data: data.value?.categoryBreakdown.map((point) => point.count) ?? [],
      barWidth: 12,
      itemStyle: { borderRadius: [0, 6, 6, 0] },
    },
  ],
}))

onMounted(load)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const [summary, requests] = await Promise.all([
      forjadataApi.dashboard(),
      forjadataApi.listRequests({
        page: 1,
        pageSize: 5,
        search: '',
        status: '',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      }),
    ])
    data.value = summary
    recent.value = requests.data
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('dashboard.loadErrorFallback')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page dashboard">
    <header class="page-header">
      <div>
        <FjBadge tone="info">{{ t('dashboard.scenario') }}</FjBadge>
        <h1>
          {{
            t('dashboard.greeting', {
              name: auth.session?.user.displayName.split(' ')[0],
            })
          }}
        </h1>
        <p>{{ t('dashboard.intro') }}</p>
      </div>
      <RouterLink v-if="auth.can('request:create')" to="/app/requests/new">
        <FjButton><FilePlus2 :size="17" /> {{ t('action.createRequest') }}</FjButton>
      </RouterLink>
    </header>

    <div v-if="route.query.denied" class="permission-notice" role="alert">
      <AlertTriangle :size="17" />
      {{ t('dashboard.denied') }}
    </div>

    <StatePanel v-if="loading" kind="loading" :title="t('dashboard.loading')" />
    <StatePanel
      v-else-if="error"
      kind="error"
      :title="t('dashboard.loadError')"
      :description="error"
    >
      <FjButton variant="secondary" @click="load"
        ><RefreshCcw :size="16" /> {{ t('action.retry') }}</FjButton
      >
    </StatePanel>

    <template v-else-if="data">
      <section class="kpi-grid" :aria-label="t('dashboard.mainIndicators')">
        <KpiCard
          :label="t('dashboard.requestsCreated')"
          :value="String(data.requestsCreated)"
          :trend="t('dashboard.requestsCreatedTrend')"
          tone="success"
        >
          <template #icon><FilePlus2 :size="17" /></template>
        </KpiCard>
        <KpiCard
          :label="t('dashboard.pendingReview')"
          :value="String(data.pendingReview)"
          :trend="t('dashboard.pendingReviewTrend')"
          tone="warning"
        >
          <template #icon><Clock3 :size="17" /></template>
        </KpiCard>
        <KpiCard
          :label="t('dashboard.synchronized')"
          :value="String(data.synced)"
          :trend="t('dashboard.synchronizedTrend')"
          tone="success"
        >
          <template #icon><CheckCircle2 :size="17" /></template>
        </KpiCard>
        <KpiCard
          :label="t('dashboard.averageConfidence')"
          :value="`${Math.round(data.averageConfidence * 100)}%`"
          :trend="t('dashboard.confidenceNote')"
        >
          <template #icon><Bot :size="17" /></template>
        </KpiCard>
        <KpiCard
          :label="t('dashboard.duplicatesPrevented')"
          :value="String(data.duplicatesPrevented)"
          :trend="t('dashboard.duplicatesNote')"
        >
          <template #icon><CopyCheck :size="17" /></template>
        </KpiCard>
        <KpiCard
          :label="t('dashboard.averageCycle')"
          :value="`${data.averageCycleHours} h`"
          :trend="t('dashboard.cycleTrend')"
          tone="success"
        >
          <template #icon><Clock3 :size="17" /></template>
        </KpiCard>
      </section>

      <section class="dashboard-grid">
        <article class="panel chart-panel">
          <div class="panel__header">
            <div>
              <h2>{{ t('dashboard.trendTitle') }}</h2>
              <p>{{ t('dashboard.trendSubtitle') }}</p>
            </div>
            <FjBadge>{{ t('common.weekly') }}</FjBadge>
          </div>
          <div class="panel__body">
            <BaseChart :option="trendOption" :label="t('dashboard.trendAria')" />
            <details class="chart-table">
              <summary>{{ t('dashboard.tableAlternative') }}</summary>
              <table>
                <thead>
                  <tr>
                    <th>{{ t('common.week') }}</th>
                    <th>{{ t('dashboard.created') }}</th>
                    <th>{{ t('dashboard.completed') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="point in data.weeklyTrend" :key="point.week">
                    <td>{{ point.week }}</td>
                    <td>{{ point.created }}</td>
                    <td>{{ point.completed }}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel__header">
            <div>
              <h2>{{ t('dashboard.byCategory') }}</h2>
              <p>{{ t('dashboard.categorySubtitle') }}</p>
            </div>
          </div>
          <div class="panel__body">
            <BaseChart :option="categoryOption" :label="t('dashboard.categoryAria')" />
          </div>
        </article>
      </section>

      <section class="dashboard-grid dashboard-grid--bottom">
        <article class="panel">
          <div class="panel__header">
            <div>
              <h2>{{ t('dashboard.recentActivity') }}</h2>
              <p>{{ t('dashboard.recentSubtitle') }}</p>
            </div>
            <RouterLink class="view-all" to="/app/requests"
              >{{ t('dashboard.viewAll') }} <ArrowRight :size="14"
            /></RouterLink>
          </div>
          <div class="recent-list">
            <RouterLink
              v-for="request in recent"
              :key="request.id"
              :to="`/app/requests/${request.id}`"
              class="recent-item"
            >
              <span class="recent-item__icon"><FilePlus2 :size="16" /></span>
              <span class="recent-item__text">
                <strong>{{ request.title }}</strong>
                <small class="mono"
                  >{{ request.id }} · {{ request.category ?? t('common.noCategory') }}</small
                >
              </span>
              <StatusBadge :status="request.status" />
            </RouterLink>
          </div>
        </article>

        <article class="panel attention-panel">
          <div class="panel__header">
            <div>
              <h2>{{ t('dashboard.priorityAttention') }}</h2>
              <p>{{ t('dashboard.prioritySubtitle') }}</p>
            </div>
          </div>
          <div class="attention-list">
            <RouterLink to="/app/review">
              <span class="attention__marker attention__marker--warning"
                ><Clock3 :size="16"
              /></span>
              <span
                ><strong>{{ t('dashboard.pendingCount', { count: data.pendingReview }) }}</strong
                ><small>{{ t('dashboard.slaRiskCount', { count: data.slaAtRisk }) }}</small></span
              >
              <ArrowRight :size="15" />
            </RouterLink>
            <RouterLink to="/app/sap">
              <span class="attention__marker attention__marker--danger"
                ><AlertTriangle :size="16"
              /></span>
              <span
                ><strong>{{ t('dashboard.syncErrors', { count: data.failed }) }}</strong
                ><small>{{ t('dashboard.controlledRetries') }}</small></span
              >
              <ArrowRight :size="15" />
            </RouterLink>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard .page-header {
  align-items: center;
}

.dashboard .page-header > div:first-child {
  display: grid;
  justify-items: start;
  gap: 0.5rem;
}

.permission-notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.8rem 1rem;
  border: 1px solid color-mix(in srgb, var(--color-warning) 30%, var(--color-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-warning) 9%, var(--color-surface));
  color: var(--color-warning-text);
  font-size: 0.78rem;
}

.kpi-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(6, minmax(9.5rem, 1fr));
}

.dashboard-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1.35fr 0.75fr;
}

.dashboard-grid--bottom {
  grid-template-columns: 1.2fr 0.8fr;
}

.chart-panel .panel__header p {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.chart-table {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.chart-table summary {
  cursor: pointer;
  font-weight: 700;
}

.chart-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.6rem;
}

.chart-table th,
.chart-table td {
  padding: 0.4rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.recent-list,
.attention-list {
  display: grid;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.recent-item:last-child {
  border-bottom: 0;
}

.recent-item:hover {
  background: var(--color-surface-muted);
}

.recent-item__icon,
.attention__marker {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.recent-item__text {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.2rem;
}

.recent-item__text strong {
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item__text small {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.attention-list a {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.attention-list a:last-child {
  border-bottom: 0;
}

.attention-list a > span:nth-child(2) {
  display: grid;
  flex: 1;
  gap: 0.18rem;
}

.attention-list strong {
  font-size: 0.78rem;
}

.attention-list small {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.attention__marker--warning {
  background: color-mix(in srgb, var(--color-warning) 13%, transparent);
  color: var(--color-warning-text);
}

.attention__marker--danger {
  background: color-mix(in srgb, var(--color-danger) 13%, transparent);
  color: var(--color-danger-text);
}

@media (max-width: 1250px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .dashboard-grid,
  .dashboard-grid--bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
