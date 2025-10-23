import { User} from "lucide-react";

const Account = ({name, email, phoneNumber}) => {
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid grey",
    color: "grey",
  };

  return (
    <div className="device-setup card auto left settings">
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
        <User/> Account
      </h2>

      <div>
        <p style={{ marginBottom: "12px", fontWeight: "bold" }}>Email Address</p>
        <input
          type="text"
          value={email}
          placeholder="Enter Email"
          disabled
          style={inputStyle}
        />
      </div>


      <div style={{ marginTop: "30px" }}>
        <p style={{ marginBottom: "12px", fontWeight: "bold" }}>User's Name</p>
        <input
          type="text"
          value={name}
          placeholder="Enter Name"
          disabled
          style={inputStyle}
        />
      </div>

      <div style={{ marginTop: "30px" }}>
        <p style={{ marginBottom: "12px", fontWeight: "bold" }}>Phone Number</p>
        <input
          type="number"
          value={phoneNumber}
          placeholder="Enter valid Phone Number"
          style={inputStyle}
        />
      </div>
    </div>
  );
};

export default Account;
