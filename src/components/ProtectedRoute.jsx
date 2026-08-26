import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LanguageContext'
import Loading from './Loading'

/**
 * Auth guard for /app/*. While we check for an existing session we show a
 * gentle loading screen (never a flash of the login page), then either render
 * the app or send the user to /auth — remembering where they were headed.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const { t } = useI18n()
  const location = useLocation()

  if (loading) {
    return <Loading label={t('common.opening')} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return children
}
