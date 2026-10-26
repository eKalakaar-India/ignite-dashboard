export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  REGIONAL_EXPERT: 'Regional Expert',
}

const LEGACY_REGIONAL_EXPERT_ROLES = ['Gender Expert', 'Gender Experts']

export function hasAllowedRole(role, allowedRoles) {
  return allowedRoles.includes(role) ||
    (allowedRoles.includes(ROLES.REGIONAL_EXPERT) && LEGACY_REGIONAL_EXPERT_ROLES.includes(role))
}

export function getDefaultRouteForRole(role) {
  return role === ROLES.SUPER_ADMIN ? '/dashboard' : '/daily'
}