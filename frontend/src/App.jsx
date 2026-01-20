import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ReadingsHistory from './pages/ReadingsHistory'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Advice from './pages/Advice'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute user={user}><Layout user={user} /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/readings" element={<ReadingsHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/advice" element={<Advice />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
