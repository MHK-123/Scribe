import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

console.log("🔥 [SENTINEL]: Initializing System Core...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Protocols...</p>
            </div>
          }>
            <App />
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
