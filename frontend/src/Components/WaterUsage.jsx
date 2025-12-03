import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const WaterUsage = (usage) => {
  const data = usage.usage || [];
    return (
    <div className="card" style={{ width: "100%", height: "350px", marginTop: "40px", padding: "20px", paddingBottom: "50px" }}>
      <h3 style={{ textAlign: "left", marginBottom: "1rem" }}>Average Daily Water Usage (L)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="day" stroke="var(--text-color)" />
          <YAxis stroke="var(--text-color)" />
          <Tooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderRadius: "10px", border: "1px solid var(--border-color)" }} />
          <Line
            type="monotone"
            dataKey="usage"
            stroke="var(--accent-color)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    )
}

export default WaterUsage;