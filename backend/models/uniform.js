const mongoose = require('mongoose');

const uniformSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', // This links the uniform to a specific School
    required: true
  },
  category: {
    type: String,
    required: true // e.g., "Shirt", "Pant", "Skirt"
  },
  season: {
    type: String,
    enum: ['Summer', 'Winter', 'All'],
    required: true,
    default: 'All'
  },
  class: {
    start: { type: Number, required: true, default: -3 }, // e.g. 1
    end: { type: Number, required: true, default: 12 }    // e.g. 5
  },
  type: {
    type: String,
    enum: ['Sport Wear', 'House Dress', 'Normal Dress', 'Miscellaneous'],
    default: 'Normal Dress',
    required: true
  },
  imageUrl: { type: String }, // Image for this specific item
  extraInfo: { type: String }, // e.g., "Wash cold only"
});

module.exports = mongoose.model('Uniform', uniformSchema);