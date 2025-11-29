function alertFrontend(deviceId, eventName, payload = {}) {
  const { getIO, getDeviceMap } = require('../Config/Socket');
  const io = getIO();
  const deviceMap = getDeviceMap();
  const socketId = deviceMap.get(deviceId);

  if (socketId) {
    io.to(socketId).emit(eventName, payload);
  }
}

module.exports = { alertFrontend };
