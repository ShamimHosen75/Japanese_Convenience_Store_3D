import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { STORE_NAME } from './config'
import './index.css'

document.title = `${STORE_NAME} – Miniature 3D Diorama`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
