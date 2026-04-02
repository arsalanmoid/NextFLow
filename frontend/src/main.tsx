import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { ReactFlowProvider } from 'reactflow'
import './index.css'
import { DashboardPage } from './pages/DashboardPage'
import { WorkflowPage } from './pages/WorkflowPage'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn><DashboardPage /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            }
          />
          <Route
            path="/workflow/:id"
            element={
              <>
                <SignedIn><ReactFlowProvider><WorkflowPage /></ReactFlowProvider></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
)
