// Controllers/Esp32.js
const WebSocketService = require("../Config/WebSocketConfig");
const wsService = WebSocketService.getInstance();

exports.notifyESP32 = (deviceId, payload) => {
  try {
    // Check if device is connected first
    if (!wsService.isDeviceConnected(deviceId)) {
      console.warn(`⚠️ ESP32 ${deviceId} is not connected, command will not be sent`);
      return false;
    }

    const success = wsService.sendToESP32(deviceId, {
      type: "command",
      payload,
      timestamp: Date.now(),
    });

    if (success) {
      console.log(`📡 Sent command to ESP32 ${deviceId}:`, payload);
      return true;
    } else {
      console.warn(`⚠️ Failed to send command to ESP32 ${deviceId}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error notifying ESP32:", error.message);
    return false;
  }
};
