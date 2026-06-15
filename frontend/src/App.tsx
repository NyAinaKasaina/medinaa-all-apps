import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlacesPage } from '@/pages/PlacesPage'
import { PlaceDetailPage } from '@/pages/PlaceDetailPage'
import { DataQualityPage } from '@/pages/DataQualityPage'

// Carte = MapLibre (~900 Ko) : chargée à la demande pour alléger le bundle initial.
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))
import { ScraperPage } from '@/pages/ScraperPage'
import { ExportPage } from '@/pages/ExportPage'
import { RouteError } from '@/components/layout/RouteError'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'carte', element: <Suspense fallback={<div className="p-8 text-sm text-slate-400">Chargement de la carte…</div>}><MapPage /></Suspense> },
      { path: 'places', element: <PlacesPage /> },
      { path: 'places/:id', element: <PlaceDetailPage /> },
      { path: 'quality', element: <DataQualityPage /> },
      { path: 'scraper', element: <ScraperPage /> },
      { path: 'export', element: <ExportPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
