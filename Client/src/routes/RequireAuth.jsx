import { Navigate, useLocation } from 'react-router-dom'
import { useAFCStore } from '../store/afcStore'

export default function RequireAuth({ children }) {
  const isAuthenticated = useAFCStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}