const mongoose = require('mongoose');
const { Schema } = mongoose;


const UserSchema = new Schema({
    Username: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    PhoneNumber: {type: Number, required: false},
    Authenticated: { type: Boolean, default: true },
    AuthorisedPasswordReset : {type: Boolean, default: false},
    registeredDevices: { type: Schema.Types.ObjectId, ref: 'Device', unique: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);