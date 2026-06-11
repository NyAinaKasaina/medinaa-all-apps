import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteError() {
  const error = useRouteError()

  const status = isRouteErrorResponse(error) ? error.status : null
  const title = status === 404 ? 'Page introuvable' : 'Une erreur est survenue'
  const detail = isRouteErrorResponse(error)
    ? error.statusText || `${error.status}`
    : error instanceof Error
      ? error.message
      : 'Erreur inattendue'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-amber-500" strokeWidth={2} />
        </div>
        {status && <p className="text-sm font-semibold text-amber-600 mb-1">Erreur {status}</p>}
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-2">{detail}</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <Home className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
        </Button>
      </div>
    </div>
  )
}
