import React, { Component, StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx'

// Auto register PWA service worker with auto reload on update
registerSW({ immediate: true })

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("e-Quest ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', background: '#0f172a' }}>
          <div style={{ maxWidth: '520px', width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px' }}>
              Terjadi Kendala Memuat Sesi
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 16px' }}>
              Aplikasi mendeteksi ketidaksesuaian data sementara di cache perangkat. Klik tombol di bawah untuk menyegarkan cache dan membuka kembali aplikasi secara normal.
            </p>
            <div style={{ background: '#090d16', padding: '14px', borderRadius: '14px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: '#fca5a5', maxHeight: '120px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #7f1d1d' }}>
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (e) {}
                window.location.reload();
              }}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}
            >
              Segarkan & Buka Ulang e-Quest
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [appView, setAppView] = useState(null);
  if (appView) return <App defaultLogin={appView} onBack={() => setAppView(null)} />;
  return <Landing onEnterApp={(view) => setAppView(view || 'student')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
