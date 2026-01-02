const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  uniform: { type: mongoose.Schema.Types.ObjectId, ref: 'Uniform', required: true },
  tags: [{ type: String }], 
  priceData: [{
    size: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  basePricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'BasePricing', default: null }
});

module.exports = mongoose.model('Pricing', pricingSchema);
