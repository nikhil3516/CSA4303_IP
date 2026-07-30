import { AppProvider, useApp } from './context'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'

function Router() {
  const { page } = useApp()
  if (page === 'login') return <Auth />
  if (page === 'user') return <UserDashboard />
  if (page === 'admin') return <AdminDashboard />
  return <Landing />
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
