function alertFrontend(deviceId, eventName, payload = {}) {
  const { getIO, getDeviceMap } = require('../Config/Socket');
  const io = getIO();
  const deviceMap = getDeviceMap();
  const socketSet = deviceMap.get(deviceId);

  if (!socketSet) return;

  socketSet.forEach(socketId => {
    io.to(socketId).emit(eventName, payload);
  });
}

module.exports = { alertFrontend };
