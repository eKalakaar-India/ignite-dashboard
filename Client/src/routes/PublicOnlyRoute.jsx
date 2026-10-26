import { Navigate } from 'react-router-dom'
import { useAFCStore } from '../store/afcStore'
import { getDefaultRouteForRole } from './roles'

export default function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAFCStore((s) => s.isAuthenticated)
  const role = useAFCStore((s) => s.user?.role)

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />
  }

  return children
}