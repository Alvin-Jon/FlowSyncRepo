import header from "./Header";
import DeviceSetUp from "./DeviceSetUp";
import NotificationSetting from "./NotificationSetting";
import Data_and_Units from "./Data_&_Units";
import Account from "./Account";
import { Save } from "lucide-react";
import { useAuth } from "./AuthProvider";
import socket from "../Socket";
import { useState } from "react";

const Settings = ({sendNotification}) => {
    const { deviceDetails, setDeviceDetails } = useAuth();
    const [newStatus, setNewStatus] = useState({});

    const saveSettings = async () => {
        // API call to save 
        socket.emit("update-settings-status", {
            userId: deviceDetails.user.id,
            newSettings: newStatus
        });
        sendNotification("Settings Saved", "Settings have been saved successfully.", "info");

         // Update local state
        setDeviceDetails(prevDetails => ({
            ...prevDetails, 
            Details: {
                ...prevDetails.Details,
                device: {
                    ...prevDetails.Details.device,
                    settings: {
                        ...prevDetails.Details.device.settings,
                        ...newStatus
                    }
                }
            }
        }));
    }

    return (
        <>
              {header("Settings", "Manage your preferences")}
                <DeviceSetUp deviceId = {deviceDetails.Details.user.registeredDevices.nameId}/>
                <NotificationSetting items = {deviceDetails.Details.device.settings.notification} setNewStatus = {setNewStatus}/>
                <Data_and_Units sync = {deviceDetails.Details.device.settings.dataSync} unit = {deviceDetails.Details.device.settings.unit} setNewStatus = {setNewStatus}/>
                <Account email = {deviceDetails.Details.user.Email} name = {deviceDetails.Details.user.Username} phoneNumber = {deviceDetails.Details.user.PhoneNumber} setNewStatus = {setNewStatus}/>

                <button className="save-automation" onClick={saveSettings}> <Save /> Save Settings</button>
        </>
    )
}


export default Settings;