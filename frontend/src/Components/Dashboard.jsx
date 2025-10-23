import header from "./Header";
import WaterLevel from "./WaterLevel";
import Water_Pump from "./Water_Pump";
import WaterSupply from "./WaterSupply";
import SensorStatus from "./SensorStatus";
import WaterUsage from "./WaterUsage";
import { useAuth } from "./AuthProvider";

const Dashboard = ({sendNotification}) => {
    const { deviceDetails, setDeviceDetails } = useAuth();

    return (
        <>
            {header("Water Monitoring", "Real-time system status")}
            <WaterLevel level={deviceDetails.Details.device.status.waterLevel}/>

            <Water_Pump 
            sendNotification = {sendNotification} 
            setDeviceDetails = {setDeviceDetails} 
            deviceDetails = {deviceDetails}
            pumpState = {deviceDetails?.Details?.device?.status?.waterpumpStatus} 
            autoState = {deviceDetails?.Details?.device?.status?.autoPump}
            />

            <WaterSupply 
            sendNotification = {sendNotification} 
            setDeviceDetails = {setDeviceDetails} 
            deviceDetails = {deviceDetails}
            supplyState = {deviceDetails?.Details?.device?.status?.watersupplyStatus}
            />

            <SensorStatus sensorData = {deviceDetails?.Details?.device?.SensorData} />
            <WaterUsage history = {deviceDetails?.Details?.device?.status?.history?.logs}/>
        </>
    )
}


export default Dashboard;