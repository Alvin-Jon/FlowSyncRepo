import Toggle from "./Toggle";
import { AlertTriangle, Check} from "lucide-react";
import { useEffect, useState } from "react";

const LeakDetectionSetting = ({autoSupply, setNewStatus}) => {
    const [autoSupplyCut, setAutoSupplyCut] = useState(autoSupply);

    useEffect(() => {
        setNewStatus(prevStatus => ({
            ...prevStatus,
            autoSupplyCut: autoSupplyCut
        }));
    }, [autoSupplyCut]);
    return (
        <div className="leak-detection card left">
            <h2 style={{fontSize: "1.2rem", fontWeight:"bold", marginBottom: "20px"}}>Leak Detection Response</h2>

            <div className="auto detection-card">
                <div className="auto-hd">
                <section>
                <AlertTriangle />
                <div className="con">
                 <p style={{fontWeight: "bold"}}>Auto Close Supply On Leak</p>
                 <p style={{color:"grey"}}>Automatically close water supply when a leak is detected</p>
               </div>
               </section>

               <section>
                 <Toggle state={autoSupplyCut} disabled={false} setParentState = {setAutoSupplyCut}/>
               </section>
                </div>
            </div>

            <div className="detect-pros">
                <p> <Check /> Supply valve will close immediately when a leak is detected</p>
                <p> <Check /> Notification will be sent to your registered email</p>
                <p> <Check />Manual override is available in case of false alarms</p>
            </div>
        </div>
    )
}       

export default LeakDetectionSetting;