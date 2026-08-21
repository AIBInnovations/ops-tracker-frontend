/**
 * Single source of truth for every in-app destination. Deeplinks are built
 * here rather than inline so entity references stay consistent everywhere.
 */
function withQuery(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `${path}?${qs}` : path
}

export const routes = {
  dashboard: () => '/',

  projects: (filters?: { client?: string; status?: string; type?: string }) => withQuery('/projects', filters),
  project: (id: string) => `/projects/${id}`,

  tasks: (filters?: { project?: string; machineType?: string; status?: string; client?: string; machine?: string }) =>
    withQuery('/tasks', filters),
  task: (id: string) => `/tasks/${id}`,

  clients: () => '/clients',
  client: (id: string) => `/clients/${id}`,

  machines: () => '/machines',
  machineType: (id: string) => `/machines/${id}`,
  machine: (machineTypeId: string, machineId: string) => `/machines/${machineTypeId}/${machineId}`,

  timeline: (filters?: { machineType?: string; project?: string; status?: string; focus?: string }) =>
    withQuery('/timeline', filters),

  utilization: () => '/utilization',

  alerts: (filters?: { severity?: string; type?: string }) => withQuery('/alerts', filters),
}
