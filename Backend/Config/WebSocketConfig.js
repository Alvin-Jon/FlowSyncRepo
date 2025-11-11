const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) return WebSocketService.instance;
    this.wss = null;
    this.esp32SocketMap = new Map();
    WebSocketService.instance = this;
  }

  static getInstance() {
    if (!WebSocketService.instance) WebSocketService.instance = new WebSocketService();
    return WebSocketService.instance;
  }

  init(server, path = "/ws") {
    if (this.wss) return this.wss;

    this.wss = new WebSocket.Server({ noServer: true, path });
    console.log(`✅ Native WS server running on ${path}`);

    this.wss.on("connection", (ws) => {
      console.log("🔌 ESP32 connected");

      ws.on("message", async (data) => {
        await this.handleMessage(ws, data);
      });

      ws.on("close", () => this.handleDisconnect(ws));
      ws.on("error", (err) => console.error(err));
    });

    return this.wss;
  }

  async handleMessage(ws, data) {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "register-device") {
        ws.deviceId = msg.deviceId;
        this.esp32SocketMap.set(msg.deviceId, ws);
        console.log(`✅ Device registered (ESP32): ${msg.deviceId}`);
      }
    } catch (err) {
      console.error("Invalid WS message:", err);
    }
  }

  handleDisconnect(ws) {
    if (ws.deviceId) {
      this.esp32SocketMap.delete(ws.deviceId);
      console.log(`❌ ESP32 disconnected: ${ws.deviceId}`);
    }
  }

  sendToESP32(deviceId, message) {
    const ws = this.esp32SocketMap.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    console.warn(`⚠️ ESP32 ${deviceId} not connected`);
    return false;
  }
}

module.exports = WebSocketService;
