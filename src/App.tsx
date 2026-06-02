import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import type React from 'react'
import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'
import PresentationBuilder from './pages/PresentationBuilder'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active ? 'bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  )
}

function AppShell() {
  const showNav = true

  return (
    <>
      {showNav && (
        <nav className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2">
          <NavLink to="/">📊 Kalshi Dashboard</NavLink>
          <NavLink to="/presentation">📑 Weekly Presentation</NavLink>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/presentation" element={<PresentationBuilder />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <AppShell />
    </BrowserRouter>
  )
}
