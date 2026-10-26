import { Navigate } from 'react-router-dom'
import { useAFCStore } from '../store/afcStore'
import { getDefaultRouteForRole, hasAllowedRole } from './roles'

export default function RequireRole({ allowedRoles, children }) {
  const role = useAFCStore((s) => s.user?.role)

  if (!hasAllowedRole(role, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />
  }

  return children
}