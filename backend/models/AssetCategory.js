// models/AssetCategory.js
const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', index: true },
});

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
module.exports = AssetCategory;