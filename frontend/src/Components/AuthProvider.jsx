import { createContext, useContext, useEffect, useState } from 'react';
import {ThreeDots} from 'react-loading-icons'
import api from '../api/api';
import socket from '../Socket';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); 
    const [deviceDetails, setDeviceDetails] = useState({});
    const [fault, setFault] = useState(false);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const response =  await api.get('auth/check-isAuthenticated', { withCredentials: true });
            setDeviceDetails(response.data);
            setIsAuthenticated(true);
            console.log(response.data);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setLoading(false); 
        }
    }; 


    const Update = async () => {
        try {
            const response =  await api.get('auth/check-isAuthenticated', { withCredentials: true });
            setDeviceDetails(response.data);
        }
        catch (error) {
            console.error("Error updating AuthProvider:", error);
        }
    };

    // for push notification on leak detection
        function showNotification(title, body) {
            navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: "/thumbnail.png",
                vibrate: [200, 100, 200],
            });
            });

        }


    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (fault) showNotification('Leak Detected', 'A leak has been detected in your water tank. Please take immediate action.');
    }
    , [fault]);


    useEffect(() => {
        if (isAuthenticated) {
            socket.connect();
            socket.emit("register-device", deviceDetails?.Details?.device?.nameId);

            const handleUpdate = () => {
            if (!loading) Update();
            };

            socket.on("update-device-details", handleUpdate);
            socket.on("Esp32-offline", handleUpdate)
            socket.on("leak-detected", () => {
                setFault(true);
            });

            return () => {
            socket.off("update-device-details", handleUpdate);
            socket.off("Esp32-offline", handleUpdate)
            socket.disconnect();
            };
        }
    }, [isAuthenticated, deviceDetails?.Details?.device?.nameId, loading]);



    if (loading) {
        return <div className='error-container'><ThreeDots  fill="#0077ff"/></div>; 
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, deviceDetails, setDeviceDetails, checkAuth, fault, setFault }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider; 
