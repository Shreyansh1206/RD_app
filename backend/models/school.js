const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  location: {type: String, default: ""}, 
});

module.exports = mongoose.model('School', schoolSchema);