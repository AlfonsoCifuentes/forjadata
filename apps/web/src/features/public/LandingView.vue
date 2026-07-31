<script setup lang="ts">
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileSearch,
  GitMerge,
  ShieldCheck,
  Sparkles,
  Workflow,
} from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import FjBadge from '@/components/base/FjBadge.vue'
import FjButton from '@/components/base/FjButton.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { t } = useI18n()

const capabilities = computed(() => [
  {
    icon: FileSearch,
    title: t('landing.capabilities.ingestionTitle'),
    text: t('landing.capabilities.ingestionText'),
  },
  {
    icon: GitMerge,
    title: t('landing.capabilities.governanceTitle'),
    text: t('landing.capabilities.governanceText'),
  },
  {
    icon: Database,
    title: t('landing.capabilities.sapTitle'),
    text: t('landing.capabilities.sapText'),
  },
])

const pipeline = computed(() => [
  t('landing.pipeline.reception'),
  t('landing.pipeline.extraction'),
  t('landing.pipeline.normalization'),
  t('landing.pipeline.review'),
  t('landing.pipeline.sap'),
])
</script>

<template>
  <div class="landing">
    <header class="landing-header">
      <RouterLink class="landing-brand" to="/">
        <span class="landing-brand__mark" aria-hidden="true">F</span>
        <strong>forjadata</strong>
      </RouterLink>
      <nav :aria-label="t('public.navigationLabel')">
        <RouterLink to="/architecture">{{ t('public.architecture') }}</RouterLink>
        <RouterLink to="/privacy">{{ t('public.privacy') }}</RouterLink>
        <button
          type="button"
          :aria-label="
            ui.locale === 'es' ? t('language.switchToEnglish') : t('language.switchToSpanish')
          "
          @click="ui.setLocale(ui.locale === 'es' ? 'en' : 'es')"
        >
          {{ ui.locale.toUpperCase() }}
        </button>
        <RouterLink to="/demo">
          <FjButton variant="secondary">{{ t('action.openDemo') }}</FjButton>
        </RouterLink>
      </nav>
    </header>

    <main id="main-content">
      <section class="hero">
        <div class="hero__content">
          <FjBadge tone="ai"><Sparkles :size="13" /> {{ t('landing.badge') }}</FjBadge>
          <h1>{{ t('product.claim') }}</h1>
          <p>{{ t('landing.description') }}</p>
          <div class="hero__actions">
            <RouterLink to="/demo">
              <FjButton>{{ t('landing.explore') }} <ArrowRight :size="17" /></FjButton>
            </RouterLink>
            <RouterLink to="/architecture">
              <FjButton variant="secondary">{{ t('landing.howBuilt') }}</FjButton>
            </RouterLink>
          </div>
          <div class="hero__trust">
            <span><CheckCircle2 :size="15" /> {{ t('landing.immediateAccess') }}</span>
            <span><CheckCircle2 :size="15" /> {{ t('landing.syntheticData') }}</span>
            <span><CheckCircle2 :size="15" /> {{ t('landing.noPaidServices') }}</span>
          </div>
        </div>

        <div class="hero__visual" :aria-label="t('landing.pipelineAria')">
          <div class="visual__topline">
            <span class="visual__eyebrow">{{ t('landing.activePipeline') }}</span>
            <FjBadge tone="success">{{ t('common.demo') }}</FjBadge>
          </div>
          <div class="visual__document">
            <div class="document__icon"><FileSearch :size="22" /></div>
            <div>
              <strong>ficha-motor-demo.pdf</strong>
              <span>{{ t('landing.documentDetail') }}</span>
            </div>
            <span class="document__check"><CheckCircle2 :size="18" /></span>
          </div>
          <div class="visual__pipeline">
            <div v-for="(step, index) in pipeline" :key="step" class="pipeline-step">
              <span class="pipeline-step__node">{{ index + 1 }}</span>
              <span>{{ step }}</span>
            </div>
          </div>
          <div class="visual__result">
            <div>
              <span>{{ t('landing.proposedCategory') }}</span>
              <strong>Motores eléctricos</strong>
            </div>
            <div class="confidence">
              <span>{{ t('landing.productConfidence') }}</span>
              <strong>94%</strong>
            </div>
          </div>
          <div class="visual__attributes">
            <span
              ><b>{{ t('landing.attributes.power') }}</b> 7,5 kW</span
            >
            <span
              ><b>{{ t('landing.attributes.voltage') }}</b> 400 V</span
            >
            <span
              ><b>{{ t('landing.attributes.protection') }}</b> IP55</span
            >
          </div>
        </div>
      </section>

      <section class="demo-metrics" :aria-label="t('landing.metricsAria')">
        <div>
          <span>{{ t('landing.metrics.scenario') }}</span>
          <strong>82%</strong>
          <p>{{ t('landing.metrics.acceptance') }}</p>
        </div>
        <div>
          <span>{{ t('landing.metrics.dataset') }}</span>
          <strong>50k</strong>
          <p>{{ t('landing.metrics.materials') }}</p>
        </div>
        <div>
          <span>{{ t('landing.metrics.journey') }}</span>
          <strong>&lt; 3 min</strong>
          <p>{{ t('landing.metrics.journeyDetail') }}</p>
        </div>
      </section>

      <section class="capabilities">
        <div class="section-heading">
          <FjBadge>{{ t('landing.traceability') }}</FjBadge>
          <h2>{{ t('landing.capabilitiesTitle') }}</h2>
          <p>{{ t('landing.capabilitiesDescription') }}</p>
        </div>
        <div class="capability-grid">
          <article v-for="capability in capabilities" :key="capability.title">
            <span class="capability__icon"><component :is="capability.icon" :size="22" /></span>
            <h3>{{ capability.title }}</h3>
            <p>{{ capability.text }}</p>
          </article>
        </div>
      </section>

      <section class="architecture-strip">
        <div>
          <ShieldCheck :size="26" />
          <h2>{{ t('landing.honestMocks') }}</h2>
          <p>{{ t('landing.honestMocksText') }}</p>
        </div>
        <div class="architecture-strip__stack">
          <span>Vue 3</span><span>TypeScript</span><span>Pinia</span><span>AG Grid</span>
          <span>Azure Functions</span><span>PostgreSQL</span><span>Vitest</span>
        </div>
      </section>

      <section class="closing-cta">
        <Workflow :size="34" />
        <h2>{{ t('landing.closingTitle') }}</h2>
        <p>{{ t('landing.closingText') }}</p>
        <RouterLink to="/demo"
          ><FjButton>{{ t('landing.startJourney') }} <ArrowRight :size="17" /></FjButton
        ></RouterLink>
      </section>
    </main>

    <footer>
      <span>{{ t('landing.footerProject') }}</span>
      <span>{{ t('product.syntheticNotice') }}</span>
      <div>
        <RouterLink to="/privacy">{{ t('public.privacy') }}</RouterLink
        ><RouterLink to="/licenses">{{ t('public.licenses') }}</RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing {
  overflow: hidden;
  min-height: 100vh;
}

