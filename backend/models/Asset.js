const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true }, // New name attribute
  nameTag: { type: String, required: true }, // Ensure this is unique
  assets: { type: String, required: true },
  location: { type: String, required: true },
  assignedTo: { type: String, required: true },
  status: { type: String, required: true, enum: ['Active', 'Inactive', 'Under Maintenance'] },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  dateAcquired: { type: Date, required: true },
  description: { type: String }
});

const Asset = mongoose.model('Asset', AssetSchema);
module.exports = Asset;