import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { TaskBucketPage } from '@/pages/TaskBucketPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { MachinesPage } from '@/pages/MachinesPage'
import { MachineTypeDetailPage } from '@/pages/MachineTypeDetailPage'
import { MachineDetailPage } from '@/pages/MachineDetailPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { AlertsPage } from '@/pages/AlertsPage'

// The only route that pulls in the charting library — splitting it keeps
// that weight off the first paint of every other page.
const UtilizationPage = lazy(() =>
  import('@/pages/UtilizationPage').then((m) => ({ default: m.UtilizationPage })),
)

function RouteFallback() {
  return (
    <div className="mx-auto w-full px-5 py-5 lg:px-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Skeleton className="h-[340px] rounded-lg" />
        <Skeleton className="h-[340px] rounded-lg" />
      </div>
    </div>
  )
}

function App() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          <Route path="/tasks" element={<TaskBucketPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />

          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />

          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/machines/:typeId" element={<MachineTypeDetailPage />} />
          <Route path="/machines/:typeId/:machineId" element={<MachineDetailPage />} />

          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/utilization" element={<UtilizationPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

export default App
