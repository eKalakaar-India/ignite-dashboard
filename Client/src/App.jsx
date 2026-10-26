import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'

import Dashboard from './pages/Dashboard'
import DailyActivities from './pages/DailyActivities'
import QualitativeAnalysis from './pages/QualitativeAnalysis'
import Performance from './pages/Performance'
import NotFound from './pages/NotFound'
import DocumentationPage from './pages/Documentation'
import Login from './pages/Login'
import Users from './pages/Users'

import RequireAuth from './routes/RequireAuth'
import RequireRole from './routes/RequireRole'
import PublicOnlyRoute from './routes/PublicOnlyRoute'
import { ROLES, getDefaultRouteForRole } from './routes/roles'
import { useAFCStore } from './store/afcStore'

function RoleHomeRedirect() {
  const role = useAFCStore((s) => s.user?.role)
  return <Navigate to={getDefaultRouteForRole(role)} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<RoleHomeRedirect />} />

          <Route
            path="/dashboard"
            element={
              <RequireRole allowedRoles={[ROLES.SUPER_ADMIN]}>
                <Dashboard />
              </RequireRole>
            }
          />

          
          <Route path="/daily" element={
            <RequireRole allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT]}>
              <DailyActivities />
            </RequireRole>  
          } />

          <Route
            path="/qualitative"
            element={
              <RequireRole allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT]}>
                <QualitativeAnalysis />
              </RequireRole>
            }
          />
          
          
          <Route path="/performance" element={
            <RequireRole allowedRoles={[ROLES.SUPER_ADMIN]}>
              <Performance />
            </RequireRole>
              
          } />

          <Route
            path="/documentation"
            element={
              <RequireRole allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_EXPERT]}>
                <DocumentationPage />
              </RequireRole>
            }
          />

          <Route
            path="/users"
            element={
              <RequireRole allowedRoles={[ROLES.SUPER_ADMIN]}>
                <Users />
              </RequireRole>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
