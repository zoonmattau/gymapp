import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import UpRepDemo from '../uprep-v5.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UpRepDemo />
    </AuthProvider>
  </React.StrictMode>,
)
