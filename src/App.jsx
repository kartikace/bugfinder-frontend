import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewScan from './pages/NewScan'
import ScanDetail from './pages/ScanDetail'
import NotFound from './pages/NotFound'

function PrivateRoute({ children }) {
  // Check user profile for client-side routing state to mitigate XSS JWT theft (B-13)
  const user = localStorage.getItem('user')
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const user = localStorage.getItem('user')
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/new-scan" element={<PrivateRoute><NewScan /></PrivateRoute>} />
        <Route path="/scan/:id" element={<PrivateRoute><ScanDetail /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
