const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Import Models
const School = require('./models/school');
const Uniform = require('./models/uniform');

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Connected!'))
  .catch(err => console.log(err));

const uploadImageToCloudinary = async (filename) => {
  try {
    const filePath = path.join(__dirname, 'uniformImages_local', filename);
    // Upload logic
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'school-uniforms', // Takes care of organization
      use_filename: true,
      unique_filename: false, // Keeps "shirt.jpg" as name if possible
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    return ""; // Return empty string if upload fails
  }
};

const importData = async () => {
  try {
    const workbook = XLSX.readFile(path.join(__dirname, 'uniform_data.xlsx'));
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    console.log("👀 First Row Look:", rawData[0]);
    console.log(`Processing ${rawData.length} items...`);

    // 1. DEFINE CACHE OUTSIDE THE LOOP (Crucial Fix)
    const uploadedFilesCache = {};

    // 2. SINGLE LOOP
    for (const row of rawData) {
      
      // Validation Check
      if (!row.SchoolName || !row.Category) {
        console.warn("⚠️ Skipping row missing SchoolName or Category");
        continue;
      }

      let cloudUrl = "";

      // 3. SMART UPLOAD LOGIC
      if (row.Image) {
        // Check cache first
        if (uploadedFilesCache[row.Image]) {
          console.log(`♻️ Reusing URL for ${row.Image}`);
          cloudUrl = uploadedFilesCache[row.Image];
        } else {
          // Not in cache? Upload it.
          console.log(`☁️ Uploading NEW image: ${row.Image}...`);
          cloudUrl = await uploadImageToCloudinary(row.Image);
          
          // Save valid URL to cache
          if (cloudUrl) {
            uploadedFilesCache[row.Image] = cloudUrl;
          }
        }
      }

      // 4. Find/Create School
      const school = await School.findOneAndUpdate(
        { name: row.SchoolName },
        { $setOnInsert: { name: row.SchoolName, location: row.Location || 'Unknown' } },
        { new: true, upsert: true }
      );

      // 5. Create/Update Uniform
      const existingItem = await Uniform.findOne({
        schoolId: school._id,
        category: row.Category,
        season: row.Season || 'All'
      });

      const sizeValue = row.Size ? row.Size.toString() : "Free Size";
      const priceValue = row.Price || 0;
      const newPriceObject = { size: sizeValue, price: priceValue };

      if (existingItem) {
        // Add price if this size doesn't exist yet
        if (!existingItem.pricing.some(p => p.size === newPriceObject.size)) {
          existingItem.pricing.push(newPriceObject);
          // If we have a new image and the existing item didn't have one, update it
          if (!existingItem.imageUrl && cloudUrl) existingItem.imageUrl = cloudUrl;
          await existingItem.save();
        }
      } else {
        await Uniform.create({
          schoolId: school._id,
          category: row.Category,
          season: row.Season || 'All',
          tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [], // Added trim() for cleaner tags
          imageUrl: cloudUrl,
          pricing: [newPriceObject]
        });
      }
    }

    console.log("✅ Done populating!");
    process.exit();

  } catch (err) {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  }
};

importData();