import Toggle from "./Toggle";
import { Droplet } from "lucide-react";
import { useState, useEffect } from "react";

const PumpControl = ({autoState, setNewStatus}) => {
    const [autoPump, setAutoPump] = useState(autoState);

    useEffect(() => {
        setNewStatus(prevStatus => ({
            ...prevStatus,
            autoPump: autoPump
        }));
    }, [autoPump]);

    return (
        <div className="pump-control card left">
            <h2 style={{fontSize: "1.2rem", fontWeight:"bold", marginBottom: "20px"}}>Pump Control</h2>
            
            <div className="auto">
                <div className="auto-hd">
                <section className="pump">
                <Droplet />
                <div className="con">
                 <p style={{fontWeight: "bold"}}>Automatic Mode</p>
                 <p style={{color:"grey"}}>Let the system control the Pump</p>
               </div>
               </section>

               <section>
                 <Toggle state={autoPump} disabled={false} setParentState={setAutoPump}/>
               </section>
                </div>
            </div>
        </div>
    )
}

export default PumpControl;