import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import VideoWorkspace from './components/VideoWorkspace.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <VideoWorkspace />
  </React.StrictMode>,
)
