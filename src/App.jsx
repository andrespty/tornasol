import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { GroupProvider } from './context/GroupContext'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import InviteAccept from './pages/InviteAccept'
import NotFound from './pages/NotFound'

import Dashboard from './pages/app/Dashboard'
import Calendar from './pages/app/Calendar'
import Tasks from './pages/app/Tasks'
import Notes from './pages/app/Notes'
import Group from './pages/app/Group'
import Profile from './pages/app/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<InviteAccept />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <GroupProvider>
              <AppLayout />
            </GroupProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notes" element={<Notes />} />
        <Route path="group" element={<Group />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
