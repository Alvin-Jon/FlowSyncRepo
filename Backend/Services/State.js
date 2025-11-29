const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const WaterHistory = require('../Models/WaterHistory');


async function getUserState(userId) {
    try {
        const user = await User.findById(userId).populate('registeredDevices');
        if (!user) {
            throw new Error('User not found');
        }
        const device = await Device.findOne({ accountLinkedTo: userId }).populate('status.history');
        if (!device) {
            throw new Error('Device not found for user');
        }
        const waterHistory = await WaterHistory.findById(device.history);
        return {
            user,
            device,
            waterHistory,
        };
    } catch (error) {
        console.error('Error fetching user state:', error);
        throw error;
    }
}

async function getDeviceState(deviceId) {
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }
        Status = device.status;
        return Status;
    } catch (error) {
        console.error('Error fetching device state:', error);
        throw error;
    }
} 

async function getEmailByDeviceId(deviceId) {
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }
        const user = await User.findById(device.accountLinkedTo);
        if (!user) {
            throw new Error('User not found');
        }
        return user.Email;
    } catch (error) {
        console.error('Error fetching email by device ID:', error);
        throw error;
    }
}

module.exports = { getUserState, getDeviceState, getEmailByDeviceId };