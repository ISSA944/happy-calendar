import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@material-symbols/font-400/outlined.css'
import './index.css'
import App from './App'
import { revealMaterialSymbols } from './lib/materialSymbols'

// Register PWA service worker
registerSW({ immediate: true })
void revealMaterialSymbols()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
