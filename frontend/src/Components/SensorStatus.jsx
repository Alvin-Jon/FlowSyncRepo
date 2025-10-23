import { useState, useEffect } from "react";
import { Droplets, CheckCircle, Gauge, SignalHigh, Wifi, Activity } from "lucide-react";

const SensorStatus = ({ sensorData }) => {

  const [sensors, setSensors] = useState([
    { id: "TankLevelSensor", name: "Tank Level Sensor", description: "", status: "", icon: Gauge },
    { id: "FlowSensor", name: "Flow Sensor", description: "", status: "", icon: Activity },
    { id: "LeakSensor", name: "Leak Detection", description: "", status: "", icon: Droplets },
    { id: "NetworkSensor", name: "Network Signal", description: "", status: "", icon: Wifi },
  ]);

  useEffect(() => {
    if (!sensorData) return;

    setSensors((prevSensors) =>
      prevSensors.map((sensor) => {
        const data = sensorData[sensor.id]?.[0];
        return {
          ...sensor,
          description: data?.description || sensor.description,
          status: data?.active ? "Active" : "Inactive",
        };
      })
    );
  }, [sensorData]);

  return (
    <div className="sensor-status">
      <h3 style={{ textAlign: "left", marginTop: "50px" }}>Sensor Status</h3>
      <hr style={{ marginTop: "20px", marginBottom: "30px" }} />

      {sensors.map(({ id, name, description, status, icon: Icon }) => (
        <div key={id} className="sensor-item card auto">
          <div className="auto-hd">
            <section style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Icon
                color={status === "Active" ? "green" : "gray"}
                size={32}
                strokeWidth={2}
                className={status}
              />
              <div className="con">
                <p style={{ fontWeight: "bold" }}>{name}</p>
                <p style={{ color: "grey" }}>{description}</p>
              </div>
            </section>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {status === "Active" ? (
                <CheckCircle style={{ color: "lime" }} />
              ) : (
                <SignalHigh style={{ color: "red" }} />
              )}
              <p style={{ color: status === "Active" ? "lime" : "red" }}>{status}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SensorStatus;
