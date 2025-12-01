import { Bell } from "lucide-react";
import Toggle from "./Toggle";
import { useEffect, useState } from "react";

const NotificationSetting = ({ items, setNewStatus }) => {
  const [notificationSettings, setNotificationSettings] = useState(items);

  useEffect(() => {
    setNewStatus((prevStatus) => ({
      ...prevStatus,
      notification: notificationSettings,
    }));
  }, [notificationSettings]);

  // 🔹 Handler to update one toggle
  const handleToggleChange = (id, newValue) => {
    setNotificationSettings((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, enabled: newValue } : item
      )
    );
  };

  return (
    <div className="settings notification-setting card left auto">
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        <Bell /> Notifications
      </h2>

      {notificationSettings.map((item) => (
        <div key={item._id} className="notification-method auto-hd">
          <div className="con">
            <p style={{ fontWeight: "bold" }}>{item.name}</p>

            {item.name === "Push Notifications" && (
              <p style={{ color: "grey" }}>Receive app push notifications</p>
            )}
            {item.name === "Email Notifications" && (
              <p style={{ color: "grey" }}>
                Receive email alerts for important updates and notifications
              </p>
            )}
            {item.name === "SMS Alerts" && (
              <p style={{ color: "grey" }}>Receive text messages</p>
            )}
          </div>

          {/* 🔹 Pass callback so Toggle can call it */}
          <Toggle
            state={item.enabled}
            setParentState={(newState) => handleToggleChange(item._id, newState)}
            pushNotify={item.name === "Push Notifications"}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationSetting;
