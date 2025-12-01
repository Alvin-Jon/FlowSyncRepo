import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(reg => console.log("Service Worker registered", reg))
    .catch(err => console.log("SW registration failed", err));
}

// Request permission to show notifications
if (Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    console.log("Notification permission:", permission);
  });
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
