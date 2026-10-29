import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts'
import 'lenis/dist/lenis.css'
import './index.css'
import App from './App.tsx'
import { initA11y } from './lib/a11y'

initA11y()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
