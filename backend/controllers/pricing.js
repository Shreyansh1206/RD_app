const Pricing = require('../models/pricing');
const Uniform = require('../models/uniform');
const {body, validationResult} = require("express-validator");

exports.pricingList = async(req, res) => {
    res.send("NOT IMPLEMENTED");
}

exports.getPricingById = async(req, res) => {
    try{
        const { pricingId } = req.params;
        const pricing = await Pricing.findById(pricingId);
        if (!pricing) {
            return res.status(404).json({ message: "Pricing not found" });
        }
        res.json(pricing);
    }catch(err){
        res.status(500).json({ message: err.message });
    }
}

exports.getPricingByUniform = async(req, res) => {
    try{
        const { uniformId } = req.params;
        const pricing = await Pricing.find({ uniform: uniformId });
        if (!pricing) {
            return res.status(404).json({ message: "Pricing not found" });
        }
        res.json(pricing);
    }catch(err){
        res.status(500).json({ message: err.message });
    }
}

exports.createPricing = [
  // Validation Middleware
  body('uniform')
    .trim()
    .isMongoId()
    .withMessage("Valid Uniform ID is required"),

  body('basePricingId')
    .optional({ nullable: true }) // Allows null (for custom/detached) or a value
    .isMongoId()
    .withMessage("Invalid Base Template ID"),

  body('tags')
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  
  body('tags.*')
    .isString()
    .trim()
    .escape(),

  body('priceData')
    .isArray({ min: 1 })
    .withMessage("Price data must be an array with at least one item"),

  body('priceData.*.size')
    .exists()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Size is required"),

  body('priceData.*.price')
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  // Controller Logic
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { uniform, tags, priceData, basePricingId } = req.body;

      // Verify Uniform exists
      const existingUniform = await Uniform.findById(uniform);
      if (!existingUniform) {
        return res.status(404).json({ message: "Uniform not found" });
      }

      const newPricing = new Pricing({
        uniform,
        tags,
        priceData,
        // Map frontend 'basePricingId' to database 'baseTemplate'
        basePricingId: basePricingId || null 
      });

      await newPricing.save();

      res.status(201).json({
        message: "Pricing structure created successfully",
        pricing: newPricing
      });

    } catch (err) {
      console.error("Create Pricing Error:", err);
      res.status(500).json({ message: err.message });
    }
  }
];

exports.updatePricing = [
  // Validation Middleware
  body('basePricingId')
    .optional({ nullable: true }) // Essential for detaching (setting to null)
    .isMongoId()
    .withMessage("Invalid Base Template ID"),

  body('tags')
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
  
  body('tags.*')
    .isString()
    .trim()
    .escape(),

  body('priceData')
    .isArray({ min: 1 })
    .withMessage("Price data must be an array with at least one item"),

  body('priceData.*.size')
    .exists()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Size is required"),

  body('priceData.*.price')
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  // Controller Logic
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Use 'id' from params (standard REST convention: /api/pricing/:id)
      const { pricingId } = req.params; 
      const { tags, priceData, uniform, basePricingId } = req.body;

      const updatedPricing = await Pricing.findByIdAndUpdate(
        pricingId,
        {
          tags,
          priceData,
          uniform,
          // Update the link: ID to link, or null to detach
          basePricingId: basePricingId || null
        },
        { new: true, runValidators: true }
      );

      if (!updatedPricing) {
        return res.status(404).json({ message: "Pricing structure not found" });
      }

      res.status(200).json({
        message: "Pricing structure updated successfully",
        pricing: updatedPricing
      });

    } catch (err) {
      console.error("Update Pricing Error:", err);
      res.status(500).json({ message: err.message });
    }
  }
];

exports.deletePricing = async (req, res) => {
  try {
    const { pricingId } = req.params; // Assumes route is /api/pricing/:id

    const deletedPricing = await Pricing.findByIdAndDelete(pricingId);

    if (!deletedPricing) {
      return res.status(404).json({ message: "Pricing structure not found" });
    }

    res.status(200).json({
      message: "Pricing structure deleted successfully",
      _id: deletedPricing._id
    });

  } catch (err) {
    console.error("Delete Pricing Error:", err);
    res.status(500).json({ message: err.message });
  }
};