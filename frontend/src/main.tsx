import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AuthLayout from './login_signup/AuthLayout.tsx'
import Login from './login_signup/login/Login.tsx'
import Signup from './login_signup/signup/Signup.tsx'
import ForgotPassword from './login_signup/forgot/ForgotPassword.tsx'
import Dashboard from './pages/Dashboard.tsx'
import RequireAuth from './components/RequireAuth.tsx'
import { isAuthed } from './lib/auth.ts'

import './index.css'

function RootRedirect() {
  return <Navigate to={isAuthed() ? '/app' : '/login'} replace />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
        </Route>

        <Route
          path="/app"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
