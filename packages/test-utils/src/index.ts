import type { Paginated, PaginationQuery } from '@forjadata/contracts'

export const FIXED_NOW = '2026-07-30T16:00:00.000Z'

export function correlationId(sequence = 1): string {
  return `corr-test-${String(sequence).padStart(5, '0')}`
}

export function paginatedFixture<T>(
  data: T[],
  overrides: Partial<PaginationQuery> = {},
): Paginated<T> {
  const page = overrides.page ?? 1
  const pageSize = overrides.pageSize ?? Math.max(data.length, 1)
  return {
    data: structuredClone(data),
    pagination: {
      page,
      pageSize,
      total: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / pageSize)),
    },
    meta: { correlationId: correlationId() },
  }
}
