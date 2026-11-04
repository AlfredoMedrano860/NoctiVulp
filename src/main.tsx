import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts'
import './index.css'
import App from './App.tsx'
import { loadDict } from './i18n'
import { initA11y } from './lib/a11y'
import { parseLocation } from './router'

initA11y()

// Primero el diccionario del idioma de la página (ya viene precargado en el HTML).
void loadDict(parseLocation(window.location.pathname).lang).then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
