import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx'

function Root() {
  const [showApp, setShowApp] = useState(false);
  if (showApp) return <App />;
  return <Landing onEnterApp={() => setShowApp(true)} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
