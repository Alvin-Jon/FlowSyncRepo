import { useEffect, useState } from "react";
import "./WaterTank.css";

const WaterTank = ({ targetLevel}) => {
  const [displayLevel, setDisplayLevel] = useState(0);

  useEffect(() => {
    // Animate from current  to target level gradually
    let current = 0;
    const step = () => {
      current += 1;
      setDisplayLevel(current);
      if (current < targetLevel) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [targetLevel]);

  return (
    <div className="tank-container">
      <div className="tank">
        <div className="water wave" style={{ height: `${displayLevel}%` }} />
        <div className="percentage">{displayLevel}%</div>
      </div>
    </div>
  );
};

export default WaterTank;
