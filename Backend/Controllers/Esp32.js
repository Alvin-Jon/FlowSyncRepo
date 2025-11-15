// Controllers/Esp32.js
const WebSocketService = require("../Config/WebSocketConfig");
const wsService = WebSocketService.getInstance();

exports.notifyESP32 = (deviceId, payload) => {
  try {
    const success = wsService.sendToESP32(deviceId, {
      type: "command",
      payload,
      timestamp: Date.now(),
    });

    if (success) {
      console.log(`📡 Sent message to ESP32 ${deviceId}:`, payload);
    } else {
      console.warn(`⚠️ Could not send message, ESP32 ${deviceId} not connected`);
    }
  } catch (error) {
    console.error("Error notifying ESP32:", error);
  }
};
