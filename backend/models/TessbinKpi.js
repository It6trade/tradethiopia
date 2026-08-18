const mongoose = require('mongoose');

const tessbinKpiSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Academic',
      trim: true,
    },
    timeframe: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'monthly',
      index: true,
    },
    targetValue: {
      type: Number,
      required: true,
      default: 10,
    },
    actualValue: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'Students',
      trim: true,
    },
    weight: {
      type: Number,
      default: 25,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TessbinKpi', tessbinKpiSchema);
