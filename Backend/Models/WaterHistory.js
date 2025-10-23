const mongoose = require('mongoose');
const { Schema } = mongoose;

const WaterHistorySchema = new Schema({
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  logs: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('WaterHistory', WaterHistorySchema);
