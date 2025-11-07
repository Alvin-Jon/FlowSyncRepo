import WaterTank from "./WaterTank";

const WaterLevel = ({level}) => {
  return (
    <div className="water-level card">
      <p style={{fontSize: "1.2rem", fontWeight:"bold", marginBottom: "20px"}}>Water Tank Level</p>
      <WaterTank targetLevel={level}/>
      <p style={{paddingTop : "20px"}}><span style={{color: "grey"}}>Current level :</span> {level}%</p>
    </div>
  );
}   

export default WaterLevel;