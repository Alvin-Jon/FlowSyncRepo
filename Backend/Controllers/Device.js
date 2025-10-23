const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const { getIO, getDeviceMap } = require('../Config/Socket');

const io = getIO();
const deviceSocketMap = getDeviceMap();



