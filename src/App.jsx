import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Contacts from './pages/Contacts/Contacts'
import CRM from './pages/CRM/CRM'
import Quotes from './pages/Quotes/Quotes'
import QuoteEditor from './pages/Quotes/QuoteEditor'
import Projects from './pages/Projects/Projects'
import ProjectBoard from './pages/Projects/ProjectBoard'
import './styles/globals.css'
import './styles/tokens.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout><CRM /></Layout>
          </PrivateRoute>
        } />
        <Route path="/contactos" element={
          <PrivateRoute>
            <Layout><Contacts /></Layout>
          </PrivateRoute>
        } />
        <Route path="/crm" element={
          <PrivateRoute>
            <Layout><CRM /></Layout>
          </PrivateRoute>
        } />
        <Route path="/cotizaciones" element={
          <PrivateRoute>
            <Layout><Quotes /></Layout>
          </PrivateRoute>
        } />
        <Route path="/cotizaciones/nueva" element={
          <PrivateRoute>
            <Layout><QuoteEditor /></Layout>
          </PrivateRoute>
        } />
        <Route path="/cotizaciones/:id" element={
          <PrivateRoute>
            <Layout><QuoteEditor /></Layout>
          </PrivateRoute>
        } />
        <Route path="/proyectos" element={
          <PrivateRoute>
            <Layout><Projects /></Layout>
          </PrivateRoute>
        } />
        <Route path="/proyectos/:id" element={
          <PrivateRoute>
            <Layout><ProjectBoard /></Layout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
