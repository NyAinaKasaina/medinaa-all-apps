import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlacesPage } from '@/pages/PlacesPage'
import { PlaceDetailPage } from '@/pages/PlaceDetailPage'
import { ScraperPage } from '@/pages/ScraperPage'
import { ExportPage } from '@/pages/ExportPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'places', element: <PlacesPage /> },
      { path: 'places/:id', element: <PlaceDetailPage /> },
      { path: 'scraper', element: <ScraperPage /> },
      { path: 'export', element: <ExportPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
