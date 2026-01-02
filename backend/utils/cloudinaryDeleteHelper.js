const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const extractPublicId = (url) => {
  if (!url) return null;
  const regex = /\/v\d+\/(.+)\.[^.]+$/;
  const match = url.match(regex);

  return match ? match[1] : null;
};

const deleteFromCloudinary = async (identifier) => {
  try {
    if (!identifier) return;

    // Check if it's a URL and extract ID, otherwise treat as ID
    const publicId = identifier.startsWith('http') ? extractPublicId(identifier) : identifier;

    if (!publicId) {
       console.warn("Cloudinary Delete Skipped: Could not extract publicId from:", identifier);
       return;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary Delete Result:", result);
    return result;
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    // We generally don't throw here to prevent stopping the DB delete if the image fails
  }
};

module.exports = { deleteFromCloudinary };