import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlacesPage } from '@/pages/PlacesPage'
import { PlaceDetailPage } from '@/pages/PlaceDetailPage'
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
      { path: 'places', element: <PlacesPage /> },
      { path: 'places/:id', element: <PlaceDetailPage /> },
      { path: 'scraper', element: <ScraperPage /> },
      { path: 'export', element: <ExportPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