.landing-header {
  display: flex;
  width: min(75rem, calc(100% - 2rem));
  min-height: 4.8rem;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.landing-header nav {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 650;
}

.landing-header nav > button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-weight: 750;
}

.landing-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.18rem;
  letter-spacing: -0.04em;
}

.landing-brand__mark {
  display: grid;
  width: 2.05rem;
  height: 2.05rem;
  place-items: center;
  border-radius: 0.62rem;
  background: linear-gradient(145deg, var(--color-accent), var(--color-accent-strong));
  color: #291707;
  font-weight: 900;
}

.hero {
  display: grid;
  width: min(75rem, calc(100% - 2rem));
  min-height: 42rem;
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
  grid-template-columns: minmax(0, 1fr) minmax(24rem, 0.9fr);
  margin: 0 auto;
  padding: 4rem 0 5rem;
}

.hero__content {
  display: grid;
  justify-items: start;
  gap: 1.4rem;
}

.hero h1 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(3rem, 6.4vw, 5.6rem);
  line-height: 0.98;
  letter-spacing: -0.065em;
}

.hero__content > p {
  max-width: 40rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: clamp(1rem, 2vw, 1.18rem);
  line-height: 1.65;
}

.hero__actions,
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.hero__trust {
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.hero__trust span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.hero__trust :deep(svg) {
  color: var(--color-success);
}

.hero__visual {
  position: relative;
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 1.5rem;
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--color-surface) 94%, transparent),
      var(--color-surface)
    ),
    var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.hero__visual::before {
  position: absolute;
  z-index: -1;
  inset: -5rem;
  background: radial-gradient(circle, rgb(245 158 11 / 0.18), transparent 65%);
  content: '';
}

.visual__topline,
.visual__document,
.visual__result,
.visual__attributes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.visual__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.visual__document {
  justify-content: flex-start;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
}

.visual__document div:nth-child(2) {
  display: grid;
  flex: 1;
  gap: 0.2rem;
}

