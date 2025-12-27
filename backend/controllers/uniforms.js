const Uniform = require('../models/uniform')
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('../utils/cloudinaryDeleteHelper');
const {body, validationResult} = require("express-validator");
const School = require('../models/school');

exports.uniform_list = async (req, res) => {
  res.send("NOT IMPLEMENTED");
};

exports.createUniform = [
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
  .trim()
  .isLength({min: 1})
  .escape()
  .withMessage("School name is required"),

  body('season')
  .trim()
  .isIn(['Summer', 'Winter', 'All'])
  .withMessage("Season must be Summer, Winter or All"),

  body('category')
  .trim()
  .isLength({min: 1})
  .escape()
  .withMessage("Category is required"),

  body('extraInfo')
  .optional()
  .trim()
  .escape(),

  body('tags')
  .optional()
  .isArray()
  .withMessage("Tags must be an array"),

  body('tags.*')
  .isString()
  .trim()
  .notEmpty()
  .escape(),

  body('pricing')
  .optional()
  .isArray()
  .withMessage("Pricing must be an array"),

  body('pricing.*.size')
  .exists()
  .isString()
  .trim()
  .notEmpty()
  .withMessage("Size is required"),

  body('pricing.*.price')
  .toFloat()
  .isFloat({ min: 0 })
  .withMessage("Price must be a positive number"),

  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      if (req.file) await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }
    let uniformSaved = false;

    try{
      const { schoolName, season, category, extraInfo, tags, pricing } = req.body;
      let school = await School.findOne({name: schoolName})
      let isNewSchool = false;
      if(!school){
        school = new School({
          name: schoolName,
          location: "",
          bannerImage: ""
        })
        await school.save();
        isNewSchool = true;
        console.log(`Auto-created new school: ${schoolName}`);
      }

      const newUniform = new Uniform({
        schoolId: school._id,
        season,
        category,
        extraInfo,
        tags,
        pricing,
        imageUrl: req.file ? req.file.path : null
      })
      await newUniform.save();
      uniformSaved = true;

      res.status(201).json({
        message: "Uniform created successfully",
        uniform: newUniform,
        schoolCreated: isNewSchool // Flag to tell frontend if a new school was generated
      });
    }catch(err){
      console.error("Create Uniform Error:", err); 
      if (!uniformSaved && req.file) await deleteFromCloudinary(req.file.path);
      res.status(500).json({ message: err.message });
    }

  }
];

exports.getUniformById = async(req, res) =>  {
  try {
    const { id } = req.params;
    const uniform = await Uniform.findById(id).populate('schoolId');
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
    const { season } = req.query;

    let query = { schoolId: schoolId };
    if(season){
      query.season = { $in: [season, 'All'] }
    }

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
      const uniformId = req.params.id;

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

exports.deleteUniform = async(req, res) => {
 try {
    const uniform = await Uniform.findById(req.params.id);
    if (!uniform) {
      return res.status(404).json({ message: "Uniform not found" });
    }

    // 2. Delete the image from Cloudinary
    if (uniform.imageUrl) {
      await deleteFromCloudinary(uniform.imageUrl);
    }
    await uniform.deleteOne(); 
    res.json({ message: "Uniform and associated image deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};