const BasePricing = require('../models/basePricing');
const Pricing = require('../models/pricing');
const { body, validationResult } = require('express-validator');

exports.basePricingList = async (req, res) => {
    try {
        const basePricings = await BasePricing.find();
        res.json(basePricings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBasePricingById = async (req, res) => {
    try {
        const basePricingUnique = await BasePricing.findById(req.params.basePricingId);
        res.json(basePricingUnique);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBasePricingByCategory = async (req, res) => {
    try {
        const basePricings = await BasePricing.find({ category: req.params.categoryName });
        res.json(basePricings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createBasePricing = [
    body('tags')
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),

    body('category')
        .trim()
        .isLength({ min: 1 })
        .withMessage("Category is required"),

    body('basePriceData')
        .isArray({ min: 1 })
        .withMessage("Base price data must be an array with at least one item"),

    body('basePriceData.*.size')
        .exists()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Size is required"),

    body('basePriceData.*.price')
        .toFloat()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { tags, category, basePriceData } = req.body;
            const newBasePricing = new BasePricing({
                tags,
                category,
                basePriceData
            });
            await newBasePricing.save();

            res.status(201).json({
                message: "Base pricing created successfully",
                basePricing: newBasePricing
            });
        } catch (error) {
            console.error("Create Base Pricing Error:", error);
            res.status(500).json({ error: error.message });
        }
    }
];

exports.deleteBasePricingDetached = async (req, res) => {
  try {
    const { basePricingId } = req.params;

    // 1. Check if template exists
    const template = await BasePricing.findById(basePricingId);
    if (!template) {
      return res.status(404).json({ message: "Base pricing template not found" });
    }

    // 2. Detach Children: Find all linked Pricing structures and remove the reference
    const updateResult = await Pricing.updateMany(
      { basePricingId: basePricingId },
      { $set: { basePricingId: null } }
    );

    // 3. Delete the Template
    await BasePricing.findByIdAndDelete(basePricingId);

    res.status(200).json({
      message: "Template deleted successfully. Linked structures have been detached.",
      detachedCount: updateResult.modifiedCount
    });

  } catch (err) {
    console.error("Detach Delete Error:", err);
    res.status(500).json({ message: "Server error during detached delete." });
  }
};

exports.deleteBasePricingCascade = async (req, res) => {
  try {
    const { basePricingId } = req.params;

    // 1. Check if template exists
    const template = await BasePricing.findById(basePricingId);
    if (!template) {
      return res.status(404).json({ message: "Base pricing template not found" });
    }

    // 2. Cascade Delete: Delete all Pricing structures linked to this template
    const deleteResult = await Pricing.deleteMany({ basePricingId: basePricingId });

    // 3. Delete the Template itself
    await BasePricing.findByIdAndDelete(basePricingId);

    res.status(200).json({
      message: "Template and all associated pricing structures deleted successfully.",
      deletedChildrenCount: deleteResult.deletedCount
    });

  } catch (err) {
    console.error("Cascade Delete Error:", err);
    res.status(500).json({ message: "Server error during cascade delete." });
  }
};

exports.updateBasePricing = [
    // 1. Validation Rules
    body('tags')
        .optional()
        .isArray()
        .withMessage("Tags must be an array"),

    body('category')
        .trim()
        .isLength({ min: 1 })
        .withMessage("Category is required"),

    body('basePriceData')
        .isArray({ min: 1 })
        .withMessage("Base price data must be an array with at least one item"),

    body('basePriceData.*.size')
        .exists()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Size is required"),

    body('basePriceData.*.price')
        .toFloat()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),

    // 2. Controller Logic
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { basePricingId } = req.params; 
        const { tags, category, basePriceData } = req.body;

        try {
            // Step 1: Update the Base Pricing Template itself
            const updatedPricing = await BasePricing.findByIdAndUpdate(
                basePricingId,
                {
                    tags,
                    category,
                    basePriceData
                },
                { new: true, runValidators: true } 
            );

            if (!updatedPricing) {
                return res.status(404).json({ message: "Base pricing template not found" });
            }

            // Step 2: Propagate changes to all linked Pricing Structures
            // We look for Pricing documents where 'baseTemplate' matches this ID.
            // We map 'basePriceData' (from template) to 'priceData' (in Pricing model).
            
            const propagationResult = await Pricing.updateMany(
                { basePricingId: basePricingId }, // Filter: Only those still linked
                { 
                    $set: { 
                        tags: tags, 
                        priceData: basePriceData 
                    } 
                }
            );

            console.log(`Updated Base Template. Propagated changes to ${propagationResult.modifiedCount} linked pricing structures.`);

            res.status(200).json({
                message: "Base pricing updated and changes propagated to linked structures",
                basePricing: updatedPricing,
                linkedStructuresUpdated: propagationResult.modifiedCount
            });

        } catch (error) {
            console.error("Update Base Pricing Error:", error);
            res.status(500).json({ error: error.message });
        }
    }
];