.visual__document div span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.document__icon {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--color-ai) 13%, var(--color-surface));
  color: var(--color-ai-text);
}

.document__check {
  color: var(--color-success);
}

.visual__pipeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.visual__pipeline::before {
  position: absolute;
  top: 0.75rem;
  right: 10%;
  left: 10%;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-info));
  content: '';
}

.pipeline-step {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.62rem;
  text-align: center;
}

.pipeline-step__node {
  display: grid;
  width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  background: var(--color-accent);
  color: #271607;
  font-size: 0.68rem;
  font-weight: 900;
  box-shadow: 0 0 0 1px var(--color-border);
}

.pipeline-step:nth-child(n + 4) .pipeline-step__node {
  background: var(--color-info);
  color: white;
}

.visual__result {
  align-items: stretch;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--graphite-950);
  color: white;
}

.visual__result > div {
  display: grid;
  gap: 0.3rem;
}

.visual__result span {
  color: #94a3b8;
  font-size: 0.68rem;
}

.confidence {
  text-align: right;
}

.confidence strong {
  color: #fbbf24;
  font-size: 1.45rem;
}

.visual__attributes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.visual__attributes span {
  display: grid;
  gap: 0.15rem;
  padding: 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.visual__attributes b {
  color: var(--color-text);
  font-size: 0.68rem;
}

.demo-metrics,
.capabilities,
.architecture-strip,
.closing-cta {
  width: min(75rem, calc(100% - 2rem));
  margin: 0 auto;
}

.demo-metrics {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  grid-template-columns: repeat(3, 1fr);
}

.demo-metrics div {
  display: grid;
  gap: 0.25rem;
  padding: 1.5rem;
  border-right: 1px solid var(--color-border);
}

.demo-metrics div:last-child {
  border-right: 0;
}

.demo-metrics span {
  color: var(--color-text-muted);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.demo-metrics strong {
  font-size: 2rem;
  letter-spacing: -0.04em;
}

.demo-metrics p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.capabilities {
  padding: 8rem 0;
}

.section-heading {
  display: grid;
  max-width: 46rem;
  justify-items: start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-heading h2,
.architecture-strip h2,
.closing-cta h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  letter-spacing: -0.055em;
}

.section-heading p,
.architecture-strip p,
.closing-cta p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.capability-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
}

.capability-grid article {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.capability-grid h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.1rem;
}

.capability-grid p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.capability__icon {
  display: grid;
  width: 2.7rem;
  height: 2.7rem;
  place-items: center;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
  color: var(--color-accent-strong);
}

.architecture-strip {
  display: grid;
  align-items: center;
  gap: 3rem;
  padding: clamp(2rem, 5vw, 4rem);
  border-radius: 1.5rem;
  background: var(--graphite-950);
  color: white;
  grid-template-columns: 1fr 0.8fr;
}

.architecture-strip > div:first-child {
  display: grid;
  justify-items: start;
  gap: 1rem;
}

.architecture-strip p {
  color: #a8b3c4;
}

.architecture-strip__stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.architecture-strip__stack span {
  padding: 0.55rem 0.75rem;
  border: 1px solid #334155;
  border-radius: var(--radius-md);
  background: #111827;
  color: #dbe5f3;
  font-size: 0.78rem;
}

.closing-cta {
  display: grid;
  justify-items: center;
  gap: 1rem;
  padding: 9rem 1rem;
  text-align: center;
}

.closing-cta :deep(svg:first-child) {
  color: var(--color-accent-strong);
}

footer {
  display: flex;
  width: min(75rem, calc(100% - 2rem));
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 0 2.5rem;
  border-top: 1px solid var(--color-border);
  margin: 0 auto;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

footer div {
  display: flex;
  gap: 1rem;
}

@media (max-width: 900px) {
  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .hero h1 {
    max-width: 14ch;
  }

  .hero__visual {
    width: min(34rem, 100%);
  }

  .capability-grid,
  .architecture-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .landing-header nav > a:not(:last-child),
  .landing-header nav > button {
    display: none;
  }

  .hero {
    padding-top: 2.5rem;
  }

  .hero h1 {
    font-size: clamp(2.8rem, 15vw, 4.4rem);
  }

  .visual__attributes,
  .demo-metrics,
  .capability-grid {
    grid-template-columns: 1fr;
  }

  .demo-metrics div {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .demo-metrics div:last-child {
    border-bottom: 0;
  }

  .visual__pipeline {
    overflow-x: auto;
  }

  .pipeline-step {
    min-width: 4.2rem;
  }

  footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
