const School = require('../models/school');
const Uniform = require('../models/uniform');
const { deleteFromCloudinary } = require('../utils/cloudinaryDeleteHelper');
const { body, validationResult } = require("express-validator");

exports.school_list = async (req, res) => {
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
      
      const bannerImageUrl = req.file ? req.file.path : "";
      const school = new School({
        name: req.body.name,
        location: req.body.location,
        bannerImage: bannerImageUrl
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
    // finding school by id
    const schoolId = req.params.schoolId;
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // deleting school banner from cloudinary
    if (school.bannerImage) {
      console.log("Deleting School Banner...");
      await deleteFromCloudinary(school.bannerImage);
    }

    // deleting associated uniforms and images from cloudinary
    const uniforms = await Uniform.find({ school: schoolId });

    if (uniforms.length > 0) {
      console.log(`Found ${uniforms.length} uniforms. Deleting images...`);
      const imageDeletePromises = uniforms
        .filter(uniform => uniform.imageUrl) // Only those with images
        .map(uniform => deleteFromCloudinary(uniform.imageUrl));
      
      await Promise.all(imageDeletePromises);
    }

    await Uniform.deleteMany({ school: schoolId });

    // deleting school record from database
    await school.deleteOne();
    res.json({ 
      message: "School, all associated uniforms, and all images deleted successfully." 
    });

  } catch (err) {
    console.error("Delete School Error:", err);
    res.status(500).json({ message: "Server error while deleting school." });
  }
};