import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

const RecentEvent = ({events}) => {
    const  [leakage, setLeakage] = useState(true);

    return (
        <div className="recent-event card left">
            <h2 style={{fontSize: "1.2rem", fontWeight:"bold", marginBottom: "20px"}}> Recent Events</h2>

           {leakage && events.length > 0 ? 
            <> {events.map((event) => (
                <div key={event.id} className="event-item" style={{borderLeft: leakage ? "4px solid red" : "4px solid green", paddingLeft: "10px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px"}}>
                    <div className="event-icon">
                    </div>
                    <div className="event-details">
                        <h3 style={{fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px", padding: "5px"}}><AlertTriangle color="red" />  {event.title}</h3>
                        <p style={{color:"grey"}}>{event.description}</p>
                    </div>
                </div>
            )) 
            } </>
            :
            <div className="card" style={{textAlign: "center", padding: "20px", borderLeft: leakage ? "4px solid green" : "4px solid green", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"}}>
                <CheckCircle color="green" size={50} />
                <h3 style={{color: "grey"}}> No Leak Event Detected</h3>
                <p style={{color:"grey"}}>All systems are functioning normally.</p>
            </div>
        }
        </div>
    );
}
export default RecentEvent;