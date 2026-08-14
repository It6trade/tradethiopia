// models/AssetCategory.js
const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory' },
});

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
module.exports = AssetCategory;