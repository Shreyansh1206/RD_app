const School = require('../models/school');
const Uniform = require('../models/uniform');
const Pricing = require('../models/pricing');
const { deleteFromCloudinary } = require('../utils/cloudinaryDeleteHelper');
const { body, validationResult } = require("express-validator");

exports.schoolList = async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: err.message });
  };
};

exports.createSchool = [
  body('name')
  .trim()
  .isLength({min: 1})
  .withMessage("Name is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 

    try{
      const schoolExists = await School.findOne({name: req.body.name})
      .collation({ locale: "en", strength: 2 })
      .exec()

      if (schoolExists) {
        return res.status(400).json({ message: "School already exists" });
      }
      
      const school = new School({
        name: req.body.name,
        location: req.body.location,
      });

      const newSchool = await school.save();
      res.status(201).json(newSchool);

    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }
];

exports.updateSchool = [
  body('name')
  .trim()
  .isLength({min: 1})
  .withMessage("Name is required"),

  async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 

    try{
      const school = await School.findById(req.params.schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      if(req.file){
        if(school.bannerImage){
          await deleteFromCloudinary(school.bannerImage);
        }
        school.bannerImage = req.file.path;
      }

      school.name = req.body.name;
      school.location = req.body.location;
      
      const updatedSchool = await school.save();
      res.json(updatedSchool);
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }
];

exports.deleteSchool = async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const uniforms = await Uniform.find({ schoolId: schoolId });
    
    if (uniforms.length > 0) {
        const uniformIds = uniforms.map(u => u._id);

        console.log(`Found ${uniformIds.length} uniforms. Deleting associated pricing structures...`);
        await Pricing.deleteMany({ uniform: { $in: uniformIds } });

        console.log("Deleting uniform images...");
        const imageDeletePromises = uniforms
            .filter(uniform => uniform.imageUrl)
            .map(uniform => deleteFromCloudinary(uniform.imageUrl));
        
        await Promise.all(imageDeletePromises);

        await Uniform.deleteMany({ schoolId: schoolId });
    }

    await school.deleteOne();
    
    res.json({ 
      message: "School, associated uniforms, pricing structures, and images deleted successfully." 
    });

  } catch (err) {
    console.error("Delete School Error:", err);
    res.status(500).json({ message: "Server error while deleting school." });
  }
};

// unprotected routes
exports.schoolCount = async (req, res) => {
  try {
    const count = await School.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};