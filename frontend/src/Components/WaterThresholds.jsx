import { useState, useEffect } from "react";

const WaterThresholds = ({minLevel, maxLevel, setNewStatus }) => {
    const [lowerLimit, setLowerLimit] = useState(minLevel);
    const [upperLimit, setUpperLimit] = useState(maxLevel);

    useEffect(() => {
        setNewStatus(prevStatus => ({
            ...prevStatus,
            waterThreshold: {
                minLevel: Number(lowerLimit),
                maxLevel: Number(upperLimit)
            }
        }));
    }, [lowerLimit, upperLimit]);

    return (
        <div className="card threshold">
            <h2>Water Level Thresholds</h2>

            <section className="threshold-section">
                <div>
                    <p>Lower Limit (Pump ON)</p>
                    <p>{lowerLimit}%</p>
                </div>
                <input type="range" min="0" max="100" value={lowerLimit} onChange={(e) => setLowerLimit(e.target.value)}/>
                <p className="instruct">Pump will automatically turn ON when the water level drops below this threshold</p>
            </section>


            <section className="threshold-section">
                <div>
                    <p>Upper Limit (Pump OFF)</p>
                    <p>{upperLimit}%</p>
                </div>
                <input type="range" min="0" max="95" value= {upperLimit} onChange={(e) => setUpperLimit(Math.max(Number(lowerLimit), Number(e.target.value)))} />
                <p className="instruct">Pump will automatically turn OFF when the water level drops below this threshold</p>
            </section>
        </div>
    )
}

export default WaterThresholds;