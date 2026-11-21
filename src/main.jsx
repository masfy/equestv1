import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx'

// Auto register PWA service worker with auto reload on update
registerSW({ immediate: true })

function Root() {
  const [appView, setAppView] = useState(null);
  if (appView) return <App defaultLogin={appView} onBack={() => setAppView(null)} />;
  return <Landing onEnterApp={(view) => setAppView(view || 'student')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
