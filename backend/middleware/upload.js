const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage }); // This tells Multer to send files to Cloudinary

module.exports = upload;