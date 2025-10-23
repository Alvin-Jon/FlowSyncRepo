import header from "./Header";
import {useEffect, useState} from "react";
import WaterThresholds from "./WaterThresholds";
import PumpControl from "./PumpControl";
import LeakDetectionSetting from "./LeakDetectionSetting";
import { Save } from "lucide-react";
import { useAuth } from "./AuthProvider";
import socket from "../Socket";

const Automation = ({sendNotification}) => {
    const { deviceDetails, setDeviceDetails } = useAuth();
    const {minLevel, maxLevel} = deviceDetails.Details.device.status.waterThreshold;
    const [newStatus, setNewStatus] = useState({});


    const saveSettings = async () => {
        // API call to save 
        socket.emit("update-automation-status", {
            deviceId: deviceDetails.Details.device.nameId,
            newStatus: newStatus
        });
        sendNotification("Settings Saved", "New Automation settings have been saved successfully.", "info");
        // Update local state
        setDeviceDetails(prevDetails => ({
            ...prevDetails, 
            Details: {
                ...prevDetails.Details,
                device: {
                    ...prevDetails.Details.device,
                    status: {
                        ...prevDetails.Details.device.status,
                        ...newStatus
                    }
                }
            }
        }));
    }


    return (
        <>
           {header("Automation & Controls", "configure automated actions")}
              <WaterThresholds minLevel={minLevel} maxLevel = {maxLevel} setNewStatus = {setNewStatus}/>
              <PumpControl autoState = {deviceDetails.Details.device.status.autoPump} setNewStatus = {setNewStatus}/>
              <LeakDetectionSetting autoSupply = {deviceDetails.Details.device.status.autoSupplyCut} setNewStatus = {setNewStatus}/>
              <button className="save-automation" onClick={saveSettings}> <Save /> Save Settings</button>
        </>
    )
}


export default Automation;