import { Power } from "lucide-react";
import Toggle from "./Toggle";
import socket from "../Socket";


const Water_Pump = ({ sendNotification, setDeviceDetails, deviceDetails,pumpState, autoState }) => {

  const manualPump = async (newState) => {
    socket.emit("update-pump-status", {
      deviceId: deviceDetails.Details.device.nameId,
      pumpStatus: newState,
      autoStatus: autoState,
    });
    setDeviceDetails((prev) => ({
    ...prev, 
    Details: {
      ...prev.Details,
      device: {
        ...prev.Details.device,
        status: {
          ...prev.Details.device.status,
          waterpumpStatus: newState, // 👈 update only this field
        },
      },
    },
}));

  // ... LATER STUFFS TO UPDATE STATE FROM BACKEND
     const status = newState ? 'ON' : 'OFF';
     sendNotification('Manual Pump', `The Pumping Machine has been turned ${status}`, 'info');
  };

const autoPump = async (newState) => {
  socket.emit("update-pump-status", {
      deviceId: deviceDetails.Details.device.nameId,
      pumpStatus: pumpState,
      autoStatus: newState
    });
  setDeviceDetails((prev) => ({
    ...prev, 
    Details: {
      ...prev.Details,
      device: {
        ...prev.Details.device,
        status: {
          ...prev.Details.device.status,
          autoPump: newState, // 👈 update only this field
        },
      },
    },
}));

  // ... LATER STUFFS TO UPDATE STATE FROM BACKEND

     const status = newState ? 'enabled' : 'disabled';
     sendNotification('Auto Pump', `Auto Pump has been ${status}`, 'info');
};






  // Determine pump label & color based on state
  const pumpLabel = pumpState ? "ON - Manual" : "OFF - Manual";
  const isPumpActive = pumpState && !autoState;

  return (
    <div className="water-pump card auto">
      {/* --- Manual Pump Section --- */}
      <div className="auto-hd">
        <section>
          <Power
            style={{
              color: isPumpActive ? "rgb(0, 170, 255)" : "#999",
              backgroundColor: isPumpActive ? "rgba(0, 170, 255, 0.1)" : "#eee",
              transition: "color 0.3s ease",
            }}
          />
          <div className="con">
            <p>
              Water Pump
            </p>
            <p
              style={{
                margin: 0,
                color: isPumpActive ? "rgb(0, 170, 255)" : "#666",
                transition: "color 0.3s ease",
              }}
            >
              {pumpLabel}
            </p>
          </div>
        </section>

        <section>
          {/* Disable manual toggle when auto mode is active */}
          <Toggle
            state={pumpState}
            disabled={autoState}
            callFunction={manualPump}
          />
        </section>
      </div>

      <hr style={{ marginTop: "20px" }} />

      {/* --- Auto Mode Section --- */}
      <div className="auto-hd" style={{ marginTop: "20px" }}>
        <p>Auto Mode</p>
        <Toggle
          state={autoState}
          disabled={false}
          callFunction={autoPump}
        />
      </div>
    </div>
  );
};

export default Water_Pump;
