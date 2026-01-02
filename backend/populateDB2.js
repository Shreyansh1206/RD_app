require('dotenv').config();
const mongoose = require('mongoose');

// --- Import Your Models ---
const School = require('./models/school');
const Uniform = require('./models/uniform');
const Pricing = require('./models/pricing');         
const BasePricing = require('./models/basePricing'); 

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uniform_db'; 

// --- DUMMY DATA HELPERS ---
const NUM_SCHOOLS = 5; 
const LOCATIONS = ['Delhi', 'Mumbai', 'Bangalore', 'Lucknow', 'Pune', 'Noida'];
// Added 'Tunics' to match your frontend list
const CATEGORIES = ['Shirt', 'Trousers', 'Skirt', 'Blazer', 'Tie', 'Socks', 'Tracksuit', 'T-Shirt', 'Belt', 'Tunics']; 
const SEASONS = ['Summer', 'Winter', 'All'];
const TYPES = ['Sport Wear', 'House Dress', 'Normal Dress', 'Miscellaneous'];

const getDummyImage = (text) => `https://placehold.co/600x400?text=${encodeURIComponent(text)}`;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- LOGIC: GENERATE VALID CLASS GROUPS ---
const generateClassGroups = () => {
  const groups = [];
  let currentStart = 1;
  const maxClass = 12;

  while (currentStart <= maxClass) {
    let jump = getRandomInt(2, 4); 
    let currentEnd = currentStart + jump;
    if (currentEnd > maxClass) currentEnd = maxClass;
    groups.push({ start: currentStart, end: currentEnd });
    currentStart = currentEnd + 1;
  }
  return groups;
};

// --- MAIN SEED FUNCTION ---
const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    // 1. CLEAR EXISTING DATA
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      School.deleteMany({}),
      Uniform.deleteMany({}),
      Pricing.deleteMany({}),
      BasePricing.deleteMany({})
    ]);

    // 2. CREATE BASE PRICING TEMPLATES (UPDATED)
    console.log('📝 Creating Base Pricing Templates per Category...');
    
    const basePricingDocs = [];

    // Loop through EVERY category to ensure we have templates for the frontend dropdown
    for (const cat of CATEGORIES) {
        
        // Template A: Standard
        basePricingDocs.push({
            category: cat, // <--- NEW: Stores the category
            tags: ['Standard', 'Cotton'],
            basePriceData: [
                { size: '28', price: 400 }, 
                { size: '30', price: 420 }, 
                { size: '32', price: 440 }
            ]
        });

        // Template B: Premium
        basePricingDocs.push({
            category: cat, // <--- NEW: Stores the category
            tags: ['Premium', 'Polyester'],
            basePriceData: [
                { size: '28', price: 600 }, 
                { size: '30', price: 650 }, 
                { size: '32', price: 700 }
            ]
        });
        
        // Template C: Organic (Just for variety)
        basePricingDocs.push({
            category: cat,
            tags: ['Organic', 'Soft'],
            basePriceData: [
                { size: '28', price: 800 }, 
                { size: '30', price: 850 }, 
                { size: '32', price: 900 }
            ]
        });
    }

    await BasePricing.insertMany(basePricingDocs);

    // 3. GENERATE SCHOOLS
    console.log(`🏫 Generating ${NUM_SCHOOLS} Schools...`);
    const schools = [];
    for (let i = 1; i <= NUM_SCHOOLS; i++) {
      schools.push({
        name: `Dummy School ${i} - ${getRandomElement(LOCATIONS)}`,
        location: getRandomElement(LOCATIONS),
        bannerImage: getDummyImage(`School ${i} Banner`)
      });
    }
    const createdSchools = await School.insertMany(schools);

    // 4. GENERATE UNIFORMS & MULTIPLE PRICING VARIANTS
    console.log(`👕 Generating Uniforms with Multiple Pricing Structures...`);
    
    const uniformDocs = [];
    const pricingDocs = [];

    // Define Variant Presets to create realistic "Standard vs Premium" scenarios
    const variantPresets = [
        { tags: ['Standard', 'Cotton'], multiplier: 1.0 },
        { tags: ['Premium', 'Matty Cloth'], multiplier: 1.4 },
        { tags: ['Super Soft', 'Organic'], multiplier: 1.8 }
    ];

    for (const school of createdSchools) {
      // Step A: Generate specific class groups for THIS school
      const schoolClassGroups = generateClassGroups();

      // Step B: For each class group, create a set of uniforms
      for (const group of schoolClassGroups) {
        
        const itemsToCreate = getRandomInt(3, 5); 

        for (let k = 0; k < itemsToCreate; k++) {
            const category = getRandomElement(CATEGORIES);
            const type = getRandomElement(TYPES);
            const season = getRandomElement(SEASONS);
            
            const uniformId = new mongoose.Types.ObjectId();

            // Create 1 Uniform
            const uniformObj = {
              _id: uniformId,
              schoolId: school._id,
              season: season,
              category: category,
              class: { start: group.start, end: group.end },
              type: type,
              imageUrl: getDummyImage(`${category} (${group.start}-${group.end})`),
              extraInfo: 'Machine wash cold.'
            };
            uniformDocs.push(uniformObj);

            // --- ONE-TO-MANY LOGIC STARTS HERE ---
            // Decide how many variants this uniform has (1, 2, or 3)
            const numVariants = getRandomInt(1, 3);
            
            const selectedPresets = variantPresets.slice(0, numVariants);

            for (const preset of selectedPresets) {
                // Generate numerical sizes
                const baseSize = getRandomInt(24, 34);
                const basePrice = getRandomInt(300, 500); 

                const priceData = [
                    { 
                        size: (baseSize).toString(), 
                        price: Math.floor(basePrice * preset.multiplier) 
                    },
                    { 
                        size: (baseSize + 2).toString(), 
                        price: Math.floor((basePrice + 50) * preset.multiplier) 
                    },
                    { 
                        size: (baseSize + 4).toString(), 
                        price: Math.floor((basePrice + 100) * preset.multiplier) 
                    }
                ];

                const pricingObj = {
                    uniform: uniformId, // Link to the same Uniform ID
                    tags: preset.tags,  // Distinct tags
                    priceData: priceData
                };
                pricingDocs.push(pricingObj);
            }
        }
      }
    }

    // Bulk Insert
    await Uniform.insertMany(uniformDocs);
    await Pricing.insertMany(pricingDocs); 
    
    console.log(`✅ Created ${uniformDocs.length} Uniforms.`);
    console.log(`✅ Created ${pricingDocs.length} Pricing Variants.`);
    console.log(`✅ Created ${basePricingDocs.length} Base Pricing Templates.`);
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();