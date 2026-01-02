const Uniform = require('../models/uniform');
const Pricing = require('../models/pricing');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../utils/cloudinaryDeleteHelper');
const {body, validationResult} = require("express-validator");
const School = require('../models/school');

exports.uniformList = async (req, res) => {
  try {
    const uniforms = await Uniform.find().populate('schoolId');
    res.json(uniforms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUniform = [
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage("School Name is required"),

  body('schoolLocation')
    .optional()
    .trim(),

  body('season')
    .trim()
    .isIn(['Summer', 'Winter', 'All'])
    .withMessage("Season must be Summer, Winter or All"),

  body('category')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage("Category is required"),

  body('type')
    .trim()
    .isIn(['Sport Wear', 'House Dress', 'Normal Dress', 'Miscellaneous', 'Winter Wear', 'Accessory'])
    .withMessage("Invalid Uniform Type"),

  body('classMin')
    .toInt()
    .isInt()
    .withMessage("Class Start must be a number"),

  body('classMax')
    .toInt()
    .isInt()
    .withMessage("Class End must be a number"),

  body('extraInfo')
    .optional()
    .trim()
    .escape(),

  // 2. Controller Logic
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      // Clean up file if validation fails
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    try{
      const { schoolName, schoolLocation, season, category, type, classMin, classMax, extraInfo } = req.body;
      
      let targetSchoolId;

      // STEP 1: Find or Create School based on Name
      let school = await School.findOne({ name: schoolName });
      
      if (school) {
        // School exists -> Use its ID
        targetSchoolId = school._id;
      } else {
        // School does not exist -> Create it
        school = new School({
          name: schoolName,
          // Only use location if creating a NEW school
          location: schoolLocation || '' 
        });
        await school.save();
        targetSchoolId = school._id;
      }

      // STEP 2: Create Uniform linked to that School ID
      const newUniform = new Uniform({
        schoolId: targetSchoolId,
        season,
        category,
        type,
        class: {
            start: classMin,
            end: classMax
        },
        extraInfo,
        imageUrl: req.file ? req.file.path : null
      })
      
      await newUniform.save();

      res.status(201).json({
        message: "Uniform created successfully",
        uniform: newUniform,
        schoolId: targetSchoolId // Returning this for confirmation
      });

    } catch(err){
      console.error("Create Uniform Error:", err); 
      // Clean up file if database operation fails
      if (req.file) await deleteFromCloudinary(req.file.path);
      res.status(500).json({ message: err.message });
    }
  }
];

exports.getUniformById = async(req, res) =>  {
  try {
    const { uniformId } = req.params;
    const uniform = await Uniform.findById(uniformId).populate('schoolId');
    if (!uniform) {
      return res.status(404).json({ message: "Uniform not found" });
    }
    res.json(uniform);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listUniformsBySchool = async(req, res) => {
  try {
    const { schoolId } = req.params;

    let query = { schoolId: schoolId };

    const uniforms = await Uniform.find(query);
    res.json(uniforms);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUniform = [
  (req, res, next) => {
    try {
      if (req.body.tags && typeof req.body.tags === 'string') {
        req.body.tags = JSON.parse(req.body.tags);
      }
      if (req.body.pricing && typeof req.body.pricing === 'string') {
        req.body.pricing = JSON.parse(req.body.pricing);
      }
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return res.status(400).json({ message: "Invalid JSON format for tags or pricing" });
    }
    next();
  },

  body('schoolName')
    .trim().isLength({ min: 1 }).escape().withMessage("School name is required"),

  body('season')
    .trim()
    .isIn(['Summer', 'Winter', 'All'])
    .withMessage("Season must be Summer, Winter or All"),

  body('category')
    .trim().isLength({ min: 1 }).escape().withMessage("Category is required"),

  body('extraInfo').optional().trim().escape(),

  body('tags').optional().isArray().withMessage("Tags must be an array"),
  body('tags.*').isString().trim().notEmpty().escape(),

  body('pricing').optional().isArray().withMessage("Pricing must be an array"),
  body('pricing.*.size').exists().isString().trim().notEmpty().withMessage("Size is required"),
  body('pricing.*.price').toFloat().isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { schoolName, season, category, extraInfo, tags, pricing } = req.body;
      const uniformId = req.params.uniformId;

      const uniform = await Uniform.findById(uniformId);
      if (!uniform) {
        // cleanup image if uniform doesn't exist
        if (req.file) await deleteFromCloudinary(req.file.path);
        return res.status(404).json({ message: "Uniform not found" });
      }

      let school = await School.findOne({ name: schoolName });
      let isNewSchool = false;
      
      if (!school) {
        school = new School({
          name: schoolName,
          location: "",
          bannerImage: ""
        });
        await school.save();
        isNewSchool = true;
        console.log(`Auto-created new school during update: ${schoolName}`);
      }

      if (req.file) {
        if (uniform.imageUrl) {
          await deleteFromCloudinary(uniform.imageUrl);
        }
        uniform.imageUrl = req.file.path;
      }

      uniform.schoolId = school._id; 
      uniform.season = season;
      uniform.category = category;
      uniform.extraInfo = extraInfo;
      uniform.tags = tags;
      uniform.pricing = pricing;

      await uniform.save();

      res.json({
        message: "Uniform updated successfully",
        uniform: uniform,
        schoolCreated: isNewSchool
      });

    } catch (err) {
      console.error("Update Uniform Error:", err);
      if (req.file) await deleteFromCloudinary(req.file.path);
      res.status(500).json({ message: err.message });
    }
  }
];

exports.deleteUniform = async (req, res) => {
  try {
    const uniformId = req.params.uniformId;
    const uniform = await Uniform.findById(uniformId);
    if (!uniform) {
      return res.status(404).json({ message: "Uniform not found" });
    }

    await Pricing.deleteMany({ uniform: uniformId });

    if (uniform.imageUrl) {
      await deleteFromCloudinary(uniform.imageUrl);
    }

    await uniform.deleteOne();
    res.json({ 
        message: "Uniform and all associated pricing structures deleted successfully" 
    });

  } catch (err) {
    console.error("Delete Uniform Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// unprotected routes
exports.uniformCount   = async (req, res) => {
  try {
    const count = await Uniform.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};