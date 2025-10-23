import { Droplet } from "lucide-react";
import Toggle  from "./Toggle";
import socket from "../Socket";

const WaterSupply = ({sendNotification, setDeviceDetails, supplyState, deviceDetails}) => {
    const supply = async (newState) => {
  socket.emit("update-supply-status", {
      deviceId: deviceDetails.Details.device.nameId,
      supplyStatus: newState
    });

    setDeviceDetails((prev) => ({
    ...prev, 
    Details: {
      ...prev.Details,
      device: {
        ...prev.Details.device,
        status: {
          ...prev.Details.device.status,
          watersupplyStatus: newState, // 👈 update only this field
        },
      },
    },
}));

  // ... LATER STUFFS TO UPDATE STATE FROM BACKEND
     const status = newState ? 'Opened' : 'Closed';
     sendNotification('Water Supply', `The Water Supply has been ${status}`, 'info');
  };


   // Determine pump label & color based on state
  const pumpLabel = supplyState ? "ON" : "OFF";


    return (
        <div className="water-pump card auto">
            <div className="auto-hd">
               <section>
          <Droplet
            style={{
              color: supplyState ? "rgb(0, 170, 255)" : "#999",
              backgroundColor: supplyState ? "rgba(0, 170, 255, 0.1)" : "#eee",
              transition: "color 0.3s ease",
            }}
          />
          <div className="con">
            <p>
              Water Supply
            </p>
            <p
              style={{
                margin: 0,
                color: supplyState ? "rgb(0, 170, 255)" : "#666",
                transition: "color 0.3s ease",
              }}
            >
              {pumpLabel}
            </p>
          </div>
        </section>

               <section>
                 <Toggle 
                 state={supplyState}
                 disabled={false}
                callFunction={supply}/>
               </section>
            </div>
            </div>
    );
}

export default WaterSupply;