import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './Components/Dashboard';
import Automation from './Components/Automation';
import Leakage from './Components/Leakage';
import Settings from './Components/Settings';
import Navigation from './Components/Navigation';
import Notification from './Components/Notification';
import Login from './Components/Login';
import Register from './Components/Register';
import { useState } from 'react';
import ProtectedRoute from './Components/ProtectedRoute';
import AuthProvider from './Components/AuthProvider';
import './App.css';

// 🔹 Sub-component to handle routes and layout
function AppContent({ showNotification, setShowNotification, notification, sendNotification }) {
  const location = useLocation();
  const hideLayout =
    location.pathname.includes('login') ||
    location.pathname.includes('register') ||
    location.pathname.includes('device/setup'); // optional extra route to hide nav

  return (
    <>
      <Notification
        showNotification={showNotification}
        setShowNotification={setShowNotification}
        notification={notification}
      />

      <main className="app-layout">
        {!hideLayout && <Navigation />}

        <div className="content">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute >
                <Dashboard sendNotification={sendNotification} />
              </ProtectedRoute>
              } />
            <Route path="/automation" element={
              <ProtectedRoute>
                 <Automation sendNotification={sendNotification} />
              </ProtectedRoute>
              } />
            <Route path="/leakage" element={
              <ProtectedRoute>
                <Leakage />
              </ProtectedRoute>
              } />
            <Route path="/settings" element={
              <ProtectedRoute>
               <Settings sendNotification={sendNotification} />
              </ProtectedRoute>
              } />
            <Route path="/login" element={<Login sendNotification={sendNotification}/>} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function App() {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({});

  let notificationTimeout;

  function sendNotification(title, message, type) {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }

    setShowNotification(false);
    notificationTimeout = setTimeout(() => {
      setNotification({ title, message, type });
      setShowNotification(true);

      // Auto-hide after 4 seconds
      notificationTimeout = setTimeout(() => {
        setShowNotification(false);
      }, 4000);
    }, 350);
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent
          showNotification={showNotification}
          setShowNotification={setShowNotification}
          notification={notification}
          sendNotification={sendNotification}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
