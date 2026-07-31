import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/features/public/LandingView.vue'),
    },
    {
      path: '/demo',
      name: 'demo',
      component: () => import('@/features/auth/DemoLoginView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/EnterpriseLoginView.vue'),
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/features/auth/AuthCallbackView.vue'),
    },
    {
      path: '/architecture',
      name: 'public-architecture',
      component: () => import('@/features/public/ArchitectureView.vue'),
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/features/public/LegalView.vue'),
      props: { page: 'privacy' },
    },
    {
      path: '/licenses',
      name: 'licenses',
      component: () => import('@/features/public/LegalView.vue'),
      props: { page: 'licenses' },
    },
    {
      path: '/app',
      component: () => import('@/app/layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/app/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/features/dashboard/DashboardView.vue'),
        },
        {
          path: 'requests',
          name: 'requests',
          component: () => import('@/features/requests/RequestsView.vue'),
        },
        {
          path: 'requests/new',
          name: 'request-new',
          component: () => import('@/features/requests/RequestCreateView.vue'),
          meta: { permission: 'request:create' },
        },
        {
          path: 'requests/:requestId',
          name: 'request-detail',
          component: () => import('@/features/requests/RequestDetailView.vue'),
        },
        {
          path: 'materials',
          name: 'materials',
          component: () => import('@/features/materials/MaterialsView.vue'),
        },
        {
          path: 'materials/:materialId',
          name: 'material-detail',
          component: () => import('@/features/materials/MaterialDetailView.vue'),
        },
        {
          path: 'review',
          name: 'review',
          component: () => import('@/features/review/ReviewQueueView.vue'),
          meta: { permission: 'request:review' },
        },
        {
          path: 'duplicates',
          name: 'duplicates',
          component: () => import('@/features/duplicates/DuplicateCenterView.vue'),
        },
        {
          path: 'sap',
          name: 'sap',
          component: () => import('@/features/sap/SapCenterView.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/features/analytics/AnalyticsView.vue'),
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('@/features/audit/AuditView.vue'),
          meta: { permission: 'audit:read' },
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('@/features/notifications/NotificationsView.vue'),
        },
        {
          path: 'uat',
          name: 'uat',
          component: () => import('@/features/uat/UatView.vue'),
        },
        {
          path: 'admin/integrations',
          name: 'admin-integrations',
          component: () => import('@/features/admin/IntegrationsView.vue'),
        },
        {
          path: 'admin/settings',
          name: 'admin-settings',
          component: () => import('@/features/admin/DemoSettingsView.vue'),
        },
        {
          path: 'admin/rules',
          alias: '/app/admin/quality-rules',
          name: 'admin-quality-rules',
          component: () => import('@/features/admin/QualityRulesView.vue'),
          meta: { permission: 'admin:manage' },
        },
        {
          path: 'architecture',
          name: 'app-architecture',
          component: () => import('@/features/public/ArchitectureView.vue'),
        },
        {
          path: 'help',
          name: 'help',
          component: () => import('@/features/help/HelpView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/features/public/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: auth.isDemoMode ? 'demo' : 'login',
      query: { returnTo: to.fullPath },
    }
  }
  const permission = to.meta.permission
  if (typeof permission === 'string' && !auth.can(permission as never)) {
    return { name: 'dashboard', query: { denied: permission } }
  }
  return true
})

export default router
