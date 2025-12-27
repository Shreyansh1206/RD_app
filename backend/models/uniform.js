const mongoose = require('mongoose');

const uniformSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', // This links the uniform to a specific School
    required: true
  },
  season: {
    type: String,
    enum: ['Summer', 'Winter', 'All'],
    required: true,
    default: 'All'
  },
  category: {
    type: String,
    required: true // e.g., "Shirt", "Pant", "Skirt"
  },
  imageUrl: { type: String }, // Image for this specific item
  extraInfo: { type: String }, // e.g., "Wash cold only"
  tags: {
    type: [String],
    index: true
  },
  pricing: [
    {
      size: { type: String, required: true }, // e.g., "32", "Medium"
      price: { type: Number, required: true }
    }
  ]
});

module.exports = mongoose.model('Uniform', uniformSchema);