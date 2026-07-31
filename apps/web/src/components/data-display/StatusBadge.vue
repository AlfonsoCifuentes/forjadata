<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import FjBadge from '@/components/base/FjBadge.vue'

const props = defineProps<{ status: string }>()
const { t } = useI18n()

const labels: Record<string, string> = {
  DRAFT: 'status.draft',
  SUBMITTED: 'status.submitted',
  PROCESSING: 'status.processing',
  NEEDS_REVIEW: 'status.needsReview',
  CHANGES_REQUESTED: 'status.changesRequested',
  APPROVED: 'status.approved',
  REJECTED: 'status.rejected',
  READY_FOR_SAP: 'status.readyForSap',
  SYNCING: 'status.syncing',
  SYNCED: 'status.synced',
  SYNC_FAILED: 'status.syncFailed',
  ARCHIVED: 'status.archived',
  CANCELLED: 'status.cancelled',
  IN_REVIEW: 'status.inReview',
  SUCCEEDED: 'status.succeeded',
  FAILED_RETRYABLE: 'status.failedRetryable',
  PENDING: 'status.pending',
  LINKED: 'status.linked',
  NOT_DUPLICATE: 'status.notDuplicate',
}

const label = computed(() => {
  const key = labels[props.status]
  return key ? t(key) : props.status
})

const tone = computed(() => {
  if (['SYNCED', 'SUCCEEDED', 'APPROVED'].includes(props.status)) return 'success'
  if (['SYNC_FAILED', 'FAILED_RETRYABLE', 'REJECTED'].includes(props.status)) return 'danger'
  if (['NEEDS_REVIEW', 'READY_FOR_SAP', 'CHANGES_REQUESTED'].includes(props.status)) {
    return 'warning'
  }
  if (['PROCESSING', 'SYNCING', 'SUBMITTED'].includes(props.status)) return 'info'
  return 'neutral'
})
</script>

<template>
  <FjBadge :tone="tone">{{ label }}</FjBadge>
</template>
