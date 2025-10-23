import header from "./Header";
import ModelViewer from "./3D";
import RecentEvent from "./RecentEvent";
import { useAuth } from "./AuthProvider";

const Leakage = () => {
    const { deviceDetails } = useAuth();
    const events = deviceDetails.Details.device.status.events;
    const leakage = deviceDetails.Details.device.status.leakage;
    return (
        <>
              {header("Leakage Detection", "Monitor and manage leakages")}
                <ModelViewer leakage = {leakage}/>
                <RecentEvent events={events}/>
        </>
    )
}


export default Leakage;