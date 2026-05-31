import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useRoadmapAuth } from '../../context/RoadmapAuthContext'

export default function RoadmapProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useRoadmapAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
