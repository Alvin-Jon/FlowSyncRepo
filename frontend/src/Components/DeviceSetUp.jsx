import { Wifi, LogOut } from "lucide-react";
import api from "../api/api";
import { useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";


const DeviceSetUp = ({deviceId}) => {
    const { setIsAuthenticated, setDeviceDetails } = useAuth();
    const navigate = useNavigate();
    const logOut = async () => {
        try {
            await api.post("/auth/logout", {}, { withCredentials: true });
            setIsAuthenticated(false);
            setDeviceDetails({});
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    return (
        <div className="device-setup card auto left settings">
            <h2 style={{fontSize: "1.2rem", fontWeight:"bold", marginBottom: "20px"}}><Wifi /> Device Setup</h2>

            <div>
                <p style={{marginBottom: "12px"}}>ESP32 Device ID</p>
                <input type="text" value={deviceId} placeholder="Enter Device ID" disabled = {true} style={{width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid grey", color: "grey"}} />
            </div>

            <div style={{marginTop: "30px"}}>
                <p style={{marginBottom: "12px"}}>WIFI Network</p>
                <input type="text" value={"HomeNetwork"} placeholder="Enter Device ID" disabled = {true} style={{width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid grey", color: "grey"}} />
            </div>

            <div className="logout" style={{ marginTop: "30px" }} onClick={logOut}>
                <LogOut size={20} />
                <span>Logout</span>
            </div>

        </div>
    )
}

export default DeviceSetUp;
