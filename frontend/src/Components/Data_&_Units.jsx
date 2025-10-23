import { Database } from "lucide-react";
import { useState, useEffect } from "react";
import Toggle from "./Toggle";

const Data_and_Units = ({ sync, unit, setNewStatus }) => {
  // Ensure selected always reflects the initial prop
  const [selected, setSelected] = useState(unit);
  const [dataSync, setDataSync] = useState(sync);

  useEffect(() => {
    setNewStatus((prevStatus) => ({
      ...prevStatus,
      unit: selected,
      dataSync: dataSync,
    }));
  }, [selected, dataSync]);

  return (
    <div className="settings data-setting card left auto">
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Database /> Data & Units
      </h2>

      {/* 🔹 Volume Unit Section */}
      <div className="data-method auto-hd">
        <div className="con">
          <p style={{ fontWeight: "bold" }}>Volume Unit</p>
          <p style={{ color: "grey" }}>Litres / Gallons </p>
        </div>

        <select
          id="measurement"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="dropdown"
        >
          <option value="Litres">Litres</option>
          <option value="Gallons">Gallons</option>
          <option value="Millilitres">Millilitres</option>
        </select>
      </div>

      {/* 🔹 Data Sync Section */}
      <div className="data-method auto-hd">
        <div className="con">
          <p style={{ fontWeight: "bold" }}>Data Sync</p>
          <p style={{ color: "grey" }}>Auto Sync to Cloud</p>
        </div>

        <Toggle state={dataSync} setParentState={setDataSync}/>
      </div>
    </div>
  );
};

export default Data_and_Units;
