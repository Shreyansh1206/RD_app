const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  location: {type: String, default: ""}, 
  bannerImage: { 
    type: String, 
    default: "" //Cloudinary URL here
  } 
});

module.exports = mongoose.model('School', schoolSchema);