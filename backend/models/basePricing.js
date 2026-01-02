const mongoose = require('mongoose');

const basePricingSchema = new mongoose.Schema({
  tags: [{ type: String }],
  category: { type: String, required: true },
  basePriceData: [{
    size: { type: String, required: true },
    price: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('BasePricing', basePricingSchema);